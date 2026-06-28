from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps.auth import get_current_user, get_db

router = APIRouter(prefix="/api/gestao", tags=["gestao"])


class LinkItem(BaseModel):
    cod: int
    acesso: str | None = None
    grupo: str | None = None
    link: str | None = None


class LinkCreate(BaseModel):
    acesso: str
    grupo: str | None = None
    link: str


class LinkUpdate(BaseModel):
    acesso: str | None = None
    grupo: str | None = None
    link: str | None = None


@router.get("/links", response_model=list[LinkItem])
async def list_links(
    q: str = "",
    _: Annotated[dict, Depends(get_current_user)] = None,
    session: Annotated[AsyncSession, Depends(get_db)] = None,
) -> list[LinkItem]:
    try:
        params: dict = {}
        where = "WHERE 1=1"
        if q:
            where += " AND (acesso LIKE :q OR grupo LIKE :q OR link LIKE :q)"
            params["q"] = f"%{q}%"
        result = await session.execute(
            text(f"SELECT cod, acesso, grupo, link FROM tbl_gacess {where} ORDER BY grupo, acesso"),
            params
        )
        rows = result.fetchall()
        keys = list(result.keys())
        return [LinkItem(**dict(zip(keys, r))) for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/links", status_code=status.HTTP_201_CREATED)
async def create_link(
    body: LinkCreate,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        result = await session.execute(
            text("INSERT INTO tbl_gacess (acesso, grupo, link) VALUES (:acesso, :grupo, :link)"),
            {"acesso": body.acesso, "grupo": body.grupo or "", "link": body.link}
        )
        await session.commit()
        return {"created": True, "id": result.lastrowid}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/links/{cod}")
async def update_link(
    cod: int,
    body: LinkUpdate,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        sets, params = [], {"cod": cod}
        if body.acesso is not None: sets.append("acesso=:acesso"); params["acesso"] = body.acesso
        if body.grupo  is not None: sets.append("grupo=:grupo");   params["grupo"]  = body.grupo
        if body.link   is not None: sets.append("link=:link");     params["link"]   = body.link
        if not sets:
            raise HTTPException(status_code=400, detail="Nada para atualizar")
        await session.execute(text(f"UPDATE tbl_gacess SET {', '.join(sets)} WHERE cod = :cod"), params)
        await session.commit()
        return {"updated": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/links/{cod}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_link(
    cod: int,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    try:
        await session.execute(text("DELETE FROM tbl_gacess WHERE cod = :cod"), {"cod": cod})
        await session.commit()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
