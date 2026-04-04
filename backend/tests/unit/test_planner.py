"""
AGENMATICA - Unit tests for Strategic Planner
Tests for MockAIPlanner, MockEventInterpreter, and planner models.
"""

import pytest
from datetime import date, timedelta

from app.models.models import (
    Band, User, PlanType,
    EcosystemEvent, StrategicBatch,
    EventCategory, BatchStatus, BatchTimeframe,
)
from app.services.ai.ai_planner import MockAIPlanner
from app.services.ai.event_interpreter import MockEventInterpreter


# ─── Model instantiation ──────────────────────────────

def test_ecosystem_event_creation():
    user = User(email="band@test.com", hashed_password="x")
    band = Band(name="Los Solos", owner=user, plan=PlanType.STARTER)
    event = EcosystemEvent(
        band=band,
        title="Show en Niceto",
        event_date=date.today() + timedelta(days=10),
        category=EventCategory.GIG,
    )
    assert event.title == "Show en Niceto"
    assert event.category == EventCategory.GIG


def test_ecosystem_event_default_category():
    """SQLAlchemy column defaults only apply on DB insert, not in-memory construction."""
    user = User(email="band@test.com", hashed_password="x")
    band = Band(name="Los Solos", owner=user, plan=PlanType.STARTER)
    event = EcosystemEvent(
        band=band,
        title="Novedad",
        event_date=date.today(),
        category=EventCategory.OTHER,  # explicit — default only fires on DB flush
    )
    assert event.category == EventCategory.OTHER


def test_strategic_batch_default_status():
    """SQLAlchemy column defaults only apply on DB insert, not in-memory construction."""
    user = User(email="band@test.com", hashed_password="x")
    band = Band(name="Los Solos", owner=user, plan=PlanType.STARTER)
    batch = StrategicBatch(band=band, timeframe=BatchTimeframe.WEEKLY, status=BatchStatus.PROPOSED)
    assert batch.status == BatchStatus.PROPOSED


# ─── MockAIPlanner ────────────────────────────────────

@pytest.mark.asyncio
async def test_mock_planner_returns_posts_for_band_no_events():
    user = User(email="p@test.com", hashed_password="x")
    band = Band(name="Sientes", owner=user, plan=PlanType.STARTER)
    planner = MockAIPlanner()
    posts = await planner.generate_batch(band=band, events=[], timeframe="weekly")
    assert isinstance(posts, list)
    assert len(posts) > 0
    for p in posts:
        assert "platform" in p
        assert "concept_title" in p
        assert p["caption"] is None  # Phase 1 (MAPA) never fills captions
        assert len(p["concept_title"]) > 0


@pytest.mark.asyncio
async def test_mock_planner_generates_event_driven_posts():
    user = User(email="p@test.com", hashed_password="x")
    band = Band(name="Sientes", owner=user, plan=PlanType.STARTER)
    event = EcosystemEvent(
        band=band,
        title="Lanzamiento Álbum",
        event_date=date.today() + timedelta(days=5),
        category=EventCategory.LAUNCH,
    )
    planner = MockAIPlanner()
    posts = await planner.generate_batch(band=band, events=[event], timeframe="weekly")
    titles = [p["concept_title"] for p in posts]
    # At least one concept title should reference the event (MAPA phase, no captions yet)
    assert any("Lanzamiento" in t or "Álbum" in t or "Activación" in t or "Expectativa" in t for t in titles)


@pytest.mark.asyncio
async def test_mock_planner_refine_post():
    user = User(email="p@test.com", hashed_password="x")
    band = Band(name="Sientes", owner=user, plan=PlanType.STARTER)
    planner = MockAIPlanner()
    result = await planner.refine_post(
        band=band,
        original_caption="Caption original.",
        platform="instagram",
        feedback="Hacelo más épico",
    )
    assert "caption" in result
    assert "hashtags" in result
    assert "Hacelo más épico" in result["caption"] or len(result["caption"]) > 0


@pytest.mark.asyncio
async def test_mock_planner_weekly_generates_at_least_3_posts():
    user = User(email="p@test.com", hashed_password="x")
    band = Band(name="Sientes", owner=user, plan=PlanType.STARTER)
    planner = MockAIPlanner()
    posts = await planner.generate_batch(band=band, events=[], timeframe="weekly")
    assert len(posts) >= 2


@pytest.mark.asyncio
async def test_mock_planner_monthly_generates_more_than_weekly():
    user = User(email="p@test.com", hashed_password="x")
    band = Band(name="Sientes", owner=user, plan=PlanType.STARTER)
    planner = MockAIPlanner()
    weekly = await planner.generate_batch(band=band, events=[], timeframe="weekly")
    monthly = await planner.generate_batch(band=band, events=[], timeframe="monthly")
    assert len(monthly) >= len(weekly)


# ─── MockEventInterpreter ─────────────────────────────

@pytest.mark.asyncio
async def test_interpreter_detects_single_date():
    interpreter = MockEventInterpreter()
    result = await interpreter.interpret(
        "Tenemos un show el 15 de mayo en Niceto", "Sientes"
    )
    assert "reply" in result
    assert "events" in result
    assert len(result["events"]) >= 1
    assert result["events"][0]["event_date"] is not None


@pytest.mark.asyncio
async def test_interpreter_detects_multiple_dates():
    interpreter = MockEventInterpreter()
    result = await interpreter.interpret(
        "Tocamos el 10, el 15 y el 20 de junio", "Los Solos"
    )
    assert len(result["events"]) >= 2


@pytest.mark.asyncio
async def test_interpreter_infers_gig_category():
    interpreter = MockEventInterpreter()
    result = await interpreter.interpret("Tenemos un concierto el 22", "Sientes")
    assert result["events"][0]["category"] == "gig"


@pytest.mark.asyncio
async def test_interpreter_infers_launch_category():
    interpreter = MockEventInterpreter()
    result = await interpreter.interpret("Sale nuestro nuevo single el 5 de agosto", "Sientes")
    assert result["events"][0]["category"] == "launch"


@pytest.mark.asyncio
async def test_interpreter_fallback_no_date():
    interpreter = MockEventInterpreter()
    result = await interpreter.interpret("Estuvimos grabando en el estudio", "Sientes")
    # Should still return an event with a placeholder date
    assert len(result["events"]) == 1
    assert result["events"][0]["event_date"] is not None


@pytest.mark.asyncio
async def test_interpreter_reply_is_non_empty():
    interpreter = MockEventInterpreter()
    result = await interpreter.interpret("Show el 7 de septiembre", "Sientes")
    assert isinstance(result["reply"], str)
    assert len(result["reply"]) > 0
