from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from src.api.deps.auth import get_repository
from src.application.use_cases.login_user import LoginUser
from src.infrastructure.db.user_repository import SQLUserRepository
from src.logger import logger

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    avatar_url: str | None = None


class LoginResponse(BaseModel):
    token: str
    user: UserOut


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "user"


@router.post("/login", response_model=LoginResponse)
async def login(
    body: LoginRequest,
    repo: Annotated[SQLUserRepository, Depends(get_repository)],
) -> LoginResponse:
    result = await LoginUser(repo).execute(body.email, body.password)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    logger.info("user_logged_in", user_id=result.user.id, email=result.user.email)
    return LoginResponse(
        token=result.token,
        user=UserOut(
            id=result.user.id,
            name=result.user.name,
            email=result.user.email,
            role=result.user.role,
            avatar_url=result.user.avatar_url,
        ),
    )


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    repo: Annotated[SQLUserRepository, Depends(get_repository)],
) -> dict:
    try:
        user = await repo.create(body.name, body.email, body.password, body.role)
        return {"id": user.id, "message": "User created"}
    except Exception as exc:
        if "Duplicate entry" in str(exc):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already in use")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal error")
