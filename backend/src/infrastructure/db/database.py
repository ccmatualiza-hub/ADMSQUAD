from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import event, text

from src.config import settings

engine = create_async_engine(
    settings.database_url,
    pool_size=5,
    max_overflow=3,
    pool_pre_ping=True,        # testa conexão antes de usar
    pool_recycle=300,          # recicla a cada 5min — bem antes do MySQL timeout
    pool_timeout=30,
    pool_use_lifo=True,        # usa conexões mais recentes primeiro (menos chance de expirar)
    echo=False,
    connect_args={
        "connect_timeout": 10,
    },
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            # keepalive: executa SELECT 1 para garantir conexão viva
            await session.execute(text("SELECT 1"))
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
