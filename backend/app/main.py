import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

logging.basicConfig(
    level=logging.INFO if settings.ENVIRONMENT == "production" else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("reading_club")


from app.core.scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.PROJECT_NAME} in [{settings.ENVIRONMENT}] mode")
    start_scheduler()
    yield
    stop_scheduler()
    logger.info(f"Shutting down {settings.PROJECT_NAME}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/api/v1/openapi.json" if settings.ENVIRONMENT != "production" else None,
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
    lifespan=lifespan
)

from app.api.v1.routes import api_v1_router

# CORS configuration
origins = settings.CORS_ORIGINS
if isinstance(origins, str):
    origins = [o.strip() for o in origins.split(",") if o.strip()]

# Always include the known production frontend + local dev
_always_allowed = [
    "https://reading-club-mu.vercel.app",
    "https://reading-club.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
]
if isinstance(origins, list):
    for o in _always_allowed:
        if o not in origins:
            origins.append(o)

if isinstance(origins, list) and "*" in origins:
    cors_kwargs = {"allow_origins": ["*"], "allow_credentials": False}
else:
    cors_kwargs = {
        "allow_origins": origins if isinstance(origins, list) else _always_allowed,
        "allow_origin_regex": r"https://.*\.vercel\.app|http://localhost:\d+",
        "allow_credentials": True,
    }

app.add_middleware(
    CORSMiddleware,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    **cors_kwargs,
)

app.include_router(api_v1_router)


@app.get("/health", tags=["Health Check"])
async def health_check():
    return {
        "status": "ok",
        "project": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT
    }
