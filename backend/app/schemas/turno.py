"""
Schemas Pydantic para Turno.
Separamos schema de creacion, actualizacion y respuesta para que la API
nunca exponga campos internos ni acepte campos que no debe.
"""
from datetime import datetime, timedelta
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, computed_field

from app.models.turno import EstadoTurno


# ---- Schemas anidados (BUG 2) ----
class ClienteBasico(BaseModel):
    """Representacion minima de cliente para incluir en TurnoOut."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str


class ProfesionalBasico(BaseModel):
    """Representacion minima de profesional para incluir en TurnoOut."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str


# ---- Base compartido ----
class TurnoBase(BaseModel):
    profesional_id: int = Field(..., gt=0)
    cliente_id: int = Field(..., gt=0)
    fecha_hora: datetime
    duracion_min: int = Field(default=30, ge=5, le=480)
    notas: Optional[str] = Field(default=None, max_length=500)


# ---- Crear ----
class TurnoCreate(TurnoBase):
    """Lo que el cliente envia en POST /turnos."""
    origen: str = Field(default="panel", pattern="^(panel|whatsapp)$")


# ---- Actualizar ----
class TurnoUpdate(BaseModel):
    """Todos los campos opcionales. El negocio actualiza solo lo necesario."""
    profesional_id: Optional[int] = Field(default=None, gt=0)
    cliente_id: Optional[int] = Field(default=None, gt=0)
    fe