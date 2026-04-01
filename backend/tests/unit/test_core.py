"""
AGENMATICA - Core Tests
Tests that run WITHOUT database or external services.
"""
import pytest
from unittest.mock import AsyncMock, patch


# ─── Config Tests ────────────────────────────────────

def test_settings_defaults():
    from app.core.config import Settings
    s = Settings(
        database_url="postgresql+asyncpg://test:test@localhost/test",
    )
    assert s.app_name == "AGENMATICA"
    assert s.mock_llm is True
    assert s.posts_per_day == 5
    assert s.api_prefix == "/api/v1"


def test_settings_production_flag():
    from app.core.config import Settings
    s = Settings(app_env="production")
    assert s.is_production is True

    s2 = Settings(app_env="development")
    assert s2.is_production is False


# ─── Security Tests ──────────────────────────────────

def test_password_hashing():
    from app.core.security import hash_password, verify_password
    hashed = hash_password("test_password_123")
    assert hashed != "test_password_123"
    assert verify_password("test_password_123", hashed) is True
    assert verify_password("wrong_password", hashed) is False


def test_jwt_token_creation():
    from app.core.security import create_access_token, decode_token
    token = create_access_token({"sub": "42"})
    payload = decode_token(token)
    assert payload["sub"] == "42"
    assert payload["type"] == "access"


def test_jwt_refresh_token():
    from app.core.security import create_refresh_token, decode_token
    token = create_refresh_token({"sub": "99"})
    payload = decode_token(token)
    assert payload["sub"] == "99"
    assert payload["type"] == "refresh"


def test_invalid_token_raises():
    from app.core.security import decode_token
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc_info:
        decode_token("invalid.token.here")
    assert exc_info.value.status_code == 401


# ─── Mock LLM Tests ─────────────────────────────────

@pytest.mark.asyncio
async def test_mock_llm_generate_post():
    from app.services.ai.llm_service import MockLLMService
    llm = MockLLMService()
    result = await llm.generate_post(
        band_profile={"name": "Sientes", "genre": "Rock"},
        platform="instagram",
    )
    assert "caption" in result
    assert "hashtags" in result
    assert "model_used" in result
    assert result["model_used"] == "mock-llm"
    assert len(result["caption"]) > 0


@pytest.mark.asyncio
async def test_mock_llm_analyze_tone():
    from app.services.ai.llm_service import MockLLMService
    llm = MockLLMService()
    result = await llm.analyze_tone("Este viernes nos vemos en Niceto Club")
    assert "tone" in result
    assert "sentiment" in result
    assert 0 <= result["sentiment"] <= 1


@pytest.mark.asyncio
async def test_mock_llm_generate_embedding():
    from app.services.ai.llm_service import MockLLMService
    llm = MockLLMService()
    result = await llm.generate_embedding("Sientes rock alternativo")
    assert isinstance(result, list)
    assert len(result) == 1536  # default embedding dimensions


# ─── Mock Social Service Tests ───────────────────────

@pytest.mark.asyncio
async def test_mock_social_exchange_code():
    from app.services.social.social_service import MockSocialService
    svc = MockSocialService()
    result = await svc.exchange_code("instagram", "fake_code")
    assert "access_token" in result
    assert "instagram" in result["access_token"]


@pytest.mark.asyncio
async def test_mock_social_fetch_posts():
    from app.services.social.social_service import MockSocialService
    svc = MockSocialService()
    posts = await svc.fetch_posts("instagram", "fake_token", limit=50)
    assert len(posts) == 50
    assert "platform_post_id" in posts[0]
    assert "caption" in posts[0]
    assert "engagement_data" in posts[0]


@pytest.mark.asyncio
async def test_mock_social_get_profile():
    from app.services.social.social_service import MockSocialService
    svc = MockSocialService()
    profile = await svc.get_profile("instagram", "fake_token")
    assert profile["username"] == "sientes_banda"
    assert profile["followers_count"] > 0


@pytest.mark.asyncio
async def test_mock_social_publish():
    from app.services.social.social_service import MockSocialService
    svc = MockSocialService()
    result = await svc.publish_post("instagram", "token", "Test caption")
    assert result["success"] is True


# ─── Service Factory Tests ───────────────────────────

def test_llm_factory_returns_mock():
    with patch("app.services.ai.llm_service.settings") as mock_settings:
        mock_settings.mock_llm = True
        from app.services.ai.llm_service import get_llm_service, MockLLMService
        svc = get_llm_service()
        assert isinstance(svc, MockLLMService)


def test_social_factory_returns_mock():
    with patch("app.services.social.social_service.settings") as mock_settings:
        mock_settings.mock_social_apis = True
        from app.services.social.social_service import get_social_service, MockSocialService
        svc = get_social_service()
        assert isinstance(svc, MockSocialService)


# ─── Schema Tests ────────────────────────────────────

def test_band_create_schema():
    from app.schemas.schemas import BandCreate
    band = BandCreate(
        name="Sientes",
        genre="Rock Alternativo",
        tone_keywords=["energetic", "sarcastic"],
    )
    assert band.name == "Sientes"
    assert len(band.tone_keywords) == 2


def test_post_reject_requires_reason():
    from app.schemas.schemas import PostRejectRequest
    from pydantic import ValidationError
    with pytest.raises(ValidationError):
        PostRejectRequest(reason="ab")  # too short, min 5 chars

    valid = PostRejectRequest(reason="Too corporate tone")
    assert valid.reason == "Too corporate tone"


# ─── Model Enum Tests ───────────────────────────────

def test_plan_types():
    from app.models.models import PlanType
    assert PlanType.STARTER.value == "starter"
    assert PlanType.PREMIUM.value == "premium"


def test_post_status_values():
    from app.models.models import PostStatus
    assert PostStatus.PENDING.value == "pending"
    assert PostStatus.APPROVED.value == "approved"
    assert PostStatus.REJECTED.value == "rejected"
    assert PostStatus.PUBLISHED.value == "published"
