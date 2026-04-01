"""
AGENMATICA - Scanning Task
Full scanning pipeline: fetch posts → analyze tone → discover patterns → update profile.
Triggered when a band connects a new network.
"""

import asyncio
import logging
from datetime import datetime, timezone

from app.core.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.scanning.full_network_scan")
def full_network_scan(network_id: int):
    """
    Complete scanning pipeline for a newly connected network.
    Steps:
    1. Fetch historical posts from platform API
    2. Analyze tone/sentiment for each post via LLM
    3. Run pattern discovery on all posts
    4. Save patterns to DB
    5. Update Band Profile confidence
    6. Generate initial embeddings
    """
    logger.info(f"📡 Starting full scan pipeline for network {network_id}")
    asyncio.run(_full_scan(network_id))
    logger.info(f"✅ Full scan complete for network {network_id}")


async def _full_scan(network_id: int):
    from app.db.session import async_session_factory
    from app.models.models import (
        Network, Band, ContentPost, ContentPattern, LearningLog,
        LearningEventType, PatternStatus,
    )
    from app.services.social.social_service import get_social_service
    from app.services.ai.llm_service import get_llm_service
    from app.services.analytics.pattern_discovery import PatternDiscoveryService as PatternDiscovery
    from sqlalchemy import select

    social = get_social_service()
    llm = get_llm_service()
    pattern_engine = PatternDiscovery()

    async with async_session_factory() as db:
        # Get network + band
        result = await db.execute(select(Network).where(Network.id == network_id))
        network = result.scalar_one_or_none()
        if not network:
            logger.error(f"Network {network_id} not found")
            return

        band_result = await db.execute(
            select(Band).where(Band.id == network.band_id)
        )
        band = band_result.scalar_one_or_none()
        if not band:
            logger.error(f"Band not found for network {network_id}")
            return

        logger.info(f"📡 Step 1/6: Fetching posts from {network.platform.value} for {band.name}")

        # ─── Step 1: Fetch posts ─────────────────────
        posts_data = await social.fetch_posts(
            network.platform.value,
            network.oauth_token,
            limit=100,
        )
        logger.info(f"   Fetched {len(posts_data)} posts")

        # ─── Step 2: Save posts + analyze tone ───────
        logger.info("📡 Step 2/6: Analyzing tone for each post...")
        saved_posts = []
        tone_analyzed = 0

        for post_data in posts_data:
            caption = post_data.get("caption", "")

            # Analyze tone via LLM (batch, with rate limiting)
            tone_analysis = None
            if caption and len(caption) > 10:
                try:
                    tone_analysis = await llm.analyze_tone(caption)
                    tone_analyzed += 1
                except Exception as e:
                    logger.debug(f"Tone analysis failed: {e}")

            # Calculate performance score
            eng = post_data.get("engagement_data", {})
            likes = eng.get("likes", 0)
            comments = eng.get("comments", 0)
            perf_score = (likes + comments * 3) / max(likes + comments, 1)

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
                performance_score=min(perf_score, 1.0),
            )
            db.add(content_post)
            saved_posts.append(post_data)

        logger.info(f"   {tone_analyzed} posts analyzed for tone")

        # ─── Step 3: Discover patterns ───────────────
        logger.info("📡 Step 3/6: Running pattern discovery...")
        patterns = pattern_engine.discover_all_patterns(saved_posts)
        logger.info(f"   Discovered {len(patterns)} patterns")

        # ─── Step 4: Save patterns ───────────────────
        logger.info("📡 Step 4/6: Saving patterns to database...")
        for p in patterns:
            db.add(ContentPattern(
                band_id=band.id,
                pattern_type=p["pattern_type"],
                pattern_name=p["pattern_name"],
                pattern_data=p["pattern_data"],
                avg_performance=p.get("avg_performance", 0),
                confidence=p.get("confidence", 0.5),
                status=PatternStatus.ACTIVE,
            ))

        # ─── Step 5: Update band confidence ──────────
        logger.info("📡 Step 5/6: Updating Band Profile confidence...")
        posts_count = len(saved_posts)
        patterns_count = len(patterns)

        # Confidence based on data quality
        base_confidence = min(0.85, 0.5 + posts_count * 0.002 + patterns_count * 0.03)
        band.confidence_score = max(band.confidence_score or 0, base_confidence)

        # ─── Step 6: Generate embeddings ─────────────
        logger.info("📡 Step 6/6: Generating Band Profile embeddings...")
        try:
            # Build text representation of everything we learned
            top_pattern_names = [p["pattern_name"] for p in patterns[:5]]
            band_text = (
                f"Band: {band.name}. Genre: {band.genre or 'Rock'}. "
                f"Tone: {', '.join(band.tone_keywords or ['energetic'])}. "
                f"Values: {', '.join(band.values_keywords or ['authenticity'])}. "
                f"Audience: {band.audience_age_range or '18-30'}, "
                f"{band.audience_location or 'Argentina'}. "
                f"Patterns: {'; '.join(top_pattern_names)}. "
                f"Posts analyzed: {posts_count}."
            )

            embedding = await llm.generate_embedding(band_text)
            band.band_profile_vector = embedding
            logger.info("   Embeddings generated ✓")
        except Exception as e:
            logger.warning(f"   Embedding generation skipped: {e}")

        # Update network metadata
        network.content_count = posts_count
        network.last_scan = datetime.now(timezone.utc)

        # Log scanning event
        db.add(LearningLog(
            band_id=band.id,
            event_type=LearningEventType.PATTERN_DISCOVERED,
            data={
                "network_id": network_id,
                "platform": network.platform.value,
                "posts_scanned": posts_count,
                "patterns_discovered": patterns_count,
                "confidence_after": band.confidence_score,
                "patterns_summary": [p["pattern_name"] for p in patterns],
            },
            impact_score=0.25,  # Scanning has high impact
        ))

        await db.commit()

        logger.info(
            f"✅ Scan complete for {band.name} ({network.platform.value}): "
            f"{posts_count} posts, {patterns_count} patterns, "
            f"confidence: {band.confidence_score:.2f}"
        )
