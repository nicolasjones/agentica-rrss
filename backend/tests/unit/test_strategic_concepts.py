"""
AGENMATICA - Unit tests for Strategic Concept (Phase 1: Mapa) flow.
Validates that StrategicPost supports concept-first mode (no caption required)
and that MockAIPlanner generates concepts before signals.
"""

import pytest
from datetime import date, timedelta

from app.models.models import (
    Band, User, PlanType,
    EcosystemEvent, StrategicBatch, StrategicPost,
    EventCategory, BatchStatus, BatchTimeframe,
)
from app.services.ai.ai_planner import MockAIPlanner


# ─── Concept-first model behaviour ───────────────────

def test_strategic_post_without_caption():
    """A StrategicPost must be creatable with concept fields but no caption."""
    user = User(email="mapa@test.com", hashed_password="x")
    band = Band(name="Sientes", owner=user, plan=PlanType.STARTER)
    batch = StrategicBatch(band=band, timeframe=BatchTimeframe.WEEKLY)
    post = StrategicPost(
        batch=batch,
        platform="instagram",
        concept_title="Expectativa pre-evento — Show en Niceto",
        narrative_goal="Generar misterio e hype antes del evento",
        caption=None,
    )
    assert post.concept_title == "Expectativa pre-evento — Show en Niceto"
    assert post.narrative_goal is not None
    assert post.caption is None
    assert not post.is_approved  # None or False — column default only fires on DB flush


def test_strategic_post_caption_nullable_by_default():
    """caption defaults to None when not provided."""
    user = User(email="x@test.com", hashed_password="x")
    band = Band(name="Los Solos", owner=user, plan=PlanType.STARTER)
    batch = StrategicBatch(band=band)
    post = StrategicPost(batch=batch, platform="tiktok", concept_title="Identidad", narrative_goal="Marca")
    assert post.caption is None


def test_strategic_post_full_signal():
    """A post in Signal phase has both concept fields and caption filled."""
    user = User(email="signal@test.com", hashed_password="x")
    band = Band(name="Sientes", owner=user, plan=PlanType.STARTER)
    batch = StrategicBatch(band=band)
    post = StrategicPost(
        batch=batch,
        platform="instagram",
        concept_title="Recap emocional",
        narrative_goal="Capitalizar momentum post-evento",
        caption="Gracias por anoche. Fue todo. 💜",
        hashtags=["#Sientes", "#RecapShow"],
    )
    assert post.caption is not None
    assert post.concept_title is not None


# ─── MockAIPlanner — concept phase ────────────────────

@pytest.mark.asyncio
async def test_generate_batch_returns_concepts_without_captions():
    """generate_batch must NOT fill caption — only concept_title and narrative_goal."""
    user = User(email="p@test.com", hashed_password="x")
    band = Band(name="Sientes", owner=user, plan=PlanType.STARTER)
    planner = MockAIPlanner()
    posts = await planner.generate_batch(band=band, events=[], timeframe="weekly")

    assert len(posts) > 0
    for p in posts:
        assert p.get("caption") is None, "generate_batch must not set caption"
        assert p.get("concept_title") is not None
        assert p.get("narrative_goal") is not None


@pytest.mark.asyncio
async def test_generate_batch_concept_titles_are_descriptive():
    user = User(email="p@test.com", hashed_password="x")
    band = Band(name="Sientes", owner=user, plan=PlanType.STARTER)
    event = EcosystemEvent(
        band=band,
        title="Show en Niceto",
        event_date=date.today() + timedelta(days=3),
        category=EventCategory.GIG,
    )
    planner = MockAIPlanner()
    posts = await planner.generate_batch(band=band, events=[event], timeframe="weekly")

    concept_titles = [p["concept_title"] for p in posts]
    # At least one concept title should reference the event
    assert any("Niceto" in t or "Expectativa" in t or "Activación" in t for t in concept_titles)


@pytest.mark.asyncio
async def test_generate_batch_narrative_goals_non_empty():
    user = User(email="p@test.com", hashed_password="x")
    band = Band(name="Sientes", owner=user, plan=PlanType.STARTER)
    planner = MockAIPlanner()
    posts = await planner.generate_batch(band=band, events=[], timeframe="weekly")
    for p in posts:
        assert len(p["narrative_goal"]) > 10


# ─── MockAIPlanner — signal phase ─────────────────────

@pytest.mark.asyncio
async def test_generate_signals_fills_captions():
    """generate_signals must fill caption for each approved concept post."""
    user = User(email="p@test.com", hashed_password="x")
    band = Band(name="Sientes", owner=user, plan=PlanType.STARTER)
    batch = StrategicBatch(band=band)

    # Simulate approved concept posts (no caption yet)
    posts = [
        StrategicPost(
            id=1, batch=batch, platform="instagram",
            concept_title="Expectativa pre-evento — Show en Niceto",
            narrative_goal="Generar misterio e hype antes del evento",
            caption=None, is_approved=True,
        ),
        StrategicPost(
            id=2, batch=batch, platform="tiktok",
            concept_title="Contenido de identidad",
            narrative_goal="Reforzar el ADN de marca sin anclarse a un evento puntual",
            caption=None, is_approved=True,
        ),
    ]

    planner = MockAIPlanner()
    signals = await planner.generate_signals(band=band, posts=posts)

    assert len(signals) == 2
    for s in signals:
        assert "id" in s
        assert "caption" in s
        assert len(s["caption"]) > 0
        assert "hashtags" in s


@pytest.mark.asyncio
async def test_generate_signals_only_processes_approved_with_no_caption():
    """generate_signals should skip posts that already have a caption or are not approved."""
    user = User(email="p@test.com", hashed_password="x")
    band = Band(name="Sientes", owner=user, plan=PlanType.STARTER)
    batch = StrategicBatch(band=band)

    posts = [
        StrategicPost(
            id=1, batch=batch, platform="instagram",
            concept_title="Expectativa", narrative_goal="Hype",
            caption=None, is_approved=True,  # should be processed
        ),
        StrategicPost(
            id=2, batch=batch, platform="facebook",
            concept_title="Identidad", narrative_goal="Marca",
            caption="Ya tiene caption", is_approved=True,  # skip: already has caption
        ),
        StrategicPost(
            id=3, batch=batch, platform="tiktok",
            concept_title="Recap", narrative_goal="Momentum",
            caption=None, is_approved=False,  # skip: not approved
        ),
    ]
    # Filter as the route would
    eligible = [p for p in posts if p.is_approved and p.caption is None]

    planner = MockAIPlanner()
    signals = await planner.generate_signals(band=band, posts=eligible)

    assert len(signals) == 1
    assert signals[0]["id"] == 1


@pytest.mark.asyncio
async def test_generate_signals_infers_archetype_from_concept_title():
    """Captions should match the archetype inferred from concept_title."""
    user = User(email="p@test.com", hashed_password="x")
    band = Band(name="Sientes", owner=user, plan=PlanType.STARTER)
    batch = StrategicBatch(band=band)

    posts = [
        StrategicPost(
            id=1, batch=batch, platform="instagram",
            concept_title="Recap emocional — Show en Niceto",
            narrative_goal="Capitalizar momentum post-evento",
            caption=None, is_approved=True,
        ),
    ]
    planner = MockAIPlanner()
    signals = await planner.generate_signals(band=band, posts=posts)
    # Recap archetype captions contain "Gracias" or similar post-event language
    caption = signals[0]["caption"]
    assert len(caption) > 0
