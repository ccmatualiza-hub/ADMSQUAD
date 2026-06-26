from urllib.parse import quote_plus
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Database
    db_host: str
    db_port: int = 3306
    db_user: str
    db_password: str
    db_name: str

    # Security
    jwt_secret: str
    jwt_expire_hours: int = 8

    # App
    app_port: int = 3001
    frontend_url: str = "http://localhost:5173"

    @property
    def database_url(self) -> str:
        # quote_plus escapa caracteres especiais como @ na senha
        password = quote_plus(self.db_password)
        return (
            f"mysql+asyncmy://{self.db_user}:{password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
            f"?charset=utf8mb4"
        )


settings = Settings()  # type: ignore[call-arg]
