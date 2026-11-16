from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import models  # noqa: F401  (registers the tables)
from app.config import get_settings
from app.db import Base, engine
from app.logic import DomainError
from app.migrate import drop_legacy_columns
from app.routers import auth, duels, groups, users


@asynccontextmanager
async def lifespan(_: FastAPI):
    # A demo: create the tables on startup instead of using migrations. No data is ever created here.
    drop_legacy_columns(engine)
    Base.metadata.create_all(engine)
    yield


app = FastAPI(title="Dual API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(DomainError)
async def domain_error_handler(_: Request, exc: DomainError) -> JSONResponse:
    """Friendly messages for the app: {"detail": "..."} with the right status code."""
    return JSONResponse(status_code=exc.status, content={"detail": exc.message})


@app.get("/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(duels.router)
app.include_router(groups.router)
app.include_router(users.router)
