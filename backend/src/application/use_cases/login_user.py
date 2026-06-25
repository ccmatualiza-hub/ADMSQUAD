from dataclasses import dataclass

from src.application.ports import UserRepository
from src.domain.user import User
from src.infrastructure.security.crypto import create_access_token, verify_password


@dataclass
class LoginResult:
    token: str
    user: User


class LoginUser:
    def __init__(self, users: UserRepository) -> None:
        self._users = users

    async def execute(self, email: str, password: str) -> LoginResult | None:
        result = await self._users.get_by_email(email.lower().strip())
        if result is None:
            return None

        user, hashed = result
        if not user.active or not verify_password(password, hashed):
            return None

        await self._users.update_last_login(user.id)

        token = create_access_token({
            "sub": str(user.id),
            "email": user.email,
            "name": user.name,
            "role": user.role,
        })

        return LoginResult(token=token, user=user)
