import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import Band, Network, GeneratedPost

@pytest.mark.asyncio
async def test_get_dashboard_pulse(client: AsyncClient, db_session: AsyncSession, auth_headers, test_user):
    # 1. Create a test band with ADN
    band = Band(
        name="Pulse Test Band",
        owner_id=test_user.id,
        genre="Rock",
        audience_province="Mendoza",
        audience_country="Argentina",
        use_regional_slang=True,
        tone_keywords=["energético"],
        confidence_score=0.85
    )
    db_session.add(band)
    await db_session.commit()
    await db_session.refresh(band)

    # 2. Create active and inactive networks
    net1 = Network(band_id=band.id, platform="instagram", is_active=True, followers_count=1000)
    net2 = Network(band_id=band.id, platform="tiktok", is_active=False)
    db_session.add(net1)
    db_session.add(net2)
    
    # 3. Create a pending post
    post = GeneratedPost(band_id=band.id, caption="Test post", status="pending", target_platform="instagram")
    db_session.add(post)
    await db_session.commit()

    # 4. Call the endpoint
    response = await client.get(
        f"/api/v1/analytics/dashboard-pulse/{band.id}",
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["band_id"] == band.id
    assert data["confidence_score"] == 0.85
    assert "Mendoza" in data["current_draft_preview"]
    assert "¡Ché!" in data["current_draft_preview"]
    assert data["active_nodes"] == ["instagram"]
    assert data["pending_posts_count"] == 1
    assert "Mendoza" in data["regional_status"]
    assert "Slang Sync Active" in data["regional_status"]
