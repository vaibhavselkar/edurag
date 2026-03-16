from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import traceback
from core.database import connect_db, close_db, get_db
from core.config import settings
from core.responses import SafeJSONResponse
from core.security import require_admin
from core.config import AVAILABLE_MODELS
from routes import auth, documents, papers


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="EduRAG API",
    description="AI-powered exam paper generator for CBSE, ICSE, and Maharashtra Board",
    version="1.0.0",
    lifespan=lifespan,
    default_response_class=SafeJSONResponse,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.allowed_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    trace = traceback.format_exc()
    print(f"[GLOBAL ERROR] {request.method} {request.url.path} → {type(exc).__name__}: {exc}\n{trace}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"{type(exc).__name__}: {str(exc)}", "trace": trace},
    )

app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(papers.router)

print("=== EduRAG v2 loaded — SafeJSONResponse active ===", flush=True)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


@app.get("/")
async def root():
    return {"message": "EduRAG API is running", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/models")
async def list_models():
    return {"models": AVAILABLE_MODELS}


@app.get("/ping-db")
async def ping_db(_: dict = Depends(require_admin)):
    """Admin only — tests MongoDB connection and returns all papers."""
    db = get_db()
    if db is None:
        return {"status": "error", "detail": "DB not connected"}
    count = await db.papers.count_documents({})
    papers = []
    async for p in db.papers.find({}, {"questions": 0, "sections": 0}):
        p["id"] = str(p.pop("_id"))
        papers.append(p)
    return {"status": "ok", "papers_in_db": count, "papers": papers}
