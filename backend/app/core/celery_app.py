"""
AGENMATICA - Celery Configuration
Async task queue for background jobs.
"""

from celery import Celery
from celery.schedules import crontab

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "agenmatica",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Argentina/Buenos_Aires",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=100,
)

celery_app.conf.beat_schedule = {
    # === Daily ===
    "generate-daily-posts": {
        "task": "app.tasks.generation.generate_all_daily_posts",
        "schedule": crontab(hour=settings.post_generation_hour, minute=0),
    },
    "schedule-approved-posts": {
        "task": "app.tasks.publishing.schedule_approved_posts",
        "schedule": crontab(hour=settings.post_generation_hour, minute=30),
    },
    "analyze-engagement": {
        "task": "app.tasks.analytics_tasks.analyze_all_engagement",
        "schedule": crontab(hour=settings.engagement_analysis_hour, minute=0),
    },
    # === Every 15 minutes (auto-publish) ===
    "auto-publish-posts": {
        "task": "app.tasks.publishing.check_and_publish",
        "schedule": crontab(minute="*/15"),
    },
    # === Weekly ===
    "weekly-learning-loop": {
        "task": "app.tasks.learning.run_weekly_learning",
        "schedule": crontab(hour=0, minute=0, day_of_week=settings.learning_loop_day),
    },
    # === Monthly ===
    "monthly-profile-refresh": {
        "task": "app.tasks.learning.refresh_all_profiles",
        "schedule": crontab(hour=2, minute=0, day_of_month=1),
    },
}

celery_app.autodiscover_tasks(["app.tasks"])
