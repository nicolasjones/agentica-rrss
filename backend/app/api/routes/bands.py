from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.models import (
    Band, GeneratedPost, ContentPattern, LearningLog, PostStatus,
    Network, BandMember, BandContext
)
from app.schemas.schemas import (
    BandCreate, BandUpdate, BandResponse, BandProfileResponse,
    LearningProgressResponse, MessageResponse, BandOverviewResponse,
    BandMemberResponse, BandMemberCreate, BandMemberUpdate,
    BandContextResponse, BandContextCreate
)
from app.core.security import get_current_user_id

router = APIRouter(prefix="/bands", tags=["Bands"])


@router.get("/overview", response_model=list[BandOverviewResponse])
async def get_bands_overview(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get a quick overview of all bands for the workspace dashboard."""
    result = await db.execute(
        select(Band)
        .where(Band.owner_id == user_id)
        .options(selectinload(Band.networks))
    )
    bands = result.scalars().all()
    
    overviews = []
    for band in bands:
        # Sum followers
        total_followers = sum(n.followers_count for n in band.networks)
        
        # Count pending posts
        pending_result = await db.execute(
            select(func.count(GeneratedPost.id)).where(
                GeneratedPost.band_id == band.id,
                GeneratedPost.status == PostStatus.PENDING
            )
        )
        pending_count = pending_result.scalar() or 0
        
        # Collect platform icons
        platforms = list(set([n.platform.value for n in band.networks]))
        
        overviews.append(BandOverviewResponse(
            id=band.id,
            name=band.name,
            followers_count=total_followers,
            pending_posts_count=pending_count,
            confidence_score=band.confidence_score or 0.0,
            platform_icons=platforms
        ))
    
    return overviews


@router.post("/", response_model=BandResponse, status_code=status.HTTP_201_CREATED)
async def create_band(
    band_data: BandCreate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    if band_data.tone_keywords and len(band_data.tone_keywords) > 3:
        raise HTTPException(status_code=422, detail="Maximum 3 tone keywords allowed")
    if band_data.values_keywords and len(band_data.values_keywords) > 3:
        raise HTTPException(status_code=422, detail="Maximum 3 values keywords allowed")

    band = Band(owner_id=user_id, **band_data.model_dump(exclude_unset=True))
    db.add(band)
    await db.flush()
    await db.refresh(band)
    return band


@router.get("/", response_model=list[BandResponse])
async def list_bands(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Band).where(Band.owner_id == user_id))
    return result.scalars().all()


@router.get("/{band_id}", response_model=BandResponse)
async def get_band(
    band_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    band = await _get_user_band(db, band_id, user_id)
    return band


@router.put("/{band_id}", response_model=BandResponse)
async def update_band(
    band_id: int,
    band_data: BandUpdate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    band = await _get_user_band(db, band_id, user_id)
    for field, value in band_data.model_dump(exclude_unset=True).items():
        setattr(band, field, value)
    await db.flush()
    await db.refresh(band)
    return band


@router.get("/{band_id}/profile", response_model=BandProfileResponse)
async def get_band_profile(
    band_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    band = await _get_user_band(db, band_id, user_id)

    # Calculate stats
    patterns_result = await db.execute(
        select(func.count(ContentPattern.id)).where(ContentPattern.band_id == band_id)
    )
    patterns_count = patterns_result.scalar() or 0

    approved_result = await db.execute(
        select(func.count(GeneratedPost.id)).where(
            GeneratedPost.band_id == band_id,
            GeneratedPost.status.in_([PostStatus.APPROVED, PostStatus.PUBLISHED]),
        )
    )
    total_result = await db.execute(
        select(func.count(GeneratedPost.id)).where(
            GeneratedPost.band_id == band_id,
            GeneratedPost.status != PostStatus.PENDING,
        )
    )
    approved = approved_result.scalar() or 0
    total = total_result.scalar() or 1
    approval_rate = approved / total if total > 0 else 0.0

    # Determine learning status
    confidence = band.confidence_score or 0.0
    if confidence >= 0.95:
        learning_status = "expert"
    elif confidence >= 0.80:
        learning_status = "proficient"
    else:
        learning_status = "learning"

    return BandProfileResponse(
        band=BandResponse.model_validate(band),
        confidence_score=confidence,
        patterns_count=patterns_count,
        posts_analyzed=0,  # TODO: count from content_posts
        approval_rate=round(approval_rate, 2),
        learning_progress=learning_status,
    )


@router.get("/{band_id}/learning", response_model=LearningProgressResponse)
async def get_learning_progress(
    band_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    band = await _get_user_band(db, band_id, user_id)

    events_result = await db.execute(
        select(func.count(LearningLog.id)).where(LearningLog.band_id == band_id)
    )
    total_events = events_result.scalar() or 0

    patterns_result = await db.execute(
        select(func.count(ContentPattern.id)).where(ContentPattern.band_id == band_id)
    )
    patterns_count = patterns_result.scalar() or 0

    confidence = band.confidence_score or 0.0
    if confidence >= 0.95:
        learning_status = "expert"
    elif confidence >= 0.80:
        learning_status = "proficient"
    else:
        learning_status = "learning"

    return LearningProgressResponse(
        band_id=band_id,
        current_confidence=confidence,
        approval_rate_history=[],  # TODO: populate from snapshots
        patterns_discovered=patterns_count,
        total_learning_events=total_events,
        last_profile_update=None,
        status=learning_status,
    )


# ─── Band Members ────────────────────────────────────

@router.get("/{band_id}/members", response_model=list[BandMemberResponse])
async def get_members(
    band_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    await _get_user_band(db, band_id, user_id)
    result = await db.execute(select(BandMember).where(BandMember.band_id == band_id))
    return result.scalars().all()


@router.post("/{band_id}/members/", response_model=BandMemberResponse)
async def create_member(
    band_id: int,
    member_data: BandMemberCreate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    await _get_user_band(db, band_id, user_id)
    member = BandMember(band_id=band_id, **member_data.model_dump())
    db.add(member)
    await db.flush()
    await db.refresh(member)
    return member


@router.put("/members/{member_id}", response_model=BandMemberResponse)
async def update_member(
    member_id: int,
    member_data: BandMemberUpdate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(BandMember).where(BandMember.id == member_id))
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    await _get_user_band(db, member.band_id, user_id)
    
    for field, value in member_data.model_dump(exclude_unset=True).items():
        setattr(member, field, value)
    
    await db.flush()
    await db.refresh(member)
    return member


# ─── Band Contexts ───────────────────────────────────

@router.get("/{band_id}/contexts/", response_model=list[BandContextResponse])
async def list_contexts(
    band_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    await _get_user_band(db, band_id, user_id)
    result = await db.execute(select(BandContext).where(BandContext.band_id == band_id))
    return result.scalars().all()


@router.post("/{band_id}/contexts/", response_model=BandContextResponse)
async def create_context(
    band_id: int,
    context_data: BandContextCreate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    await _get_user_band(db, band_id, user_id)
    context = BandContext(band_id=band_id, **context_data.model_dump())
    db.add(context)
    await db.flush()
    await db.refresh(context)
    return context


# ─── Helpers ──────────────────────────────────────────

async def _get_user_band(db: AsyncSession, band_id: int, user_id: int) -> Band:
    result = await db.execute(
        select(Band).where(Band.id == band_id, Band.owner_id == user_id)
    )
    band = result.scalar_one_or_none()
    if not band:
        raise HTTPException(status_code=404, detail="Band not found")
    return band
