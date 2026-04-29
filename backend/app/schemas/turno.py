"""
Schemas Pydantic para Turno.
Separamos schema de creación, actualización y respuesta para que la API
nunca exponga campos internos ni acepte campos que no debe.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.turno import EstadoTurno


# ---- Base compartido ----
class TurnoBase(BaseModel):
    profesional_id: int = Field(..., gt=0)
    cliente_id: int = Field(..., gt=0)
    fecha_hora: datetime
    duracion_min: int = Field(default=30, ge=5, le=480)
    notas: Optional[str] = Field(default=None, max_length=500)


# ---- Crear ----
class TurnoCreate(TurnoBase):
    """Lo que el cliente envía en POST /turnos."""
    origen: str = Field(default="panel", pattern="^(panel|whatsapp)$")


# ---- Actualizar ----
class TurnoUpdate(BaseModel):
    """Todos los campos opcionales — el negocio actualiza solo lo necesario."""
    profesional_id: Optional[int] = Field(default=None, gt=0)
    cliente_id: Optional[int] = Field(default=None, gt=0)
    fecha_hora: Optional[datetime] = None
    duracion_min: Optional[int] = Field(default=None, ge=5, le=480)
    estado: Optional[EstadoTurno] = None
    notas: Optional[str] = Field(default=None, max_length=500)


# ---- Respuesta ----
class TurnoOut(TurnoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    negocio_id: int
    estado: EstadoTurno
    origen: str
    created_at: datetime
    updated_at: datetime
