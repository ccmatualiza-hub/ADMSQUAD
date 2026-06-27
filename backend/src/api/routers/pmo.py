from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps.auth import get_current_user, get_db

router = APIRouter(prefix="/api/pmo", tags=["pmo"])


class ClientePmoItem(BaseModel):
    cod: int
    razao: str | None = None
    implat: str | None = None
    franq: str | None = None
    qtdusers: int | None = None
    prxcontat: str | None = None
    datprev: str | None = None
    stimplant: str | None = None
    status: str | None = None


class ClientePmoCreate(BaseModel):
    razao: str
    cliente: str
    qtdusers: int | None = None
    datprev: str | None = None
    sistema: str | None = None
    prxcontat: str | None = None
    franq: str | None = None
    implat: str | None = None
    stimplant: str | None = None


class ClientePmoUpdate(BaseModel):
    razao: str | None = None
    qtdusers: int | None = None
    datprev: str | None = None
    sistema: str | None = None
    prxcontat: str | None = None
    franq: str | None = None
    implat: str | None = None
    stimplant: str | None = None


@router.get("/clientes", response_model=list[ClientePmoItem])
async def list_clientes_pmo(
    q: str = "",
    _: Annotated[dict, Depends(get_current_user)] = None,
    session: Annotated[AsyncSession, Depends(get_db)] = None,
) -> list[ClientePmoItem]:
    try:
        params: dict = {}
        where = "WHERE status = '0 - IMPLANTAÇÃO'"
        if q:
            where += " AND (razao LIKE :q OR implat LIKE :q OR franq LIKE :q)"
            params["q"] = f"%{q}%"
        result = await session.execute(
            text(f"SELECT cod, razao, implat, franq, qtdusers, prxcontat, datprev, stimplant, status FROM tbl_linx {where} ORDER BY razao"),
            params
        )
        rows = result.fetchall()
        keys = list(result.keys())
        return [ClientePmoItem(**dict(zip(keys, r))) for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/clientes", status_code=status.HTTP_201_CREATED)
async def create_cliente_pmo(
    body: ClientePmoCreate,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        result = await session.execute(
            text("""
                INSERT INTO tbl_linx (razao, cliente, qtdusers, datprev, sistema, prxcontat, franq, implat, stimplant, status)
                VALUES (:razao, :cliente, :qtdusers, :datprev, :sistema, :prxcontat, :franq, :implat, :stimplant, '0 - IMPLANTAÇÃO')
            """),
            {
                "razao":     body.razao,
                "cliente":   body.cliente,
                "qtdusers":  body.qtdusers or 0,
                "datprev":   body.datprev or "",
                "sistema":   body.sistema or "",
                "prxcontat": body.prxcontat or "",
                "franq":     body.franq or "",
                "implat":    body.implat or "",
                "stimplant": body.stimplant or "",
            }
        )
        await session.commit()
        return {"created": True, "id": result.lastrowid}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/clientes/{cod}")
async def update_cliente_pmo(
    cod: int,
    body: ClientePmoUpdate,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        sets, params = [], {"cod": cod}
        if body.razao     is not None: sets.append("razao=:razao");         params["razao"]     = body.razao
        if body.qtdusers  is not None: sets.append("qtdusers=:qtdusers");   params["qtdusers"]  = body.qtdusers
        if body.datprev   is not None: sets.append("datprev=:datprev");     params["datprev"]   = body.datprev
        if body.sistema   is not None: sets.append("sistema=:sistema");     params["sistema"]   = body.sistema
        if body.prxcontat is not None: sets.append("prxcontat=:prxcontat"); params["prxcontat"] = body.prxcontat
        if body.franq     is not None: sets.append("franq=:franq");         params["franq"]     = body.franq
        if body.implat    is not None: sets.append("implat=:implat");       params["implat"]    = body.implat
        if body.stimplant is not None: sets.append("stimplant=:stimplant"); params["stimplant"] = body.stimplant
        if not sets:
            raise HTTPException(status_code=400, detail="Nada para atualizar")
        await session.execute(text(f"UPDATE tbl_linx SET {', '.join(sets)} WHERE cod = :cod"), params)
        await session.commit()
        return {"updated": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
