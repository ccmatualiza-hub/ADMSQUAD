from fastapi import APIRouter, Depends
from typing import Annotated
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps.auth import get_current_user, get_db

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/clientes-ativos")
async def clientes_ativos(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    result = await session.execute(
        text("SELECT COUNT(*) as total FROM tbl_linx WHERE status IN (0, 6, 7)")
    )
    row = result.fetchone()
    return {"total": row[0] if row else 0}


@router.get("/clientes-cx")
async def clientes_cx(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    result = await session.execute(
        text("SELECT COUNT(*) as total FROM tbl_linx WHERE status IN (6, 7)")
    )
    row = result.fetchone()
    return {"total": row[0] if row else 0}
