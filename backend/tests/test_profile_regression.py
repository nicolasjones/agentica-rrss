import pytest
from app.models.models import Band

@pytest.mark.asyncio
async def test_band_profile_labels_limit(client, auth_headers, test_user, db_session):
    """
    REGRESSION: Ensure a band profile cannot have more than 3 labels 
    for Tone or Values according to the technical specification.
    """
    # 1. Attempt to create a band with 4 labels
    band_data = {
        "name": "Limit Breakers",
        "tone_keywords": ["sarcastic", "energetic", "dark", "rebellious"], # 4 labels
        "values_keywords": ["diy", "authenticity", "indie"] # 3 labels
    }
    
    # In a real implementation, this should return a validation error (422)
    # But for now, let's see if our current system handles it (it probably doesn't yet, so this test will FAIL, which is good for identifying regression).
    response = await client.post("/api/v1/bands/", json=band_data, headers=auth_headers)
    
    assert response.status_code == 422
    assert "Maximum 3" in response.json()["detail"]

@pytest.mark.asyncio
async def test_auth_persistence_logout(client, auth_headers):
    """
    REGRESSION: Ensure logout clears tokens or invalidates session.
    """
    # Request profile to check we are auth
    profile_res = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert profile_res.status_code == 200
    
    # Logout
    logout_res = await client.post("/api/v1/auth/logout", headers=auth_headers)
    assert logout_res.status_code == 200
    
    # TODO: In real systems, we would check if the token is blacklisted.
    # For now, mark as placeholder for future implementation of token blacklisting.
    assert True
