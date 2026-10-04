import os, sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from .auth.router import router as auth_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base, SessionLocal
from . import models  # noqa: F401 — registers ALL models with Base before create_all

from .api.routes import study_areas
from .api import targets, ml, field_notes, data_import, maps
from .api.routes import satellite, remote_sensing, features, manganese

# Database tables will be created on startup (after app definition)

def seed_db():
    try:
        db = SessionLocal()
        if db.query(ExplorationTarget).count() == 0:
            targets_data = [
                {"name": "Zone Alpha-1", "description": "High reflectance anomaly in Band 4.", "latitude": 21.4312, "longitude": 79.8113, "prospectivity_score": 0.91, "is_verified": False},
                {"name": "Zone Alpha-2", "description": "Geological contact zone with potential outcroppings.", "latitude": 21.4322, "longitude": 79.8213, "prospectivity_score": 0.88, "is_verified": False},
                {"name": "Zone Beta-1", "description": "Terrain feature suggesting ancient riverbed.", "latitude": 21.1415, "longitude": 79.0815, "prospectivity_score": 0.75, "is_verified": True},
            ]
            for t in targets_data:
                db.add(ExplorationTarget(**t))
            db.commit()
        db.close()
    except Exception:
        # Silently skip seeding if the DB schema is stale (e.g. during tests
        # with an in-memory DB or a dev.db that needs migration).
        pass

# seed_db()  # Moved to startup after tables are created

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Powered Manganese Prospectivity Mapping API",
    version="1.0.0",
)

# Create tables on startup (after the FastAPI instance exists)
@app.on_event("startup")
def on_startup() -> None:
    """Create all database tables when the application starts, and seed default data if needed.
    Skips during tests (TESTING env var)."""
    import os
    if os.getenv("TESTING"):
        return
    # Create all tables if they don't exist
    try:
        Base.metadata.create_all(bind=engine, checkfirst=True)
    except Exception as e:
        # Log but continue; during dev may fail if DB locked
        print(f"Error creating tables: {e}")
    # Seed initial data after tables are ensured
    try:
        seed_db()
    except Exception as e:
        print(f"Error seeding database: {e}")
    # Seed demo users for authentication
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        from app.models.user import User
        from app.auth import utils as auth_utils
        demo_users = [
            {"email": "admin@manganex.ai", "username": "admin", "role": "admin"},
            {"email": "geo@manganex.ai", "username": "geologist", "role": "geologist"},
        ]
        for du in demo_users:
            if not db.query(User).filter(User.email == du["email"]).first():
                hashed = auth_utils.get_password_hash("demo123")
                new_user = User(
                    email=du["email"],
                    username=du["username"],
                    hashed_password=hashed,
                    role=du["role"],
                )
                db.add(new_user)
        db.commit()
    finally:
        db.close()

# CORS config
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
if not origins:
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "*"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(targets.router, prefix="/api/targets", tags=["targets"])
app.include_router(ml.router, prefix="/api/ml", tags=["ml"])
app.include_router(study_areas.router, prefix="/api/study-areas", tags=["study_areas"])
app.include_router(field_notes.router, prefix="/api/field-notes", tags=["field_notes"])
app.include_router(data_import.router, prefix="/api/data-import", tags=["data_import"])
app.include_router(maps.router, prefix="/api/maps", tags=["maps"])
app.include_router(satellite.router, prefix="/api/satellite", tags=["satellite"])
app.include_router(remote_sensing.router, prefix="/api/remote-sensing", tags=["remote-sensing"])

app.include_router(features.router, prefix="/api/features", tags=["features"])
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(manganese.router, prefix="/api/manganese", tags=["manganese"])
@app.get("/")
def read_root():
    return {
        "project": settings.PROJECT_NAME,
        "mode": "DEMO MODE" if settings.DEMO_MODE else "PRODUCTION",
        "status": "online"
    }

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "mode": "demo"
    }