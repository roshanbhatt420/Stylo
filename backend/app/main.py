import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.routes import router as api_router
from app.services.model_manager import model_manager

# Configure logging
logging.basicConfig(level=logging.INFO,format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("stylo")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: preload models so first request has zero cold-start delay
    logger.info("Starting Stylo AI Style Transfer Server...")
    try:
        model_manager.load_models()
        logger.info("Models preloaded successfully.")
    except Exception as e:
        logger.warning(f"Warning: Models could not be loaded at startup: {e}. Will attempt on first request.")
    yield
    logger.info("Shutting down Stylo AI Style Transfer Server...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    lifespan=lifespan
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "status": "online",
        "docs_url": "/docs",
        "api_health": "/api/health"
    }

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal Server Error", "detail": str(exc)}
    )

