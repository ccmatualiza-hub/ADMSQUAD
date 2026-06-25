from dataclasses import dataclass
from datetime import datetime
from typing import Literal


@dataclass
class User:
    id: int
    name: str
    email: str
    role: Literal["admin", "user"]
    avatar_url: str | None
    active: bool
    created_at: datetime
    last_login: datetime | None
