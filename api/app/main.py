from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import models  # noqa: F401  (registers the tables)
from app.config import get_settings
from app.db import Base, SessionLocal, engine
from app.logic import DomainError, seed_bot_users
from app.routers import auth, demo, duels


@asynccontextmanager
async def lifespan(_: FastAPI):
    # A demo: create the tables on startup instead of using migrations.
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed_bot_users(db)
        db.commit()
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
app.include_router(demo.router)
