from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.user import User
from src.infrastructure.db.models import UserModel
from src.infrastructure.security.crypto import hash_password


class SQLUserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_email(self, email: str) -> tuple[User, str] | None:
        result = await self._session.execute(
            select(UserModel).where(UserModel.email == email, UserModel.active == True)  # noqa: E712
        )
        row = result.scalar_one_or_none()
        if row is None:
            return None
        return self._to_domain(row), row.password

    async def get_by_id(self, user_id: int) -> User | None:
        result = await self._session.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
        row = result.scalar_one_or_none()
        return self._to_domain(row) if row else None

    async def list_all(self) -> list[User]:
        result = await self._session.execute(
            select(UserModel).order_by(UserModel.name)
        )
        return [self._to_domain(r) for r in result.scalars().all()]

    async def create(
        self, name: str, email: str, plain_password: str, role: str = "user"
    ) -> User:
        model = UserModel(
            name=name,
            email=email.lower().strip(),
            password=hash_password(plain_password),
            role=role,
        )
        self._session.add(model)
        await self._session.commit()
        await self._session.refresh(model)
        return self._to_domain(model)

    async def update_last_login(self, user_id: int) -> None:
        await self._session.execute(
            update(UserModel)
            .where(UserModel.id == user_id)
            .values(last_login=datetime.now(timezone.utc))
        )
        await self._session.commit()

    @staticmethod
    def _to_domain(model: UserModel) -> User:
        return User(
            id=model.id,
            name=model.name,
            email=model.email,
            role=model.role,  # type: ignore[arg-type]
            avatar_url=model.avatar_url,
            active=model.active,
            created_at=model.created_at,
            last_login=model.last_login,
        )
