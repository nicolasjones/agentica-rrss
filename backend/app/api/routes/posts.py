"""
AGENMATICA - Posts Routes
GET /posts/today, POST /posts/:id/approve|edit|reject
"""

from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.db.session import get_db
from app.models.models import (
    Band, GeneratedPost, LearningLog, PostStatus,
    LearningEventType,
)
from app.schemas.schemas import (
    GeneratedPostResponse, TodayPostsResponse,
    PostApproveRequest, PostEditRequest, PostRejectRequest,
    MessageResponse,
)
from app.core.security import get_current_user_id
from app.services.ai.llm_service import get_llm_service

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.get("/today", response_model=TodayPostsResponse)
async def get_today_posts(
    band_id: int = Query(...),
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get today's 5 generated posts for a band."""
    band = await _get_user_band(db, band_id, user_id)

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    result = await db.execute(
        select(GeneratedPost)
        .where(
            GeneratedPost.band_id == band_id,
            GeneratedPost.created_at >= today_start,
            GeneratedPost.created_at < today_end,
        )
        .order_by(GeneratedPost.approval_score.desc())
    )
    posts = result.scalars().all()

    # If no posts yet today, generate them
    if not posts:
        posts = await _generate_daily_posts(db, band)

    # Calculate approval rate
    total_result = await db.execute(
        select(func.count(GeneratedPost.id)).where(
            GeneratedPost.band_id == band_id,
            GeneratedPost.status != PostStatus.PENDING,
        )
    )
    approved_result = await db.execute(
        select(func.count(GeneratedPost.id)).where(
            GeneratedPost.band_id == band_id,
            GeneratedPost.status.in_([PostStatus.APPROVED, PostStatus.PUBLISHED]),
        )
    )
    total = total_result.scalar() or 1
    approved = approved_result.scalar() or 0

    return TodayPostsResponse(
        band_id=band.id,
        band_name=band.name,
        date=today_start.strftime("%Y-%m-%d"),
        posts=[GeneratedPostResponse.model_validate(p) for p in posts],
        approval_rate_current=round(approved / total, 2) if total > 0 else 0.0,
    )


@router.post("/{post_id}/approve", response_model=MessageResponse)
async def approve_post(
    post_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    post = await _get_user_post(db, post_id, user_id)
    post.status = PostStatus.APPROVED
    post.updated_at = datetime.now(timezone.utc)

    # Log learning event
    log = LearningLog(
        band_id=post.band_id,
        event_type=LearningEventType.POST_APPROVED,
        data={"post_id": post_id, "caption_preview": post.caption[:100]},
        impact_score=0.05,
    )
    db.add(log)

    # Trigger optimal time scheduling (async via Celery)
    try:
        from app.tasks.publishing import schedule_approved_posts
        schedule_approved_posts.delay(post.band_id)
    except Exception:
        pass  # Non-critical, post can still be published manually

    return MessageResponse(message="Post approved", detail=f"Post {post_id} queued for publishing")


@router.post("/{post_id}/edit", response_model=MessageResponse)
async def edit_post(
    post_id: int,
    edit_data: PostEditRequest,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    post = await _get_user_post(db, post_id, user_id)
    post.status = PostStatus.EDITED
    post.edited_caption = edit_data.edited_caption
    post.updated_at = datetime.now(timezone.utc)

    # Log learning event (edits have higher impact - system learns what to change)
    log = LearningLog(
        band_id=post.band_id,
        event_type=LearningEventType.POST_EDITED,
        data={
            "post_id": post_id,
            "original": post.caption[:200],
            "edited": edit_data.edited_caption[:200],
        },
        impact_score=0.10,
    )
    db.add(log)

    return MessageResponse(message="Post edited and approved", detail="Edited post queued for publishing")


@router.post("/{post_id}/reject", response_model=MessageResponse)
async def reject_post(
    post_id: int,
    reject_data: PostRejectRequest,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    post = await _get_user_post(db, post_id, user_id)
    post.status = PostStatus.REJECTED
    post.rejection_reason = reject_data.reason
    post.updated_at = datetime.now(timezone.utc)

    # Log learning event (rejections have highest impact)
    log = LearningLog(
        band_id=post.band_id,
        event_type=LearningEventType.POST_REJECTED,
        data={
            "post_id": post_id,
            "caption_preview": post.caption[:200],
            "reason": reject_data.reason,
        },
        impact_score=0.15,
    )
    db.add(log)

    return MessageResponse(message="Post rejected", detail=f"Reason recorded: {reject_data.reason}")


@router.get("/published", response_model=list[GeneratedPostResponse])
async def get_published_posts(
    band_id: int = Query(...),
    limit: int = Query(20, le=100),
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    await _get_user_band(db, band_id, user_id)

    result = await db.execute(
        select(GeneratedPost)
        .where(
            GeneratedPost.band_id == band_id,
            GeneratedPost.status == PostStatus.PUBLISHED,
        )
        .order_by(GeneratedPost.actual_publish_time.desc())
        .limit(limit)
    )
    return result.scalars().all()


# ─── Helpers ─────────────────────────────────────────

async def _generate_daily_posts(db: AsyncSession, band: Band) -> list[GeneratedPost]:
    """Generate today's posts using LLM + image generation + optimal scheduling."""
    from app.services.ai.image_service import get_image_service
    from app.services.analytics.optimal_time import OptimalTimeCalculator
    from app.models.models import ContentPost, Network

    llm = get_llm_service()
    img_service = get_image_service()
    time_calc = OptimalTimeCalculator()

    band_profile = {
        "name": band.name,
        "genre": band.genre,
        "tone_keywords": band.tone_keywords or [],
        "values_keywords": band.values_keywords or [],
        "audience_age_range": band.audience_age_range,
        "audience_location": band.audience_location,
    }

    # Get historical posts for optimal time calculation
    historical_result = await db.execute(
        select(ContentPost)
        .join(Network, Network.id == ContentPost.network_id)
        .where(Network.band_id == band.id)
        .order_by(ContentPost.published_at.desc())
        .limit(200)
    )
    historical = historical_result.scalars().all()
    historical_dicts = [
        {"published_at": p.published_at, "engagement_data": p.engagement_data or {}}
        for p in historical
    ]

    # Calculate today's optimal time slots
    optimal_slots = time_calc.calculate_optimal_times(
        historical_dicts, num_slots=band.posts_per_day, platform="instagram"
    )

    posts = []
    for i in range(band.posts_per_day):
        generated = await llm.generate_post(band_profile, platform="instagram")

        # Generate image for this post
        image_url = None
        image_prompt = None
        try:
            img_result = await img_service.generate_post_image(
                band_profile, generated["caption"], mood="energetic"
            )
            image_url = img_result.get("url")
            image_prompt = img_result.get("prompt_used")
        except Exception:
            pass  # Image gen is optional, post works without it

        # Assign optimal publish time from calculated slots
        publish_time = None
        if i < len(optimal_slots):
            slot = optimal_slots[i]
            from datetime import timedelta
            now = datetime.now(timezone.utc)
            publish_time = now.replace(
                hour=slot["hour"], minute=30, second=0, microsecond=0
            )
            if publish_time <= now:
                publish_time += timedelta(days=1)

        post = GeneratedPost(
            band_id=band.id,
            target_platform="instagram",
            caption=generated["caption"],
            hashtags=generated.get("hashtags"),
            emoji_suggestions=generated.get("emoji"),
            cta=generated.get("cta"),
            image_url=image_url,
            image_prompt=image_prompt,
            suggested_publish_time=publish_time,
            approval_score=generated.get("approval_score"),
            prompt_used=f"Daily post #{i+1}",
            model_used=generated.get("model_used", "unknown"),
            generation_time_ms=generated.get("generation_time_ms"),
        )
        db.add(post)
        posts.append(post)

    await db.flush()
    for p in posts:
        await db.refresh(p)

    return posts


async def _get_user_band(db: AsyncSession, band_id: int, user_id: int) -> Band:
    result = await db.execute(
        select(Band).where(Band.id == band_id, Band.owner_id == user_id)
    )
    band = result.scalar_one_or_none()
    if not band:
        raise HTTPException(status_code=404, detail="Band not found")
    return band


async def _get_user_post(db: AsyncSession, post_id: int, user_id: int) -> GeneratedPost:
    result = await db.execute(
        select(GeneratedPost)
        .join(Band, Band.id == GeneratedPost.band_id)
        .where(GeneratedPost.id == post_id, Band.owner_id == user_id)
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post
