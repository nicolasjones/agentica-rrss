"""
AGENMATICA - Auto-Publishing Task
Publishes approved/edited posts at their optimal time.
Runs every 15 minutes checking for posts due for publishing.

Flow:
1. Query posts with status APPROVED/EDITED where suggested_publish_time <= now
2. For each, call social service to publish
3. Update status to PUBLISHED (or FAILED)
4. Log learning event
"""

import asyncio
import logging
from datetime import datetime, timezone, timedelta

from app.core.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.publishing.check_and_publish")
def check_and_publish():
    """Check for approved posts due for publishing and publish them."""
    logger.info("📤 Checking for posts to publish...")
    asyncio.run(_publish_due_posts())


async def _publish_due_posts():
    from app.db.session import async_session_factory
    from app.models.models import (
        Band, GeneratedPost, Network, LearningLog,
        PostStatus, LearningEventType, PlatformType,
    )
    from app.services.social.social_service import get_social_service
    from sqlalchemy import select

    social = get_social_service()
    now = datetime.now(timezone.utc)
    window = now + timedelta(minutes=5)

    async with async_session_factory() as db:
        # Posts ready to publish: approved AND (scheduled time passed OR unscheduled >30min)
        result = await db.execute(
            select(GeneratedPost)
            .where(
                GeneratedPost.status.in_([PostStatus.APPROVED, PostStatus.EDITED]),
                (
                    (GeneratedPost.suggested_publish_time != None) &
                    (GeneratedPost.suggested_publish_time <= window)
                ) | (
                    (GeneratedPost.suggested_publish_time == None) &
                    (GeneratedPost.updated_at <= now - timedelta(minutes=30))
                ),
            )
            .order_by(GeneratedPost.suggested_publish_time.asc().nullslast())
            .limit(20)
        )
        posts = result.scalars().all()

        if not posts:
            logger.info("📤 No posts due for publishing")
            return

        logger.info(f"📤 Found {len(posts)} posts to publish")

        for post in posts:
            try:
                # Get band
                band_result = await db.execute(
                    select(Band).where(Band.id == post.band_id)
                )
                band = band_result.scalar_one_or_none()
                if not band or not band.auto_publish:
                    continue

                # Find active network for target platform
                platform_value = (
                    post.target_platform.value
                    if isinstance(post.target_platform, PlatformType)
                    else str(post.target_platform)
                )
                network_result = await db.execute(
                    select(Network).where(
                        Network.band_id == post.band_id,
                        Network.platform == platform_value,
                        Network.is_active == True,
                    )
                )
                network = network_result.scalar_one_or_none()
                if not network:
                    logger.warning(f"No active {platform_value} for band '{band.name}'")
                    continue

                # Build final caption (edited or original + hashtags)
                caption = post.edited_caption or post.caption
                if post.hashtags:
                    caption = f"{caption}\n\n{' '.join(post.hashtags)}"

                # Publish via social service
                pub_result = await social.publish_post(
                    platform=platform_value,
                    token=network.oauth_token,
                    caption=caption,
                    media_url=post.image_url,
                )

                if pub_result.get("success"):
                    post.status = PostStatus.PUBLISHED
                    post.actual_publish_time = now
                    db.add(LearningLog(
                        band_id=post.band_id,
                        event_type=LearningEventType.ENGAGEMENT_ANALYZED,
                        data={
                            "post_id": post.id,
                            "platform": platform_value,
                            "platform_post_id": pub_result.get("platform_post_id"),
                            "action": "auto_published",
                        },
                        impact_score=0.03,
                    ))
                    logger.info(f"✅ Published post {post.id} for '{band.name}'")
                else:
                    post.status = PostStatus.FAILED
                    logger.error(f"❌ Publish failed for post {post.id}")

            except Exception as e:
                post.status = PostStatus.FAILED
                logger.error(f"❌ Exception publishing post {post.id}: {e}")

        await db.commit()


@celery_app.task(name="app.tasks.publishing.schedule_approved_posts")
def schedule_approved_posts(band_id: int):
    """Assign optimal publish times to newly approved posts."""
    logger.info(f"⏰ Scheduling posts for band {band_id}")
    asyncio.run(_schedule_posts(band_id))


async def _schedule_posts(band_id: int):
    from app.db.session import async_session_factory
    from app.models.models import GeneratedPost, ContentPost, Network, PostStatus
    from app.services.analytics.optimal_time import OptimalTimeCalculator
    from sqlalchemy import select

    calculator = OptimalTimeCalculator()
    now = datetime.now(timezone.utc)

    async with async_session_factory() as db:
        # Get historical posts for time analysis
        networks = await db.execute(
            select(Network).where(Network.band_id == band_id)
        )
        network_ids = [n.id for n in networks.scalars().all()]

        historical = []
        if network_ids:
            hist_result = await db.execute(
                select(ContentPost)
                .where(ContentPost.network_id.in_(network_ids))
                .order_by(ContentPost.published_at.desc())
                .limit(200)
            )
            for p in hist_result.scalars().all():
                historical.append({
                    "published_at": p.published_at.isoformat() if p.published_at else None,
                    "engagement_data": p.engagement_data or {},
                })

        # Get unscheduled approved posts
        unscheduled = await db.execute(
            select(GeneratedPost).where(
                GeneratedPost.band_id == band_id,
                GeneratedPost.status.in_([PostStatus.APPROVED, PostStatus.EDITED]),
                GeneratedPost.suggested_publish_time == None,
            )
        )
        posts = unscheduled.scalars().all()
        if not posts:
            return

        # Calculate optimal slots
        top_slots = calculator.calculate_optimal_times(
            historical, num_slots=len(posts), platform="instagram"
        )

        # Assign times spread across slots
        for i, post in enumerate(posts):
            if i < len(top_slots):
                slot = top_slots[i]
                target = _next_weekday(now, slot["day_name"].lower())
                publish_time = target.replace(
                    hour=slot["hour"], minute=30, second=0, microsecond=0
                )
                if publish_time <= now:
                    publish_time += timedelta(days=7)
                post.suggested_publish_time = publish_time
            else:
                fallback = now + timedelta(days=1 + i)
                post.suggested_publish_time = fallback.replace(hour=19, minute=0, second=0)

        await db.commit()
        logger.info(f"⏰ Scheduled {len(posts)} posts for band {band_id}")


def _next_weekday(from_date: datetime, day_name: str) -> datetime:
    day_map = {
        "monday": 0, "tuesday": 1, "wednesday": 2,
        "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6,
    }
    target = day_map.get(day_name, 4)
    days_ahead = (target - from_date.weekday()) % 7
    return from_date + timedelta(days=days_ahead)
