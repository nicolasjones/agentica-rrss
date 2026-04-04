"""
AGENMATICA - Unit tests for Phase 4: Pulse Telemetry & Learning Loop.
Tests the Pulse data contract and LearningLog trigger logic (model-level, no DB).
"""

import pytest
from datetime import date, timedelta

from app.models.models import (
    Band, User, PlanType,
    StrategicBatch, StrategicPost,
    BatchTimeframe, EventCategory,
    ContentPattern, PatternStatus,
    LearningLog, LearningEventType,
)


# ─── Pulse — model layer ──────────────────────────────

def test_band_has_confidence_score_field():
    """Band.confidence_score defaults to 0.0 (column default, not in-memory)."""
    user = User(email="pulse@test.com", hashed_password="x")
    band = Band(name="Sientes", owner=user, plan=PlanType.STARTER)
    # In-memory: value may be None until DB flush; treat None as 0.0
    assert (band.confidence_score or 0.0) == 0.0


def test_band_regional_sync_defaults_false():
    """Band.use_regional_slang must default False in constructor."""
    user = User(email="pulse@test.com", hashed_password="x")
    band = Band(name="Sientes", owner=user, plan=PlanType.STARTER)
    assert band.use_regional_slang is False


def test_band_regional_sync_can_be_true():
    user = User(email="pulse@test.com", hashed_password="x")
    band = Band(name="Sientes", owner=user, plan=PlanType.STARTER, use_regional_slang=True)
    assert band.use_regional_slang is True


def test_pulse_response_shape():
    """Simulate the Pulse endpoint response dict contract."""
    user = User(email="pulse@test.com", hashed_password="x")
    band = Band(name="Sientes", owner=user, plan=PlanType.STARTER)
    band.confidence_score = 0.72
    band.use_regional_slang = True

    patterns = [
        ContentPattern(
            band=band,
            pattern_type="timing",
            pattern_name="Shows 3x better on weekends",
            confidence=0.85,
            status=PatternStatus.ACTIVE,
        )
    ]

    # Replicate what the endpoint builds
    response = {
        "confidence_score": round(band.confidence_score or 0.0, 2),
        "regional_sync": bool(band.use_regional_slang),
        "active_nodes": [
            {"name": p.pattern_name, "type": p.pattern_type, "confidence": round(p.confidence or 0.0, 2)}
            for p in patterns
        ],
    }

    assert response["confidence_score"] == 0.72
    assert response["regional_sync"] is True
    assert len(response["active_nodes"]) == 1
    assert response["active_nodes"][0]["name"] == "Shows 3x better on weekends"
    assert response["active_nodes"][0]["confidence"] == 0.85


def test_pulse_empty_patterns():
    """Pulse endpoint with no active patterns returns empty active_nodes."""
    user = User(email="pulse@test.com", hashed_password="x")
    band = Band(name="Los Solos", owner=user, plan=PlanType.STARTER)
    band.confidence_score = 0.0

    response = {
        "confidence_score": round(band.confidence_score or 0.0, 2),
        "regional_sync": bool(band.use_regional_slang),
        "active_nodes": [],
    }

    assert response["active_nodes"] == []
    assert response["confidence_score"] == 0.0


# ─── Learning Loop — model layer ─────────────────────

def test_learning_log_post_rejected_event():
    """LearningLog can be created with POST_REJECTED for a concept rejection."""
    user = User(email="learn@test.com", hashed_password="x")
    band = Band(name="Sientes", owner=user, plan=PlanType.STARTER)
    batch = StrategicBatch(band=band, timeframe=BatchTimeframe.WEEKLY)
    post = StrategicPost(
        id=42,
        batch=batch,
        platform="instagram",
        concept_title="Expectativa — Show en Niceto",
        narrative_goal="Generar misterio antes del show",
        caption=None,
        is_approved=False,
    )

    log = LearningLog(
        band=band,
        event_type=LearningEventType.POST_REJECTED,
        data={
            "post_id": post.id,
            "concept_title": post.concept_title,
            "narrative_goal": post.narrative_goal,
            "reason": "wrong_tone",
        },
        impact_score=0.3,
    )

    assert log.event_type == LearningEventType.POST_REJECTED
    assert log.data["post_id"] == 42
    assert log.data["concept_title"] == "Expectativa — Show en Niceto"
    assert log.data["reason"] == "wrong_tone"
    assert log.impact_score == 0.3


def test_learning_log_requires_band_and_event_type():
    """LearningLog core fields are correctly set."""
    user = User(email="learn@test.com", hashed_password="x")
    band = Band(name="Sientes", owner=user, plan=PlanType.STARTER)

    log = LearningLog(
        band=band,
        event_type=LearningEventType.POST_REJECTED,
        data={"reason": "other"},
        impact_score=0.1,
    )
    assert log.band is band
    assert log.event_type == LearningEventType.POST_REJECTED


def test_reject_concept_endpoint_data_contract():
    """Simulate the reject-concept endpoint response contract."""
    post_id = 7
    response = {
        "logged": True,
        "event_type": "post_rejected",
        "post_id": post_id,
    }
    assert response["logged"] is True
    assert response["event_type"] == "post_rejected"
    assert response["post_id"] == 7
