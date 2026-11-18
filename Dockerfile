# ==============================================================================
# Stage 1: Build the React + TypeScript + Vite frontend
# ==============================================================================
FROM node:20-slim AS frontend-builder

WORKDIR /frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ==============================================================================
# Stage 2: Python FastAPI backend + CPU-only PyTorch serving API & built SPA
# ==============================================================================
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=7860

WORKDIR /app

# Install lightweight CPU-only PyTorch first so pip does not pull the ~2 GB CUDA build
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch \
    && pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code, trained model artefacts, and deployment config
COPY backend/ ./backend/
COPY models/ ./models/
COPY deployment_config.json ./deployment_config.json

# Copy built frontend static bundle from Stage 1
COPY --from=frontend-builder /frontend/dist ./frontend/dist

# Ensure non-root user compatibility (required by Hugging Face Spaces)
RUN chmod -R a+rX /app

EXPOSE 7860

CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
