from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps.auth import get_current_user, get_db

router = APIRouter(prefix="/api/cx", tags=["cx"])


class ClienteItem(BaseModel):
    cod: int
    razao: str | None = None
    cliente: str | None = None
    sistema: str | None = None
    versao: str | None = None
    qtdusers: int | None = None
    serverbd: str | None = None
    status: str | None = None


class ClienteDetalhe(BaseModel):
    cod: int
    razao: str | None = None
    cliente: str | None = None
    bandeira: str | None = None
    sistema: str | None = None
    versao: str | None = None
    bd: str | None = None
    serverbd: str | None = None
    qtdusers: int | None = None
    qtdsistemas: int | None = None
    qtdsrv: str | None = None
    status: str | None = None
    contatos: str | None = None
    telefones: str | None = None
    emails: str | None = None
    reg: str | None = None
    local: str | None = None
    grupo: str | None = None
    tipo: str | None = None
    pacote: str | None = None
    dt_atualiza: str | None = None
    versaoat: str | None = None
    franq: str | None = None
    ufmatriz: str | None = None
    integracoes: str | None = None
    infraprod: str | None = None
    infrats: str | None = None
    shape: str | None = None
    ocpu: str | None = None
    mem: str | None = None
    tsplus: str | None = None
    detalhes: str | None = None
    implat: str | None = None
    datastart: str | None = None
    prxcontat: str | None = None
    cnpj: str | None = None
    agtazure: str | None = None
    linxwebver: str | None = None


@router.get("/clientes", response_model=list[ClienteItem])
async def list_clientes(
    q: str = "",
    status_filter: str = "",
    _: Annotated[dict, Depends(get_current_user)] = None,
    session: Annotated[AsyncSession, Depends(get_db)] = None,
) -> list[ClienteItem]:
    try:
        where = "WHERE 1=1"
        params: dict = {}
        if q:
            where += " AND (razao LIKE :q OR cliente LIKE :q OR sistema LIKE :q)"
            params["q"] = f"%{q}%"
        if status_filter:
            where += " AND status = :status"
            params["status"] = status_filter
        result = await session.execute(
            text(f"SELECT cod, razao, cliente, sistema, versao, qtdusers, serverbd, status FROM tbl_linx {where} ORDER BY razao LIMIT 500"),
            params
        )
        rows = result.fetchall()
        keys = list(result.keys())
        return [ClienteItem(**dict(zip(keys, r))) for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/clientes/status-options")
async def status_options(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[str]:
    result = await session.execute(
        text("SELECT DISTINCT status FROM tbl_linx WHERE status IS NOT NULL AND status != '' ORDER BY status")
    )
    return [r[0] for r in result.fetchall()]


@router.get("/clientes/{cod}", response_model=ClienteDetalhe)
async def get_cliente(
    cod: int,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> ClienteDetalhe:
    result = await session.execute(
        text("""SELECT cod, razao, cliente, bandeira, sistema, versao, bd, serverbd,
                       qtdusers, qtdsistemas, qtdsrv, status, contatos, telefones, emails,
                       reg, local, grupo, tipo, pacote, dt_atualiza, versaoat, franq, ufmatriz,
                       integracoes, infraprod, infrats, shape, ocpu, mem, tsplus, detalhes,
                       implat, datastart, prxcontat, cnpj, agtazure, linxwebver
                FROM tbl_linx WHERE cod = :cod"""),
        {"cod": cod}
    )
    row = result.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    keys = list(result.keys())
    return ClienteDetalhe(**dict(zip(keys, row)))


# ── Monitor de Atualizações ──────────────────────────────────────────────────

class AtualizacaoItem(BaseModel):
    cod: int | None = None
    razao: str | None = None
    sistema: str | None = None
    bd: str | None = None
    versao: str | None = None
    ticketupdate: str | None = None
    tipo: str | None = None
    pacote: str | None = None
    useragend: str | None = None
    prioridade: int | None = None
    horaupdate: str | None = None
    concluido: str | int | None = None


class AtualizacaoStats(BaseModel):
    total: int
    pct_nao_iniciado: float   # concluido = '0'
    pct_em_andamento: float   # concluido != '0' e != '100'
    pct_concluido: float      # concluido = '100'
    nao_iniciado: int
    em_andamento: int
    concluido_count: int


@router.get("/atualizacoes/stats", response_model=AtualizacaoStats)
async def atualizacoes_stats(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AtualizacaoStats:
    try:
        result = await session.execute(
            text("""
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN (TRIM(CAST(concluido AS CHAR)) = '0' OR concluido = 0) THEN 1 ELSE 0 END) as nao_iniciado,
                    SUM(CASE WHEN (TRIM(CAST(concluido AS CHAR)) NOT IN ('0','100') AND concluido NOT IN (0,100)) THEN 1 ELSE 0 END) as em_andamento,
                    SUM(CASE WHEN (TRIM(CAST(concluido AS CHAR)) = '100' OR concluido = 100) THEN 1 ELSE 0 END) as concluido_count
                FROM tbl_linx
                WHERE dt_atualiza = DATE_FORMAT(CURDATE(), '%d/%m/%Y')
            """)
        )
        row = result.fetchone()
        total = int(row[0]) if row and row[0] else 0
        nao   = int(row[1]) if row and row[1] else 0
        em    = int(row[2]) if row and row[2] else 0
        conc  = int(row[3]) if row and row[3] else 0
        def pct(n): return round(n / total * 100, 1) if total > 0 else 0.0
        return AtualizacaoStats(
            total=total, nao_iniciado=nao, em_andamento=em, concluido_count=conc,
            pct_nao_iniciado=pct(nao), pct_em_andamento=pct(em), pct_concluido=pct(conc)
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/atualizacoes", response_model=list[AtualizacaoItem])
async def list_atualizacoes(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[AtualizacaoItem]:
    try:
        result = await session.execute(
            text("""
                SELECT cod, razao, sistema, bd, versao, ticketupdate, tipo, pacote,
                       useragend, prioridade, horaupdate, concluido
                FROM tbl_linx
                WHERE dt_atualiza = DATE_FORMAT(CURDATE(), '%d/%m/%Y')
                ORDER BY prioridade ASC, razao ASC
            """)
        )
        rows = result.fetchall()
        keys = list(result.keys())
        return [AtualizacaoItem(**dict(zip(keys, r))) for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
