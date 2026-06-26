from datetime import datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps.auth import get_current_user, get_db, require_admin
from src.infrastructure.db.models import UserModel
from src.infrastructure.security.crypto import hash_password

router = APIRouter(prefix="/api/user", tags=["user"])

RoleType = Literal["admin", "gestor", "operador_cx", "operador_pmo", "user"]


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    active: bool
    created_at: datetime | None = None
    last_login: datetime | None = None


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: RoleType = "operador_cx"


class UserUpdate(BaseModel):
    name: str | None = None
    role: RoleType | None = None
    active: bool | None = None
    password: str | None = None


async def get_db_session(session: Annotated[AsyncSession, Depends(get_db)]) -> AsyncSession:
    return session


@router.get("/me", response_model=UserOut)
async def get_me(
    current_user: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> UserOut:
    result = await session.execute(select(UserModel).where(UserModel.id == int(current_user["sub"])))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserOut(id=user.id, name=user.name, email=user.email, role=user.role,
                   active=user.active, created_at=user.created_at, last_login=user.last_login)


@router.get("/", response_model=list[UserOut])
async def list_users(
    _: Annotated[dict, Depends(require_admin)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[UserOut]:
    result = await session.execute(select(UserModel).order_by(UserModel.name))
    users = result.scalars().all()
    return [UserOut(id=u.id, name=u.name, email=u.email, role=u.role,
                    active=u.active, created_at=u.created_at, last_login=u.last_login)
            for u in users]


@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    body: UserCreate,
    _: Annotated[dict, Depends(require_admin)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> UserOut:
    model = UserModel(
        name=body.name,
        email=body.email.lower().strip(),
        password=hash_password(body.password),
        role=body.role,
    )
    session.add(model)
    try:
        await session.commit()
        await session.refresh(model)
    except Exception as exc:
        await session.rollback()
        if "Duplicate entry" in str(exc):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email já cadastrado")
        raise HTTPException(status_code=500, detail="Erro interno")
    return UserOut(id=model.id, name=model.name, email=model.email, role=model.role,
                   active=model.active, created_at=model.created_at, last_login=model.last_login)


@router.put("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: int,
    body: UserUpdate,
    _: Annotated[dict, Depends(require_admin)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> UserOut:
    result = await session.execute(select(UserModel).where(UserModel.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
    if body.name is not None:
        user.name = body.name
    if body.role is not None:
        user.role = body.role
    if body.active is not None:
        user.active = body.active
    if body.password:
        user.password = hash_password(body.password)
    await session.commit()
    await session.refresh(user)
    return UserOut(id=user.id, name=user.name, email=user.email, role=user.role,
                   active=user.active, created_at=user.created_at, last_login=user.last_login)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_user(
    user_id: int,
    current_user: Annotated[dict, Depends(require_admin)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    if int(current_user["sub"]) == user_id:
        raise HTTPException(status_code=400, detail="Não é possível inativar o próprio usuário")
    await session.execute(
        update(UserModel).where(UserModel.id == user_id).values(active=False)
    )
    await session.commit()
