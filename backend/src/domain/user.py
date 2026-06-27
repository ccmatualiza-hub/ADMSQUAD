from dataclasses import dataclass
from datetime import datetime
@dataclass
class User:
    id: int
    name: str
    email: str
    role: str
    avatar_url: str | None
    active: bool
    created_at: datetime
    last_login: datetime | None
