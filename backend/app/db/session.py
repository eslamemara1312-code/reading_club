from typing import AsyncGenerator
import ssl
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.core.config import settings


def _build_connect_args() -> dict:
    """Build connection args with SSL for Supabase/production databases."""
    connect_args: dict = {}
    db_url = settings.DATABASE_URL

    # Supabase and most cloud Postgres providers require SSL
    if "supabase" in db_url or "railway" in db_url or settings.ENVIRONMENT == "production":
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE
        connect_args["ssl"] = ssl_ctx

    # Supabase pooler (port 6543) uses PgBouncer transaction mode,
    # which is incompatible with asyncpg prepared statement caching
    if ":6543/" in db_url:
        connect_args["prepared_statement_cache_size"] = 0

    return connect_args


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
    connect_args=_build_connect_args(),
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for obtaining DB session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
