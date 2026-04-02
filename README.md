# TurnoIA — Grupo 2

Asistente de turnos con IA. Plataforma SaaS · WhatsApp Chatbot · Panel Web.

**Materia:** Desarrollo de Software | **Entrega:** 17 de junio de 2026
**Stack:** Python + FastAPI | PostgreSQL | React + Vite
**Metodología:** Scrum — Sprints quincenales

## Equipo

| Integrante | DNI |
|---|---|
| Eric Cuellar | 45.985.676 |
| Marcelo Albarenque | 38.406.528 |
| Adrian Her Molins | 32.161.709 |
| Luciano Gabriel Zenobio | 44.598.717 |
| Melany Lujan Sosa | 45.192.698 |

## Estructura del proyecto

```
Turno_IA/
├── docs/               # Documentación funcional
├── backend/            # API REST — Python + FastAPI
│   ├── app/
│   │   ├── models/     # Modelos SQLAlchemy (S1)
│   │   ├── schemas/    # Schemas Pydantic (S1)
│   │   ├── routers/    # Endpoints REST (S1)
│   │   └── services/   # Lógica de negocio (S1+)
│   └── alembic/        # Migraciones de BD
└── frontend/           # SPA — React + Vite
    └── src/
        ├── pages/      # Pantallas (S3)
        ├── components/ # Componentes reutilizables (S3)
        ├── services/   # Llamadas HTTP (S2+)
        └── hooks/      # Custom hooks (S3+)
```

## Setup (Sprint 0)

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # Completar DATABASE_URL con tu BD local
uvicorn main:app --reload
```

Verificar: `http://localhost:8000` debe responder `{"status": "ok"}`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Verificar: `http://localhost:5173` debe mostrar "TurnoIA — En construcción".
