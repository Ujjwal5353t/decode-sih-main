"""
Decode-SIH — FastAPI application entry point.

Startup sequence:
  1. Import all SQLModel table models (populates metadata).
  2. Create all DB tables (create_all — idempotent, safe on every restart).
  3. Run DB seeds (admin account + NCERT books — idempotent).
  4. Mount all API routes under /api/v1.

CORS:
  Allow all origins during development. Restrict to specific origins in
  production by updating CORS_ORIGINS in config.py.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.router import api_router
from src.core.config import settings
from src.core.database import AsyncSessionFactory, init_db

# ── Critical: import all models so SQLModel.metadata is fully populated ────────
import src.models  # noqa: F401  (side-effect import for all tables including publishers)



@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — runs on startup and shutdown."""
    # ── Startup ────────────────────────────────────────────────────────────────
    if settings.AUTO_CREATE_TABLES:
        print("[startup] Creating database tables...")
        await init_db()
    if settings.AUTO_SEED:
        print("[startup] Running seed data...")
        async with AsyncSessionFactory() as session:
            from src.db.seed import run_all_seeds
            await run_all_seeds(session)
    print("[startup] Server ready.")
    yield
    # ── Shutdown ───────────────────────────────────────────────────────────────
    print("[shutdown] Goodbye.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Backend API for the Decode-SIH inclusive education platform. "
        "Supports School, Student, Parent, and Admin dashboards."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────────────────────
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Access-Token"],  # Expose sliding-window token header
)

# ── Routes ─────────────────────────────────────────────────────────────────────
import os
from fastapi.staticfiles import StaticFiles

uploads_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

app.include_router(api_router, prefix="/api/v1")


@app.get("/", tags=["Health"])
async def root():
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "healthy",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok"}
