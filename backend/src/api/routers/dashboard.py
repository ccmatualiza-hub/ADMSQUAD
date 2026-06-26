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
    # status 6=ATIVO, 7=ATIVO VPU, 0=IMPLANTACAO
    result = await session.execute(
        text("SELECT COUNT(*) FROM tbl_linx WHERE status IN (0, 6, 7)")
    )
    row = result.fetchone()
    return {"total": int(row[0]) if row else 0}


@router.get("/clientes-cx")
async def clientes_cx(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    # status 6=ATIVO, 7=ATIVO VPU
    result = await session.execute(
        text("SELECT COUNT(*) FROM tbl_linx WHERE status IN (6, 7)")
    )
    row = result.fetchone()
    return {"total": int(row[0]) if row else 0}


@router.get("/clientes-pmo")
async def clientes_pmo(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    # status 0=IMPLANTACAO
    result = await session.execute(
        text("SELECT COUNT(*) FROM tbl_linx WHERE status = 0")
    )
    row = result.fetchone()
    return {"total": int(row[0]) if row else 0}


@router.get("/debug-status")
async def debug_status(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """Mostra contagem por status para debug"""
    result = await session.execute(
        text("SELECT status, COUNT(*) as total FROM tbl_linx GROUP BY status ORDER BY status")
    )
    rows = result.fetchall()
    return {"por_status": [{"status": r[0], "total": int(r[1])} for r in rows]}
