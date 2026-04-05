import pytest
from app.models.models import Band, User, PlanType

def test_create_entity_with_new_fields():
    """Test that we can create an entity (Band) with the new target audience fields."""
    user = User(email="test@example.com", hashed_password="hashed")
    
    entity = Band(
        name="Proyecto X",
        owner=user,
        plan=PlanType.STARTER,
        genre="Rock",
        audience_age_min=20,
        audience_age_max=40,
        audience_country="Argentina",
        audience_province="Mendoza",
        use_regional_slang=True
    )
    
    assert entity.name == "Proyecto X"
    assert entity.audience_age_min == 20
    assert entity.audience_age_max == 40
    assert entity.audience_country == "Argentina"
    assert entity.audience_province == "Mendoza"
    assert entity.use_regional_slang is True

def test_entity_defaults():
    """Test default values for a new entity."""
    user = User(email="defaults@example.com", hashed_password="hashed")
    entity = Band(name="Default Entity", owner=user)
    
    # We expect these defaults once we update the model
    # For now, this test will fail until we update the model
    assert entity.audience_age_min == 18
    assert entity.audience_age_max == 35
    assert entity.use_regional_slang is False
