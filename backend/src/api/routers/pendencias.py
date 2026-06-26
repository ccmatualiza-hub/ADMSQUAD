from datetime import date
from typing import Annotated, Literal
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps.auth import get_current_user, get_db

router = APIRouter(prefix="/api/pendencias", tags=["pendencias"])

StatusType = Literal["aberto", "em_andamento", "impedimento", "resolvido"]


class PendenciaOut(BaseModel):
    id: int
    cliente: str
    ticket: str
    descritivo: str
    status: str
    data: str
    dias: int | None
    created_at: str | None = None


class PendenciaCreate(BaseModel):
    cliente: str
    ticket: str
    descritivo: str
    status: StatusType = "aberto"
    data: date


class PendenciaUpdate(BaseModel):
    cliente: str | None = None
    ticket: str | None = None
    descritivo: str | None = None
    status: StatusType | None = None
    data: date | None = None


def row_to_dict(row, keys) -> PendenciaOut:
    d = dict(zip(keys, row))
    return PendenciaOut(
        id=d["id"],
        cliente=d["cliente"],
        ticket=d["ticket"],
        descritivo=d["descritivo"],
        status=d["status"],
        data=str(d["data"]),
        dias=d["dias"],
        created_at=str(d["created_at"]) if d.get("created_at") else None,
    )


@router.get("/", response_model=list[PendenciaOut])
async def list_pendencias(
    current_user: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[PendenciaOut]:
    result = await session.execute(
        text("SELECT id, cliente, ticket, descritivo, status, data, dias, created_at FROM tbl_pendencias ORDER BY data DESC, id DESC")
    )
    rows = result.fetchall()
    keys = list(result.keys())
    return [row_to_dict(r, keys) for r in rows]


@router.post("/", response_model=PendenciaOut, status_code=status.HTTP_201_CREATED)
async def create_pendencia(
    body: PendenciaCreate,
    current_user: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PendenciaOut:
    result = await session.execute(
        text("""
            INSERT INTO tbl_pendencias (cliente, ticket, descritivo, status, data, created_by)
            VALUES (:cliente, :ticket, :descritivo, :status, :data, :created_by)
        """),
        {
            "cliente": body.cliente,
            "ticket": body.ticket,
            "descritivo": body.descritivo,
            "status": body.status,
            "data": str(body.data),
            "created_by": int(current_user["sub"]),
        }
    )
    await session.commit()
    new_id = result.lastrowid
    result2 = await session.execute(
        text("SELECT id, cliente, ticket, descritivo, status, data, dias, created_at FROM tbl_pendencias WHERE id = :id"),
        {"id": new_id}
    )
    row = result2.fetchone()
    return row_to_dict(row, list(result2.keys()))


@router.put("/{pendencia_id}", response_model=PendenciaOut)
async def update_pendencia(
    pendencia_id: int,
    body: PendenciaUpdate,
    current_user: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PendenciaOut:
    sets = []
    params: dict = {"id": pendencia_id}
    if body.cliente    is not None: sets.append("cliente = :cliente");     params["cliente"]    = body.cliente
    if body.ticket     is not None: sets.append("ticket = :ticket");       params["ticket"]     = body.ticket
    if body.descritivo is not None: sets.append("descritivo = :descritivo"); params["descritivo"] = body.descritivo
    if body.status     is not None: sets.append("status = :status");       params["status"]     = body.status
    if body.data       is not None: sets.append("data = :data");           params["data"]       = str(body.data)
    if not sets:
        raise HTTPException(status_code=400, detail="Nada para atualizar")
    await session.execute(text(f"UPDATE tbl_pendencias SET {', '.join(sets)} WHERE id = :id"), params)
    await session.commit()
    result = await session.execute(
        text("SELECT id, cliente, ticket, descritivo, status, data, dias, created_at FROM tbl_pendencias WHERE id = :id"),
        {"id": pendencia_id}
    )
    row = result.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Pendência não encontrada")
    return row_to_dict(row, list(result.keys()))


@router.delete("/{pendencia_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pendencia(
    pendencia_id: int,
    current_user: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    await session.execute(text("DELETE FROM tbl_pendencias WHERE id = :id"), {"id": pendencia_id})
    await session.commit()
