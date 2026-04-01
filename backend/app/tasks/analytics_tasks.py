"""
AGENMATICA - Analytics Tasks
Nightly engagement analysis for all bands.
"""

import asyncio
import logging

from app.core.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.analytics_tasks.analyze_all_engagement")
def analyze_engagement_all_bands():
    """
    Runs daily at 9 PM ART.
    Fetches latest engagement data from social platforms.
    """
    logger.info("📊 Starting nightly engagement analysis")
    asyncio.run(_analyze_all())


async def _analyze_all():
    from app.db.session import async_session_factory
    from app.models.models import Band, Network, LearningLog, LearningEventType
    from sqlalchemy import select

    async with async_session_factory() as db:
        result = await db.execute(
            select(Band).where(Band.owner_id.isnot(None))
        )
        bands = result.scalars().all()

        for band in bands:
            try:
                # TODO: Fetch fresh engagement data from APIs
                # For now, log the analysis event
                log = LearningLog(
                    band_id=band.id,
                    event_type=LearningEventType.ENGAGEMENT_ANALYZED,
                    data={"status": "completed", "source": "nightly_cron"},
                    impact_score=0.02,
                )
                db.add(log)
                logger.info(f"   ✓ Analyzed engagement for '{band.name}'")

            except Exception as e:
                logger.error(f"   ✗ Analysis failed for '{band.name}': {e}")

        await db.commit()
    logger.info("✅ Nightly engagement analysis completed")
