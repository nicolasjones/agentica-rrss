"""
AGENMATICA - Main Application
FastAPI entry point with all routes registered.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.middleware import ErrorHandlingMiddleware, RequestLoggingMiddleware, RateLimitMiddleware

from app.api.routes import auth, bands, posts, networks, analytics

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    print(f"🎸 AGENMATICA starting in {settings.app_env} mode")
    print(f"   Mock LLM: {settings.mock_llm}")
    print(f"   Mock Social APIs: {settings.mock_social_apis}")
    print(f"   Mock Image Gen: {settings.mock_image_gen}")

    if not settings.is_production:
        # Auto-create tables in dev (use Alembic in production)
        from app.db.session import init_db
        try:
            await init_db()
            print("   Database tables created ✓")
        except Exception as e:
            print(f"   Database init skipped: {e}")

    yield

    # Shutdown
    print("🎸 AGENMATICA shutting down")


app = FastAPI(
    title="AGENMATICA API",
    description="AI-Powered Social Media Automation for Rock Bands",
    version="0.1.0",
    lifespan=lifespan,
    docs_url=f"{settings.api_prefix}/docs",
    redoc_url=f"{settings.api_prefix}/redoc",
    openapi_url=f"{settings.api_prefix}/openapi.json",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:5173",
        "http://localhost:8090",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware (order matters: last added = first executed)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(ErrorHandlingMiddleware)

# Register routes
app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(bands.router, prefix=settings.api_prefix)
app.include_router(posts.router, prefix=settings.api_prefix)
app.include_router(networks.router, prefix=settings.api_prefix)
app.include_router(analytics.router, prefix=settings.api_prefix)


@app.get("/")
async def root():
    return {
        "app": "AGENMATICA",
        "version": "0.1.0",
        "status": "running",
        "docs": f"{settings.api_prefix}/docs",
        "mode": settings.app_env,
        "mock_enabled": {
            "llm": settings.mock_llm,
            "social_apis": settings.mock_social_apis,
            "image_gen": settings.mock_image_gen,
        },
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
