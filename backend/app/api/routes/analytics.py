"""
AGENMATICA - Analytics Routes
GET /analytics/overview, GET /analytics/:platform
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.schemas import AnalyticsOverview, PlatformAnalytics, AggregatedAnalytics
from app.models.models import Band, Network
from sqlalchemy import select, func
from app.core.security import get_current_user_id

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/aggregate", response_model=AggregatedAnalytics)
async def get_aggregate(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregated metrics across all projects/bands for a user."""
    # 1. Get all bands for the user
    bands_result = await db.execute(
        select(Band).where(Band.owner_id == user_id)
    )
    bands = bands_result.scalars().all()
    band_ids = [b.id for b in bands]
    
    if not band_ids:
        return AggregatedAnalytics(
            total_followers=0,
            total_engagement=0,
            project_count=0,
            avg_confidence=0.0,
            global_growth_week=0.0
        )

    # 2. Sum followers from all networks linked to these bands
    followers_result = await db.execute(
        select(func.sum(Network.followers_count))
        .where(Network.band_id.in_(band_ids))
    )
    total_followers = followers_result.scalar() or 0

    # 3. Calculate avg confidence and project count
    project_count = len(bands)
    avg_confidence = sum(b.confidence_score for b in bands) / project_count if project_count > 0 else 0.0

    # TODO: Implement real engagement and growth calculation
    # For now, returning realistic mock based on volumes
    return AggregatedAnalytics(
        total_followers=total_followers,
        total_engagement=int(total_followers * 0.15),
        project_count=project_count,
        avg_confidence=avg_confidence,
        global_growth_week=8.4
    )


@router.get("/overview", response_model=AnalyticsOverview)
async def get_overview(
    band_id: int = Query(...),
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get unified analytics overview across all platforms."""
    # TODO: Implement real analytics aggregation
    # For now, return mock data structure
    return AnalyticsOverview(
        total_followers=15234,
        followers_growth_week=1245,
        followers_growth_percent=8.9,
        total_engagement=4520,
        engagement_rate=8.5,
        posts_published_week=12,
        top_post_caption="Viernes en Niceto Club. Energía pura 🎸",
        top_post_likes=420,
        approval_rate=0.82,
        confidence_score=0.78,
        platform_breakdown=[
            PlatformAnalytics(
                platform="instagram",
                followers=8500,
                avg_likes=450,
                avg_comments=32,
                engagement_rate=9.2,
                top_content_type="Reels"
            ),
            PlatformAnalytics(
                platform="tiktok",
                followers=5234,
                avg_likes=1200,
                avg_comments=150,
                avg_views=15000,
                engagement_rate=12.5,
                top_content_type="Trends"
            ),
            PlatformAnalytics(
                platform="twitter",
                followers=1500,
                avg_likes=50,
                avg_comments=10,
                engagement_rate=4.2,
                top_content_type="Threads"
            )
        ]
    )


@router.get("/{platform}", response_model=PlatformAnalytics)
async def get_platform_analytics(
    platform: str,
    band_id: int = Query(...),
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get platform-specific analytics."""
    # TODO: Implement real per-platform analytics
    return PlatformAnalytics(
        platform=platform,
        followers=8000 if platform == "instagram" else 5000,
        avg_likes=150.0,
        avg_comments=12.0,
        avg_views=3200.0 if platform == "tiktok" else None,
        engagement_rate=8.5,
        top_content_type="show_announcement",
    )
