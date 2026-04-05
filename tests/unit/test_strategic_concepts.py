import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import StrategicPost, StrategicBatch, BatchStatus, PlatformType

@pytest.mark.asyncio
async def test_strategic_post_concept_mode(db: AsyncSession):
    """
    TEST DE ARQUITECTURA CRÍTICO (V4)
    Valida que un StrategicPost pueda existir en modo 'SÓLO IDEA'.
    Claude falló aquí al hacer el campo 'caption' obligatorio.
    """
    
    # 1. Crear un batch propuesto
    batch = StrategicBatch(band_id=1, status=BatchStatus.PROPOSED)
    db.add(batch)
    await db.flush()
    
    # 2. Intentar crear un StrategicPost con Concepto pero SIN Caption (Modo Ideación)
    # Esto DEBE funcionar si la arquitectura V4 es correcta.
    concept_post = StrategicPost(
        batch_id=batch.id,
        platform="instagram",
        concept_title="Expectativa de Lanzamiento",
        narrative_goal="Generar suspenso y misterio mostrando solo el arte de tapa desenfocado.",
        caption=None, # <- Esto es lo que Claude rompió (puso nullable=False)
        scheduled_date=None
    )
    
    db.add(concept_post)
    
    # 3. Guardar en DB
    try:
        await db.commit()
    except Exception as e:
        pytest.fail(f"Falla de Arquitectura: El modelo StrategicPost obliga a tener un caption. Error: {e}")

    # 4. Verificar que se guardó correctamente como IDEA
    await db.refresh(concept_post)
    assert concept_post.concept_title == "Expectativa de Lanzamiento"
    assert concept_post.caption is None
    assert concept_post.id is not None
