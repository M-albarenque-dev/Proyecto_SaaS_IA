from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

app = FastAPI(
    title="TurnoIA API",
    description="API REST para el sistema de gestión de turnos con IA",
    version="0.1.0",
)

# Configuración CORS para que el frontend React pueda consumir la API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",                   # Vite local
        "https://proyecto-saa-s-ia.vercel.app",    # Producción Vercel
    ],
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
