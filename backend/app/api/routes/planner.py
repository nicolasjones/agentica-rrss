"""
AGENMATICA - Strategic Planner Routes
Two-phase pipeline: MAPA (concepts) → SEÑAL (signals/captions).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.models import (
    Band, EcosystemEvent, StrategicBatch, StrategicPost,
    BatchStatus, GeneratedPost, PostStatus, PlatformType,
    ContentPattern, PatternStatus, LearningLog, LearningEventType,
)
from app.schemas.schemas import StrategicBatchRead, RefinePostRequest
from app.core.security import get_current_user_id
from app.services.ai.ai_planner import get_ai_planner

router = APIRouter(prefix="/planner", tags=["Planner"])


async def _assert_band_owner(band_id: int, user_id: int, db: AsyncSession) -> Band:
    result = await db.execute(select(Band).where(Band.id == band_id, Band.owner_id == user_id))
    band = result.scalar_one_or_none()
    if not band:
        raise HTTPException(status_code=404, detail="Band not found")
    return band


async def _load_batch(batch_id: int, db: AsyncSession) -> StrategicBatch:
    result = await db.execute(
        select(StrategicBatch)
        .options(selectinload(StrategicBatch.posts), selectinload(StrategicBatch.band))
        .where(StrategicBatch.id == batch_id)
    )
    batch = result.scalar_one_or_none()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch


@router.get("/batches", response_model=list[StrategicBatchRead])
async def list_batches(
    band_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """List all strategic batches for a band (newest first)."""
    await _assert_band_owner(band_id, user_id, db)
    result = await db.execute(
        select(StrategicBatch)
        .options(selectinload(StrategicBatch.posts))
        .where(StrategicBatch.band_id == band_id)
        .order_by(StrategicBatch.created_at.desc())
    )
    return result.scalars().all()


@router.get("/generate", response_model=StrategicBatchRead)
async def generate_batch(
    band_id: int,
    timeframe: str = "weekly",
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Phase 1 — MAPA: Trigger the Strategist Agent.
    Creates a StrategicBatch with concept posts (concept_title + narrative_goal).
    caption is NULL at this stage — the user reviews and approves concepts first.
    """
    band = await _assert_band_owner(band_id, user_id, db)

    events_result = await db.execute(
        select(EcosystemEvent)
        .where(EcosystemEvent.band_id == band_id)
        .order_by(EcosystemEvent.event_date)
    )
    events = events_result.scalars().all()

    planner = get_ai_planner()
    proposed = await planner.generate_batch(band=band, events=events, timeframe=timeframe)

    batch = StrategicBatch(band_id=band_id, timeframe=timeframe, status=BatchStatus.PROPOSED)
    db.add(batch)
    await db.flush()

    for p in proposed:
        db.add(StrategicPost(
            batch_id=batch.id,
            event_id=p.get("event_id"),
            platform=p["platform"],
            concept_title=p.get("concept_title"),
            narrative_goal=p.get("narrative_goal"),
            caption=p.get("caption"),        # None in Phase 1
            hashtags=p.get("hashtags", []),
            scheduled_date=p.get("scheduled_date"),
        ))

    await db.commit()

    result = await db.execute(
        select(StrategicBatch)
        .options(selectinload(StrategicBatch.posts))
        .where(StrategicBatch.id == batch.id)
    )
    return result.scalar_one()


@router.post("/generate-signals", response_model=StrategicBatchRead)
async def generate_signals(
    batch_id: int,
    band_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Phase 2 — SEÑAL: Generate captions for all approved concept posts in a batch.
    Only processes posts where is_approved=True AND caption IS NULL.
    After this call the batch is ready for final production review.
    """
    band = await _assert_band_owner(band_id, user_id, db)
    batch = await _load_batch(batch_id, db)

    if batch.band.owner_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    eligible = [p for p in batch.posts if p.is_approved and p.caption is None]
    if not eligible:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No approved concept posts without captions found in this batch.",
        )

    planner = get_ai_planner()
    signals = await planner.generate_signals(band=band, posts=eligible)

    signal_map = {s["id"]: s for s in signals}
    for post in batch.posts:
        if post.id in signal_map:
            post.caption = signal_map[post.id]["caption"]
            if signal_map[post.id].get("hashtags"):
                post.hashtags = signal_map[post.id]["hashtags"]

    await db.commit()

    result = await db.execute(
        select(StrategicBatch)
        .options(selectinload(StrategicBatch.posts))
        .where(StrategicBatch.id == batch_id)
    )
    return result.scalar_one()


@router.post("/approve-batch")
async def approve_batch(
    batch_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Final publish step: promote approved StrategicPosts (with captions) to GeneratedPost.
    Marks batch as ACCEPTED.
    """
    batch = await _load_batch(batch_id, db)

    if batch.band.owner_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    promoted = 0
    for sp in batch.posts:
        if sp.is_approved and sp.caption:
            try:
                platform_enum = PlatformType(sp.platform.lower())
            except ValueError:
                platform_enum = PlatformType.INSTAGRAM

            db.add(GeneratedPost(
                band_id=batch.band_id,
                target_platform=platform_enum,
                caption=sp.caption,
                hashtags=sp.hashtags or [],
                suggested_publish_time=sp.scheduled_date,
                status=PostStatus.PENDING,
            ))
            promoted += 1

    batch.status = BatchStatus.ACCEPTED
    await db.commit()
    return {"promoted_posts": promoted, "batch_id": batch_id, "status": "accepted"}


@router.get("/pulse")
async def get_pulse(
    band_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Phase 4 — Telemetría Pulse.
    Returns ADN confidence score, regional sync status, and active content pattern nodes.
    Displayed in the Planner header to give the artist a 'command' context of their AI profile.
    """
    band = await _assert_band_owner(band_id, user_id, db)

    patterns_result = await db.execute(
        select(ContentPattern)
        .where(ContentPattern.band_id == band_id, ContentPattern.status == PatternStatus.ACTIVE)
        .order_by(ContentPattern.confidence.desc())
        .limit(5)
    )
    active_patterns = patterns_result.scalars().all()

    return {
        "confidence_score": round(band.confidence_score or 0.0, 2),
        "regional_sync": bool(band.use_regional_slang),
        "active_nodes": [
            {"name": p.pattern_name, "type": p.pattern_type, "confidence": round(p.confidence or 0.0, 2)}
            for p in active_patterns
        ],
    }


@router.post("/reject-concept")
async def reject_concept(
    post_id: int,
    band_id: int,
    reason: str = "other",
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Phase 4 — Learning trigger.
    Called when a user rejects a concept (MAPA phase).
    Creates a LearningLog entry so the ADN can adapt tone/strategy over time.
    """
    await _assert_band_owner(band_id, user_id, db)

    result = await db.execute(select(StrategicPost).where(StrategicPost.id == post_id))
    sp = result.scalar_one_or_none()
    if not sp:
        raise HTTPException(status_code=404, detail="Strategic post not found")

    db.add(LearningLog(
        band_id=band_id,
        event_type=LearningEventType.POST_REJECTED,
        data={
            "post_id": post_id,
            "concept_title": sp.concept_title,
            "narrative_goal": sp.narrative_goal,
            "reason": reason,
        },
        impact_score=0.3,
    ))
    await db.commit()
    return {"logged": True, "event_type": "post_rejected", "post_id": post_id}


@router.post("/refine-post", response_model=dict)
async def refine_post(
    band_id: int,
    payload: RefinePostRequest,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Regenerate a single StrategicPost caption with targeted user feedback."""
    band = await _assert_band_owner(band_id, user_id, db)

    result = await db.execute(select(StrategicPost).where(StrategicPost.id == payload.post_id))
    sp = result.scalar_one_or_none()
    if not sp:
        raise HTTPException(status_code=404, detail="Strategic post not found")

    planner = get_ai_planner()
    refined = await planner.refine_post(
        band=band,
        original_caption=sp.caption or "",
        platform=sp.platform,
        feedback=payload.feedback,
    )

    sp.caption = refined["caption"]
    sp.hashtags = refined.get("hashtags", sp.hashtags)
    await db.commit()
    await db.refresh(sp)

    return {"id": sp.id, "caption": sp.caption, "hashtags": sp.hashtags}
