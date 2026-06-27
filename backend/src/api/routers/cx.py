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
    pct_nao_iniciado: float
    pct_em_andamento: float
    pct_concluido: float
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


# ── Agendamentos ──────────────────────────────────────────────────────────────

class AgendamentoCreate(BaseModel):
    cod: int
    cliente: str
    dt_atualiza: str
    ticketupdate: str
    formato: str
    tipo: str
    pacote: str
    useragend: str


class AgendamentoItem(BaseModel):
    cod: int
    razao: str | None = None
    cliente: str | None = None
    sistema: str | None = None
    bd: str | None = None
    versao: str | None = None
    dt_atualiza: str | None = None
    ticketupdate: str | None = None
    formato: str | None = None
    tipo: str | None = None
    pacote: str | None = None
    useragend: str | None = None
    concluido: str | int | None = None
    status: str | None = None


@router.get("/agendamentos/hoje", response_model=list[AgendamentoItem])
async def agendamentos_hoje(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[AgendamentoItem]:
    try:
        result = await session.execute(
            text("""
                SELECT cod, razao, cliente, sistema, bd, versao,
                       dt_atualiza, ticketupdate, formato, tipo, pacote, useragend, concluido, status
                FROM tbl_linx
                WHERE dt_atualiza = DATE_FORMAT(CURDATE(), '%d/%m/%Y')
                ORDER BY razao
            """)
        )
        rows = result.fetchall()
        keys = list(result.keys())
        return [AgendamentoItem(**dict(zip(keys, r))) for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/agendamentos/clientes-disponiveis")
async def clientes_disponiveis(
    q: str = "",
    _: Annotated[dict, Depends(get_current_user)] = None,
    session: Annotated[AsyncSession, Depends(get_db)] = None,
) -> list[dict]:
    try:
        where = "status IN ('6 - ATIVO', '7 - ATIVO VPU', '0 - IMPLANTAÇÃO', 'X - ATIVO COMPLEMENTO')"
        params: dict = {}
        if q:
            where += " AND (razao LIKE :q OR cliente LIKE :q)"
            params["q"] = f"%{q}%"
        result = await session.execute(
            text(f"SELECT cod, cliente, razao FROM tbl_linx WHERE {where} ORDER BY razao LIMIT 50"),
            params
        )
        rows = result.fetchall()
        return [{"cod": r[0], "cliente": r[1], "razao": r[2]} for r in rows if r[1]]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/agendamentos", status_code=200)
async def create_agendamento(
    body: AgendamentoCreate,
    current_user: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        useragend = (current_user.get("name", body.useragend) or "")[:15]
        formato   = (body.formato or "M")[:1]
        tipo      = (body.tipo or "E")[:1]
        pacote    = (body.pacote or "EVO")[:10]

        # 1. UPDATE tbl_linx
        result = await session.execute(
            text("""
                UPDATE tbl_linx SET
                    dt_atualiza  = :dt_atualiza,
                    ticketupdate = :ticketupdate,
                    concluido    = 0,
                    formato      = :formato,
                    tipo         = :tipo,
                    pacote       = :pacote,
                    useragend    = :useragend
                WHERE cod = :cod
            """),
            {
                "dt_atualiza":  body.dt_atualiza,
                "ticketupdate": body.ticketupdate,
                "formato":      formato,
                "tipo":         tipo,
                "pacote":       pacote,
                "useragend":    useragend,
                "cod":          body.cod,
            }
        )

        # 2. Buscar dados do cliente na tbl_linx
        linx = await session.execute(
            text("SELECT razao, cliente, sistema, versao, bd, status FROM tbl_linx WHERE cod = :cod"),
            {"cod": body.cod}
        )
        row = linx.fetchone()

        if row:
            razao, cliente, sistema, versao, bd, status_linx = row

            # 3. INSERT na tbl_history
            await session.execute(
                text("""
                    INSERT INTO tbl_history
                        (razao, cliente, sistema, versao, data, tipo, pacote, ticket, bd, useragendar, concluido, status)
                    VALUES
                        (:razao, :cliente, :sistema, :versao, :data, :tipo, :pacote, :ticket, :bd, :useragendar, 0, 'AGENDADO')
                """),
                {
                    "razao":       razao or "",
                    "cliente":     cliente or "",
                    "sistema":     sistema or "",
                    "versao":      versao or "",
                    "data":        body.dt_atualiza,
                    "tipo":        tipo,
                    "pacote":      pacote[:3],
                    "ticket":      body.ticketupdate[:10],
                    "bd":          bd or "",
                    "useragendar": useragend,
                }
            )

        await session.commit()
        return {"updated": result.rowcount, "cod": body.cod}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/agendamentos/{cod}", status_code=200)
async def cancelar_agendamento(
    cod: int,
    current_user: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        # 1. Buscar dados antes de cancelar
        linx = await session.execute(
            text("SELECT cliente, dt_atualiza FROM tbl_linx WHERE cod = :cod"),
            {"cod": cod}
        )
        row = linx.fetchone()

        # 2. UPDATE tbl_linx — zera data e marca concluido=100
        await session.execute(
            text("UPDATE tbl_linx SET dt_atualiza = '00/00/0000', concluido = 100 WHERE cod = :cod"),
            {"cod": cod}
        )

        # 3. DELETE tbl_history pelo cliente e data
        if row:
            cliente, data = row
            await session.execute(
                text("DELETE FROM tbl_history WHERE cliente = :cliente AND data = :data"),
                {"cliente": cliente or "", "data": data or ""}
            )

        await session.commit()
        return {"cancelled": True, "cod": cod}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/agendamentos/{cod}", status_code=200)
async def update_agendamento(
    cod: int,
    body: AgendamentoCreate,
    current_user: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        result = await session.execute(
            text("""
                UPDATE tbl_linx SET
                    dt_atualiza  = :dt_atualiza,
                    ticketupdate = :ticketupdate,
                    concluido    = 0,
                    formato      = :formato,
                    tipo         = :tipo,
                    pacote       = :pacote,
                    useragend    = :useragend
                WHERE cod = :cod
            """),
            {
                "dt_atualiza":  body.dt_atualiza,
                "ticketupdate": body.ticketupdate,
                "formato":      (body.formato or "M")[:1],
                "tipo":         (body.tipo or "E")[:1],
                "pacote":       (body.pacote or "EVO")[:10],
                "useragend":    (current_user.get("name", body.useragend) or "")[:15],
                "cod":          cod,
            }
        )
        await session.commit()
        return {"updated": result.rowcount}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
