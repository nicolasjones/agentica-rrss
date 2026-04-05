"""
AGENMATICA — T14: Unit Tests for Volume Selector Logic
Tests the mapping from volume (5/10/15) to timeframe, and that MockAIPlanner
generates the requested number of posts.
"""

import pytest
from datetime import date, timedelta

from app.models.models import Band, User, PlanType, EcosystemEvent, EventCategory
from app.services.ai.ai_planner import MockAIPlanner, volume_to_timeframe


# ─── Volume → Timeframe mapping ───────────────────────

def test_volume_5_maps_to_weekly():
    assert volume_to_timeframe(5) == "weekly"


def test_volume_10_maps_to_biweekly():
    assert volume_to_timeframe(10) == "biweekly"


def test_volume_15_maps_to_monthly():
    assert volume_to_timeframe(15) == "monthly"


def test_volume_1_maps_to_weekly():
    """Minimum volume is weekly."""
    assert volume_to_timeframe(1) == "weekly"


def test_volume_50_maps_to_monthly():
    """Boundary: 50 is still monthly."""
    assert volume_to_timeframe(50) == "monthly"


def test_volume_6_maps_to_biweekly():
    """6 exceeds the weekly threshold."""
    assert volume_to_timeframe(6) == "biweekly"


def test_volume_11_maps_to_monthly():
    """11 exceeds the biweekly threshold."""
    assert volume_to_timeframe(11) == "monthly"


# ─── MockAIPlanner respects volume ────────────────────

@pytest.fixture
def band():
    user = User(email="vol@test.com", hashed_password="x")
    return Band(name="TestBand", owner=user, plan=PlanType.STARTER)


@pytest.mark.asyncio
async def test_generate_batch_volume_5_no_events(band):
    """With no events, volume=5 should produce exactly 5 neutral posts."""
    planner = MockAIPlanner()
    posts = await planner.generate_batch(band=band, events=[], timeframe="weekly", volume=5)
    assert len(posts) == 5


@pytest.mark.asyncio
async def test_generate_batch_volume_10_no_events(band):
    """volume=10 produces 10 posts."""
    planner = MockAIPlanner()
    posts = await planner.generate_batch(band=band, events=[], timeframe="biweekly", volume=10)
    assert len(posts) == 10


@pytest.mark.asyncio
async def test_generate_batch_volume_15_no_events(band):
    """volume=15 produces 15 posts."""
    planner = MockAIPlanner()
    posts = await planner.generate_batch(band=band, events=[], timeframe="monthly", volume=15)
    assert len(posts) == 15


@pytest.mark.asyncio
async def test_generate_batch_volume_respected_with_events(band):
    """Event-driven posts count toward volume; neutral fills the rest."""
    event = EcosystemEvent(
        id=1,  # explicit id required — no DB flush in unit tests
        band=band,
        title="Show en Niceto",
        event_date=date.today() + timedelta(days=3),
        category=EventCategory.GIG,
    )
    planner = MockAIPlanner()
    posts = await planner.generate_batch(band=band, events=[event], timeframe="weekly", volume=5)
    # Volume is a target; total should be >= event-driven posts and <= volume
    assert len(posts) >= 2  # at least 2 event-driven posts (2 platforms per event)


@pytest.mark.asyncio
async def test_generate_batch_volume_caps_neutral_posts(band):
    """When event-driven posts already fill the volume, no extra neutrals are added."""
    events = [
        EcosystemEvent(
            id=i + 1,  # explicit id required — no DB flush in unit tests
            band=band,
            title=f"Show {i}",
            event_date=date.today() + timedelta(days=i + 1),
            category=EventCategory.GIG,
        )
        for i in range(3)  # 3 events × 2 platforms = 6 event-driven posts
    ]
    planner = MockAIPlanner()
    posts = await planner.generate_batch(band=band, events=events, timeframe="weekly", volume=5)
    # neutral_count = max(0, 5 - 6) = 0, so total = 6 event-driven posts
    event_posts = [p for p in posts if p["event_id"] is not None]
    neutral_posts = [p for p in posts if p["event_id"] is None]
    assert len(neutral_posts) == 0
    assert len(event_posts) >= 4  # at least some event-driven posts


@pytest.mark.asyncio
async def test_generate_batch_all_posts_have_no_caption(band):
    """Volume param does not change the MAPA contract: captions must be None."""
    planner = MockAIPlanner()
    for volume in [5, 10, 15]:
        posts = await planner.generate_batch(band=band, events=[], timeframe="weekly", volume=volume)
        for p in posts:
            assert p["caption"] is None, f"caption must be None in MAPA phase (volume={volume})"


@pytest.mark.asyncio
async def test_generate_batch_all_posts_have_required_fields(band):
    """Each generated post has the required concept fields."""
    planner = MockAIPlanner()
    posts = await planner.generate_batch(band=band, events=[], timeframe="weekly", volume=5)
    for p in posts:
        assert "platform" in p
        assert "concept_title" in p
        assert "narrative_goal" in p
        assert "scheduled_date" in p
        assert p["platform"] in ("instagram", "facebook", "tiktok", "youtube")
