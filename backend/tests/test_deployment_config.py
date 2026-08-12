from pathlib import Path

import pytest
from starlette.requests import Request

from app.main import global_exception_handler


def test_railway_dockerfile_runs_migrations_before_startup():
    repository_root = Path(__file__).resolve().parents[2]
    dockerfile = (repository_root / "Dockerfile").read_text(encoding="utf-8")

    assert "alembic upgrade head && uvicorn" in dockerfile


@pytest.mark.asyncio
async def test_unhandled_error_keeps_cors_header_for_production_frontend():
    request = Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/failing-endpoint",
            "headers": [
                (b"origin", b"https://reading-club-mu.vercel.app"),
            ],
        }
    )

    response = await global_exception_handler(request, RuntimeError("test failure"))

    assert response.status_code == 500
    assert response.headers["access-control-allow-origin"] == (
        "https://reading-club-mu.vercel.app"
    )
    assert response.headers["vary"] == "Origin"
