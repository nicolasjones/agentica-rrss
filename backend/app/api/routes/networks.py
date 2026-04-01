"""
AGENMATICA - Networks Routes
Connect social networks, trigger scans, check status.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.models import Band, Network, ContentPost, PlatformType
from app.schemas.schemas import NetworkConnect, NetworkResponse, ScanStatusResponse, MessageResponse
from app.core.security import get_current_user_id
from app.services.social.social_service import get_social_service

router = APIRouter(prefix="/networks", tags=["Networks"])


@router.get("/", response_model=list[NetworkResponse])
async def list_networks(
    band_id: int = Query(...),
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    await _verify_band_ownership(db, band_id, user_id)
    result = await db.execute(select(Network).where(Network.band_id == band_id))
    return result.scalars().all()


@router.post("/connect/{platform}", response_model=NetworkResponse)
async def connect_network(
    platform: str,
    band_id: int = Query(...),
    connect_data: NetworkConnect = None,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Connect a social network via OAuth (or mock)."""
    await _verify_band_ownership(db, band_id, user_id)

    # Validate platform
    try:
        platform_enum = PlatformType(platform.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Unsupported platform: {platform}")

    # Check not already connected
    existing = await db.execute(
        select(Network).where(
            Network.band_id == band_id,
            Network.platform == platform_enum,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"{platform} already connected")

    # Exchange OAuth code for token
    social = get_social_service()
    token_data = await social.exchange_code(platform, connect_data.oauth_code if connect_data else "mock")

    # Get profile info
    profile = await social.get_profile(platform, token_data["access_token"])

    network = Network(
        band_id=band_id,
        platform=platform_enum,
        oauth_token=token_data["access_token"],
        oauth_refresh_token=token_data.get("refresh_token"),
        external_user_id=token_data.get("user_id") or profile.get("user_id"),
        username=profile.get("username"),
        followers_count=profile.get("followers_count", 0),
        content_count=profile.get("posts_count", 0),
    )
    db.add(network)
    await db.flush()
    await db.refresh(network)

    return network


@router.post("/{network_id}/scan", response_model=MessageResponse)
async def trigger_scan(
    network_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Trigger a content scan for a connected network."""
    network = await _get_user_network(db, network_id, user_id)

    # In production, this dispatches a Celery task
    # For now, scan synchronously (mock is fast)
    social = get_social_service()
    posts = await social.fetch_posts(
        network.platform.value,
        network.oauth_token,
        limit=100,
    )

    from app.models.models import ContentPost, ContentPattern, LearningLog, LearningEventType
    from app.services.ai.llm_service import get_llm_service
    from app.services.analytics.pattern_discovery import PatternDiscoveryService
    from datetime import datetime, timezone

    llm = get_llm_service()

    # 1. Save scanned posts + LLM tone analysis
    saved_posts = []
    for post_data in posts:
        # Analyze tone if caption exists
        tone_analysis = None
        caption = post_data.get("caption", "")
        if caption:
            try:
                tone_analysis = await llm.analyze_tone(caption)
            except Exception:
                pass

        content_post = ContentPost(
            network_id=network.id,
            platform_post_id=post_data["platform_post_id"],
            caption=caption,
            media_type=post_data.get("media_type"),
            media_url=post_data.get("media_url"),
            published_at=post_data.get("published_at"),
            permalink=post_data.get("permalink"),
            engagement_data=post_data.get("engagement_data"),
            tone_analysis=tone_analysis,
        )
        db.add(content_post)
        saved_posts.append(post_data | {"tone_analysis": tone_analysis})

    # 2. Run pattern discovery
    discovery = PatternDiscoveryService()
    patterns = discovery.discover_all_patterns(saved_posts)

    for p in patterns:
        db.add(ContentPattern(
            band_id=network.band_id,
            pattern_type=p["pattern_type"],
            pattern_name=p["pattern_name"],
            pattern_data=p["pattern_data"],
            avg_performance=p["avg_performance"],
            confidence=p["confidence"],
        ))

    # 3. Log scanning event
    db.add(LearningLog(
        band_id=network.band_id,
        event_type=LearningEventType.PATTERN_DISCOVERED,
        data={
            "network_id": network_id,
            "posts_scanned": len(posts),
            "patterns_found": len(patterns),
        },
        impact_score=0.20,
    ))

    network.content_count = len(posts)
    network.last_scan = datetime.now(timezone.utc)
    await db.flush()

    return MessageResponse(
        message=f"Scan completed: {len(posts)} posts analyzed, {len(patterns)} patterns discovered",
        detail=f"Network {network.platform.value} scanned successfully",
    )


@router.delete("/{network_id}", response_model=MessageResponse)
async def disconnect_network(
    network_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Disconnect a network and hard-reset all associated data."""
    from sqlalchemy import delete
    network = await _get_user_network(db, network_id, user_id)
    platform_name = network.platform.value

    # Hard-Reset: delete all scanned content for this network
    await db.execute(delete(ContentPost).where(ContentPost.network_id == network_id))
    await db.delete(network)
    await db.flush()

    return MessageResponse(
        message=f"{platform_name} disconnected successfully",
        detail="All associated content posts have been cleared.",
    )


@router.get("/{network_id}/status", response_model=ScanStatusResponse)
async def get_scan_status(
    network_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    network = await _get_user_network(db, network_id, user_id)

    return ScanStatusResponse(
        network_id=network.id,
        status="completed" if network.last_scan else "pending",
        posts_scanned=network.content_count,
        patterns_discovered=0,  # TODO: count from content_patterns
        progress_percent=100.0 if network.last_scan else 0.0,
    )


# ─── Helpers ─────────────────────────────────────────

async def _verify_band_ownership(db: AsyncSession, band_id: int, user_id: int):
    result = await db.execute(
        select(Band).where(Band.id == band_id, Band.owner_id == user_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Band not found")


async def _get_user_network(db: AsyncSession, network_id: int, user_id: int) -> Network:
    result = await db.execute(
        select(Network)
        .join(Band, Band.id == Network.band_id)
        .where(Network.id == network_id, Band.owner_id == user_id)
    )
    network = result.scalar_one_or_none()
    if not network:
        raise HTTPException(status_code=404, detail="Network not found")
    return network
