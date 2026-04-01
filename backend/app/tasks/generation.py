"""
AGENMATICA - Generation Tasks
Daily post generation for all active bands.
"""

import asyncio
import logging

from app.core.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.generation.generate_all_daily_posts")
def generate_all_daily_posts():
    """
    Runs daily at 8:00 AM ART.
    Generates 5 posts for each active band.
    """
    logger.info("🎸 Starting daily post generation for all bands")
    asyncio.run(_generate_all())
    logger.info("✅ Daily post generation complete")


async def _generate_all():
    from app.db.session import async_session_factory
    from app.models.models import Band, GeneratedPost
    from app.services.ai.llm_service import get_llm_service
    from sqlalchemy import select

    llm = get_llm_service()

    async with async_session_factory() as db:
        result = await db.execute(
            select(Band).where(Band.owner_id.isnot(None))
        )
        bands = result.scalars().all()

        for band in bands:
            try:
                logger.info(f"Generating posts for: {band.name}")
                band_profile = {
                    "name": band.name,
                    "genre": band.genre,
                    "tone_keywords": band.tone_keywords or [],
                    "values_keywords": band.values_keywords or [],
                    "audience_age_range": band.audience_age_range,
                    "audience_location": band.audience_location,
                }

                for i in range(band.posts_per_day):
                    generated = await llm.generate_post(
                        band_profile, platform="instagram"
                    )
                    post = GeneratedPost(
                        band_id=band.id,
                        target_platform="instagram",
                        caption=generated["caption"],
                        hashtags=generated.get("hashtags"),
                        emoji_suggestions=generated.get("emoji"),
                        cta=generated.get("cta"),
                        approval_score=generated.get("approval_score"),
                        prompt_used=f"Daily post #{i+1}",
                        model_used=generated.get("model_used", "unknown"),
                        generation_time_ms=generated.get("generation_time_ms"),
                    )
                    db.add(post)

                await db.commit()
                logger.info(f"✅ {band.posts_per_day} posts generated for {band.name}")

            except Exception as e:
                logger.error(f"❌ Failed generating posts for {band.name}: {e}")
                await db.rollback()


@celery_app.task(name="app.tasks.generation.generate_band_posts")
def generate_band_posts(band_id: int):
    """Generate posts for a specific band (on-demand)."""
    logger.info(f"🎸 Generating posts for band {band_id}")
    asyncio.run(_generate_for_band(band_id))


async def _generate_for_band(band_id: int):
    from app.db.session import async_session_factory
    from app.models.models import Band, GeneratedPost
    from app.services.ai.llm_service import get_llm_service
    from sqlalchemy import select

    llm = get_llm_service()

    async with async_session_factory() as db:
        result = await db.execute(select(Band).where(Band.id == band_id))
        band = result.scalar_one_or_none()
        if not band:
            logger.error(f"Band {band_id} not found")
            return

        band_profile = {
            "name": band.name,
            "genre": band.genre,
            "tone_keywords": band.tone_keywords or [],
            "values_keywords": band.values_keywords or [],
            "audience_age_range": band.audience_age_range,
            "audience_location": band.audience_location,
        }

        for i in range(band.posts_per_day):
            generated = await llm.generate_post(band_profile, platform="instagram")
            post = GeneratedPost(
                band_id=band.id,
                target_platform="instagram",
                caption=generated["caption"],
                hashtags=generated.get("hashtags"),
                emoji_suggestions=generated.get("emoji"),
                cta=generated.get("cta"),
                approval_score=generated.get("approval_score"),
                prompt_used=f"On-demand post #{i+1}",
                model_used=generated.get("model_used", "unknown"),
                generation_time_ms=generated.get("generation_time_ms"),
            )
            db.add(post)

        await db.commit()
        logger.info(f"✅ {band.posts_per_day} posts generated for {band.name}")
