from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps.auth import get_current_user, get_db

router = APIRouter(prefix="/api/operacoes", tags=["operacoes"])


class TarefaItem(BaseModel):
    cod: int
    razao: str | None = None
    cliente: str | None = None
    sistema: str | None = None
    versao: str | None = None
    qtdusers: int | None = None
    serverbd: str | None = None
    status: str | None = None
    qtdsistemas: int | None = None


@router.get("/tarefas", response_model=list[TarefaItem])
async def list_tarefas(
    q: str = "",
    _: Annotated[dict, Depends(get_current_user)] = None,
    session: Annotated[AsyncSession, Depends(get_db)] = None,
) -> list[TarefaItem]:
    try:
        where = "WHERE 1=1"
        params: dict = {}
        if q:
            where += " AND (razao LIKE :q OR cliente LIKE :q OR sistema LIKE :q)"
            params["q"] = f"%{q}%"
        result = await session.execute(
            text(f"SELECT cod, razao, cliente, sistema, versao, qtdusers, serverbd, status, qtdsistemas FROM tbl_linx {where} ORDER BY razao"),
            params
        )
        rows = result.fetchall()
        keys = list(result.keys())
        return [TarefaItem(**dict(zip(keys, r))) for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/tarefas/{cod}/concluir")
async def concluir_tarefa(
    cod: int,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        await session.execute(
            text("UPDATE tbl_linx SET qtdsistemas = 1 WHERE cod = :cod"),
            {"cod": cod}
        )
        await session.commit()
        return {"updated": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Tarefas (controle de tarefa aberta) ──────────────────────────────────────

class TarefaAbertaItem(BaseModel):
    cod: int
    tarefa: str
    descricao: str | None = None
    datainicio: str | None = None
    dataconclusao: str | None = None
    status: str


class TarefaAbertaCreate(BaseModel):
    tarefa: str
    descricao: str | None = ""


@router.get("/tarefas-stats")
async def tarefas_stats(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        result = await session.execute(
            text("SELECT COUNT(*) as total, SUM(CASE WHEN qtdsistemas = 1 THEN 1 ELSE 0 END) as sim FROM tbl_linx")
        )
        row = result.fetchone()
        total = int(row[0]) if row and row[0] else 0
        sim = int(row[1]) if row and row[1] else 0
        nao = total - sim
        pct_sim = round(sim / total * 100, 1) if total > 0 else 0.0
        pct_nao = round(nao / total * 100, 1) if total > 0 else 0.0
        return {"sim": sim, "nao": nao, "total": total, "pct_sim": pct_sim, "pct_nao": pct_nao, "todos_concluidos": nao == 0}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/tarefa-aberta")
async def get_tarefa_aberta(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict | None:
    try:
        result = await session.execute(
            text("SELECT cod, tarefa, descricao, datainicio, dataconclusao, status FROM tbl_tarefas WHERE status = 'aberto' ORDER BY cod DESC LIMIT 1")
        )
        row = result.fetchone()
        if not row:
            return None
        keys = list(result.keys())
        d = dict(zip(keys, row))
        return {
            "cod": d["cod"], "tarefa": d["tarefa"], "descricao": d["descricao"],
            "datainicio": str(d["datainicio"]) if d["datainicio"] else None,
            "dataconclusao": str(d["dataconclusao"]) if d["dataconclusao"] else None,
            "status": d["status"],
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/tarefa-aberta", status_code=status.HTTP_201_CREATED)
async def create_tarefa_aberta(
    body: TarefaAbertaCreate,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        # Verifica se já existe tarefa aberta
        check = await session.execute(text("SELECT cod FROM tbl_tarefas WHERE status = 'aberto' LIMIT 1"))
        if check.fetchone():
            raise HTTPException(status_code=400, detail="Já existe uma tarefa aberta. Conclua-a antes de abrir outra.")

        # Verifica se todos os clientes estão com qtdsistemas = 1
        stats = await session.execute(
            text("SELECT SUM(CASE WHEN qtdsistemas != 1 OR qtdsistemas IS NULL THEN 1 ELSE 0 END) as pendentes FROM tbl_linx")
        )
        row = stats.fetchone()
        pendentes = int(row[0]) if row and row[0] else 0
        if pendentes > 0:
            raise HTTPException(status_code=400, detail=f"Existem {pendentes} registro(s) pendentes (Concluído = NÃO). Conclua todos antes de abrir uma nova tarefa.")

        result = await session.execute(
            text("INSERT INTO tbl_tarefas (tarefa, descricao, datainicio, status) VALUES (:tarefa, :descricao, CURDATE(), 'aberto')"),
            {"tarefa": body.tarefa, "descricao": body.descricao or ""}
        )
        # Reseta qtdsistemas para 0 em todos os registros da tbl_linx
        await session.execute(text("UPDATE tbl_linx SET qtdsistemas = 0"))
        await session.commit()
        return {"created": True, "id": result.lastrowid}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/tarefa-aberta/{cod}/concluir")
async def concluir_tarefa_aberta(
    cod: int,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        # Verifica se todos os clientes estão com qtdsistemas = 1
        stats = await session.execute(
            text("SELECT SUM(CASE WHEN qtdsistemas != 1 OR qtdsistemas IS NULL THEN 1 ELSE 0 END) as pendentes FROM tbl_linx")
        )
        row = stats.fetchone()
        pendentes = int(row[0]) if row and row[0] else 0
        if pendentes > 0:
            raise HTTPException(status_code=400, detail=f"Existem {pendentes} registro(s) pendentes (Concluído = NÃO). Conclua todos antes de encerrar a tarefa.")

        await session.execute(
            text("UPDATE tbl_tarefas SET status = 'concluido', dataconclusao = CURDATE() WHERE cod = :cod"),
            {"cod": cod}
        )
        await session.commit()
        return {"concluded": True}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
