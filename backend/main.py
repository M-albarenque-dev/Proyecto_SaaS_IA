from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

app = FastAPI(
    title="TurnoIA API",
    description="API REST para el sistema de gestión de turnos con IA",
    version="0.1.0",
)

# Orígenes permitidos:
# - localhost para desarrollo local
# - dominio de producción en Vercel
# - todos los deploys de Preview de Vercel (rama develop, PRs, etc.)
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://proyecto-saa-s-ia.vercel.app",
    "https://proyecto-saa-s-ia-git-develop-malbarenquedevs-projects.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",  # cubre TODOS los previews de Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de routers
from app.routers import auth, turnos, profesionales, clientes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(turnos.router, prefix="/api/turnos", tags=["turnos"])
app.include_router(profesionales.router, prefix="/api/profesionales", tags=["profesionales"])
app.include_router(clientes.router, prefix="/api/clientes", tags=["clientes"])


@app.get("/", tags=["health"])
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}
