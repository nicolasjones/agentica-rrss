"""
AGENMATICA - Learning Tasks
Weekly learning loop + monthly profile refresh.
Core differentiator: system gets smarter over time.
"""

import asyncio
import logging

from app.core.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.learning.run_weekly_learning")
def run_weekly_learning():
    """
    Runs every Sunday at midnight.
    Re-discovers patterns, adjusts Band Profile weights.
    Formula: 0.95 * old_profile + 0.05 * new_learning
    """
    logger.info("🧠 Starting weekly learning loop")
    asyncio.run(_weekly_learning())
    logger.info("✅ Weekly learning loop complete")


async def _weekly_learning():
    from app.db.session import async_session_factory
    from app.models.models import (
        Band, LearningLog, ContentPattern, GeneratedPost,
        PostStatus, LearningEventType, PatternStatus,
    )
    from sqlalchemy import select, func
    from datetime import datetime, timedelta, timezone

    async with async_session_factory() as db:
        result = await db.execute(select(Band))
        bands = result.scalars().all()

        for band in bands:
            try:
                week_ago = datetime.now(timezone.utc) - timedelta(days=7)

                # 1. Count this week's learning events
                events_result = await db.execute(
                    select(func.count(LearningLog.id)).where(
                        LearningLog.band_id == band.id,
                        LearningLog.timestamp >= week_ago,
                    )
                )
                weekly_events = events_result.scalar() or 0

                # 2. Calculate this week's approval rate
                total_result = await db.execute(
                    select(func.count(GeneratedPost.id)).where(
                        GeneratedPost.band_id == band.id,
                        GeneratedPost.created_at >= week_ago,
                        GeneratedPost.status != PostStatus.PENDING,
                    )
                )
                approved_result = await db.execute(
                    select(func.count(GeneratedPost.id)).where(
                        GeneratedPost.band_id == band.id,
                        GeneratedPost.created_at >= week_ago,
                        GeneratedPost.status.in_([
                            PostStatus.APPROVED, PostStatus.PUBLISHED
                        ]),
                    )
                )
                total = total_result.scalar() or 0
                approved = approved_result.scalar() or 0
                weekly_rate = approved / total if total > 0 else 0.0

                # 3. Update confidence score (gradual improvement)
                old_confidence = band.confidence_score or 0.5
                learning_factor = 0.05  # 5% weight to new data
                new_confidence = min(
                    0.99,
                    (1 - learning_factor) * old_confidence + learning_factor * weekly_rate
                )
                band.confidence_score = round(new_confidence, 4)

                # 4. Discover new patterns from rejections
                rejections = await db.execute(
                    select(LearningLog).where(
                        LearningLog.band_id == band.id,
                        LearningLog.event_type == LearningEventType.POST_REJECTED,
                        LearningLog.timestamp >= week_ago,
                    )
                )
                rejection_reasons = []
                for log in rejections.scalars().all():
                    if log.data and "reason" in log.data:
                        rejection_reasons.append(log.data["reason"])

                # If we have rejection patterns, log them
                if rejection_reasons:
                    pattern = ContentPattern(
                        band_id=band.id,
                        pattern_type="rejection_trend",
                        pattern_name=f"Week rejection patterns ({len(rejection_reasons)} events)",
                        pattern_data={"reasons": rejection_reasons},
                        avg_performance=weekly_rate,
                        confidence=new_confidence,
                        status=PatternStatus.ACTIVE,
                    )
                    db.add(pattern)

                # 5. Log learning event
                learning_event = LearningLog(
                    band_id=band.id,
                    event_type=LearningEventType.PROFILE_UPDATED,
                    data={
                        "weekly_events": weekly_events,
                        "weekly_approval_rate": round(weekly_rate, 3),
                        "old_confidence": old_confidence,
                        "new_confidence": new_confidence,
                        "rejection_count": len(rejection_reasons),
                    },
                    impact_score=abs(new_confidence - old_confidence),
                )
                db.add(learning_event)

                await db.commit()
                logger.info(
                    f"✅ {band.name}: confidence {old_confidence:.3f} → {new_confidence:.3f} "
                    f"(events: {weekly_events}, approval: {weekly_rate:.1%})"
                )

            except Exception as e:
                logger.error(f"❌ Learning failed for {band.name}: {e}")
                await db.rollback()


@celery_app.task(name="app.tasks.learning.refresh_all_profiles")
def refresh_all_profiles():
    """
    Runs monthly. Regenerates embeddings for all bands.
    Snapshots current profile for evolution tracking.
    """
    logger.info("🔄 Starting monthly profile refresh")
    asyncio.run(_refresh_profiles())
    logger.info("✅ Monthly profile refresh complete")


async def _refresh_profiles():
    from app.db.session import async_session_factory
    from app.models.models import Band, BandProfileEvolution, ContentPattern
    from app.services.ai.llm_service import get_llm_service
    from sqlalchemy import select, func

    llm = get_llm_service()

    async with async_session_factory() as db:
        result = await db.execute(select(Band))
        bands = result.scalars().all()

        for band in bands:
            try:
                # Build text representation of band for embedding
                band_text = (
                    f"Band: {band.name}. Genre: {band.genre or 'Rock'}. "
                    f"Tone: {', '.join(band.tone_keywords or ['energetic'])}. "
                    f"Values: {', '.join(band.values_keywords or ['authenticity'])}. "
                    f"Audience: {band.audience_age_range or '18-30'}, "
                    f"{band.audience_location or 'Argentina'}."
                )

                # Generate new embedding
                embedding = await llm.generate_embedding(band_text)
                band.band_profile_vector = embedding

                # Count patterns
                patterns_count = await db.execute(
                    select(func.count(ContentPattern.id)).where(
                        ContentPattern.band_id == band.id
                    )
                )

                # Save snapshot
                snapshot = BandProfileEvolution(
                    band_id=band.id,
                    profile_vector=embedding,
                    confidence_score=band.confidence_score or 0.0,
                    patterns_count=patterns_count.scalar() or 0,
                    approval_rate=0.0,  # TODO: calculate from recent data
                )
                db.add(snapshot)

                await db.commit()
                logger.info(f"✅ Profile refreshed for {band.name}")

            except Exception as e:
                logger.error(f"❌ Profile refresh failed for {band.name}: {e}")
                await db.rollback()


@celery_app.task(name="app.tasks.learning.scan_network_content")
def scan_network_content(network_id: int):
    """Triggered when a band connects a new network."""
    logger.info(f"📡 Scanning network {network_id}")
    asyncio.run(_scan_network(network_id))


async def _scan_network(network_id: int):
    from app.db.session import async_session_factory
    from app.models.models import Network, ContentPost, LearningLog, LearningEventType
    from app.services.social.social_service import get_social_service
    from app.services.ai.llm_service import get_llm_service
    from sqlalchemy import select
    from datetime import datetime, timezone

    social = get_social_service()
    llm = get_llm_service()

    async with async_session_factory() as db:
        result = await db.execute(select(Network).where(Network.id == network_id))
        network = result.scalar_one_or_none()
        if not network:
            logger.error(f"Network {network_id} not found")
            return

        # Fetch posts from platform
        posts = await social.fetch_posts(
            network.platform.value, network.oauth_token, limit=100
        )

        for post_data in posts:
            # Analyze tone with LLM
            caption = post_data.get("caption", "")
            tone_analysis = None
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

        network.content_count = len(posts)
        network.last_scan = datetime.now(timezone.utc)

        # ── Run Pattern Discovery ──────────────────────────
        from app.services.analytics.pattern_discovery import PatternDiscoveryService as PatternDiscovery
        from app.models.models import ContentPattern, PatternStatus

        discoverer = PatternDiscovery()
        discovered = discoverer.discover_all_patterns(posts)

        for pattern_data in discovered:
            pattern = ContentPattern(
                band_id=network.band_id,
                pattern_type=pattern_data["pattern_type"],
                pattern_name=pattern_data["pattern_name"],
                pattern_data=pattern_data["pattern_data"],
                avg_performance=pattern_data.get("avg_performance", 0),
                confidence=pattern_data.get("confidence", 0),
                status=PatternStatus.ACTIVE,
            )
            db.add(pattern)

        logger.info(f"🔍 Discovered {len(discovered)} patterns for band {network.band_id}")

        # Log scanning event
        db.add(LearningLog(
            band_id=network.band_id,
            event_type=LearningEventType.PATTERN_DISCOVERED,
            data={
                "network_id": network_id,
                "posts_scanned": len(posts),
                "patterns_discovered": len(discovered),
                "pattern_types": [p["pattern_type"] for p in discovered],
            },
            impact_score=0.20,
        ))

        await db.commit()
        logger.info(f"✅ Scanned {len(posts)} posts + {len(discovered)} patterns from {network.platform.value}")
