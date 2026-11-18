from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from backend.app.api.endpoints import router as api_router
from backend.app.core.config import settings
from backend.app.services.model_service import model_service

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
DIST_DIR = ROOT_DIR / "frontend" / "dist"

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: preload model
    print("[STARTUP] Preloading ECG-Guard model...")
    success = model_service.load_model()
    if success:
        print("[STARTUP] Model loaded and ready for inference.")
    else:
        print(f"[STARTUP WARNING] {model_service.load_error}")
    yield
    # Shutdown
    print("[SHUTDOWN] ECG-Guard service shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="ECG-Guard V3 Heartbeat Classification API (Academic Research Prototype)",
    lifespan=lifespan,
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix=settings.API_PREFIX)

# Custom exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"[UNHANDLED EXCEPTION] {request.method} {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred while processing the request."},
    )

# If built frontend exists, mount it to serve the SPA
if DIST_DIR.exists() and (DIST_DIR / "index.html").exists():
    print(f"[INFO] Mounting frontend static files from {DIST_DIR}")
    app.mount("/", StaticFiles(directory=str(DIST_DIR), html=True), name="frontend")
else:
    @app.get("/")
    async def root():
        return {
            "name": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "docs_url": "/docs",
            "api_prefix": settings.API_PREFIX,
            "status": "online",
            "disclaimer": (
                "ECG-Guard is an academic research prototype, not a medical device. "
                "It is not intended to diagnose, treat, or rule out any medical condition."
            ),
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
