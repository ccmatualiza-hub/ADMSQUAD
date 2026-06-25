from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from src.api.deps.auth import get_current_user, get_repository, require_admin
from src.infrastructure.db.user_repository import SQLUserRepository

router = APIRouter(prefix="/api/user", tags=["user"])


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: Literal["admin", "user"]
    avatar_url: str | None = None
    active: bool


@router.get("/me", response_model=UserOut)
async def get_me(
    current_user: Annotated[dict, Depends(get_current_user)],
    repo: Annotated[SQLUserRepository, Depends(get_repository)],
) -> UserOut:
    user = await repo.get_by_id(int(current_user["sub"]))
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        avatar_url=user.avatar_url,
        active=user.active,
    )


@router.get("/", response_model=list[UserOut])
async def list_users(
    _: Annotated[dict, Depends(require_admin)],
    repo: Annotated[SQLUserRepository, Depends(get_repository)],
) -> list[UserOut]:
    users = await repo.list_all()
    return [
        UserOut(
            id=u.id, name=u.name, email=u.email,
            role=u.role, avatar_url=u.avatar_url, active=u.active,
        )
        for u in users
    ]
