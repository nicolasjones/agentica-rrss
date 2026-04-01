import pytest
from app.models.models import Band, Network, GeneratedPost, PostStatus

@pytest.mark.asyncio
async def test_bands_overview_empty(client, auth_headers):
    """Test overview when user has no bands."""
    response = await client.get("/api/v1/bands/overview", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == []

@pytest.mark.asyncio
async def test_bands_overview_with_data(client, auth_headers, test_user, db_session):
    """Test overview with a band and network."""
    # 1. Create a band
    band = Band(name="The Testers", owner_id=test_user.id, confidence_score=0.85)
    db_session.add(band)
    await db_session.flush()
    await db_session.refresh(band)
    
    # 2. Create a network
    network = Network(band_id=band.id, platform="instagram", followers_count=1200, is_active=True)
    db_session.add(network)
    
    # 3. Create a pending post
    post = GeneratedPost(band_id=band.id, caption="Hello world", target_platform="instagram", status=PostStatus.PENDING)
    db_session.add(post)
    
    await db_session.flush()
    
    # 4. Request overview
    response = await client.get("/api/v1/bands/overview", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "The Testers"
    assert data[0]["followers_count"] == 1200
    assert data[0]["pending_posts_count"] == 1
    assert "instagram" in data[0]["platform_icons"]

@pytest.mark.asyncio
async def test_analytics_aggregate(client, auth_headers, test_user, db_session):
    """Test aggregated analytics across multiple bands."""
    # 1. Create two bands with different followers
    band1 = Band(name="Band 1", owner_id=test_user.id, confidence_score=0.80)
    band2 = Band(name="Band 2", owner_id=test_user.id, confidence_score=0.90)
    db_session.add_all([band1, band2])
    await db_session.flush()
    await db_session.refresh(band1)
    await db_session.refresh(band2)
    
    # 2. Add networks
    net1 = Network(band_id=band1.id, platform="instagram", followers_count=1000)
    net2 = Network(band_id=band2.id, platform="tiktok", followers_count=2000)
    db_session.add_all([net1, net2])
    
    await db_session.flush()
    
    # 3. Request aggregate analytics
    response = await client.get("/api/v1/analytics/aggregate", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total_followers"] == 3000
    assert data["project_count"] == 2
    assert data["avg_confidence"] == 0.85
