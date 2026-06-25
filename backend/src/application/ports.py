from typing import Protocol

from src.domain.user import User


class UserRepository(Protocol):
    async def get_by_email(self, email: str) -> tuple[User, str] | None:
        """Returns (User, hashed_password) or None."""
        ...

    async def get_by_id(self, user_id: int) -> User | None:
        ...

    async def list_all(self) -> list[User]:
        ...

    async def create(self, name: str, email: str, hashed_password: str, role: str) -> User:
        ...

    async def update_last_login(self, user_id: int) -> None:
        ...
