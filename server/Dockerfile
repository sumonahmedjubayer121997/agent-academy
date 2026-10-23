# Build context = repository root:  docker build -f server/Dockerfile -t agent-academy-api .
FROM python:3.12-slim AS base

WORKDIR /app
COPY server/requirements.txt ./server/requirements.txt
RUN pip install --no-cache-dir -r server/requirements.txt

COPY server/ ./server/

# Run as an unprivileged user
RUN useradd -m appuser && chown -R appuser /app
USER appuser

EXPOSE 8000
CMD ["uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "8000"]
