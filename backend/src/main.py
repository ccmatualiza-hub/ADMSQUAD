import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.routers import auth, user, dashboard, pendencias, cx
from src.config import settings
from src.logger import logger

REQUIRED = ["db_host", "db_user", "db_password", "db_name", "jwt_secret"]
for field in REQUIRED:
    if not getattr(settings, field, None):
        logger.critical("missing_required_env", field=field)
        sys.exit(1)

app = FastAPI(title="CCM App API", version="1.0.0",
              docs_url="/api/docs", redoc_url="/api/redoc", openapi_url="/api/openapi.json")

app.add_middleware(CORSMiddleware,
    allow_origins=[settings.frontend_url], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router)
app.include_router(user.router)
app.include_router(dashboard.router)
app.include_router(pendencias.router)
app.include_router(cx.router)

@app.get("/health", tags=["infra"])
async def health() -> dict:
    return {"status": "ok"}
