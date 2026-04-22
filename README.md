# TurnoIA — Grupo 2

=================================================================================================================

# Este README te explica cómo preparar tu computadora para poder correr el proyecto. Seguí los pasos en orden.

=================================================================================================================

Asistente de turnos con IA. Plataforma SaaS · WhatsApp Chatbot · Panel Web.

**Materia:** Desarrollo de Software | **Entrega:** 17 de junio de 2026
**Stack:** Python + FastAPI | PostgreSQL | React + Vite
**Metodología:** Scrum — Sprints quincenales

## Equipo

| Integrante              | DNI        |
| ----------------------- | ---------- |
| Eric Cuellar            | 45.985.676 |
| Marcelo Albarenque      | 38.406.528 |
| Adrian Her Molins       | 32.161.709 |
| Luciano Gabriel Zenobio | 44.598.717 |
| Melany Lujan Sosa       | 45.192.698 |

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

## Requisitos previos

```
Necesitás tener instalado:
    Python 3.11+
    PostgreSQL
    Node.js 18+
    Git
```

## Setup - Levantar el proyecto en tu máquina (Sprint 0)

### Backend

```bash
# 1. Entrar a la carpeta del servidor
cd backend

# 2. Crear el entorno virtual (aislamiento de Python)
python -m venv venv

# 3. Activar el entorno virtual
# Si usas Windows (Git Bash):
source venv/Scripts/activate

# Si usas Linux o Mac:
source venv/bin/activate

# --- LÍNEA DE CONFIRMACIÓN ---
# Sabrás que se activó correctamente si ves el prefijo "(venv)" al inicio de tu terminal.

# 4. Instalar las librerías necesarias
pip install -r requirements.txt

# 5. Configurar variables de entorno
cp .env.example .env

# Nota: Editá el archivo .env y completá DATABASE_URL con tus datos de PostgreSQL local.
# Ejemplo: DATABASE_URL=postgresql://postgres:tu_clave@localhost:5432/nombre_db

# 6. Iniciar el servidor de desarrollo
uvicorn main:app --reload
```

Verificar: `http://localhost:8000` debe responder `{"status": "ok"}`.

### Frontend

```bash
# 1. Entrar a la carpeta de la interfaz
cd frontend

# 2. Instalar las librerías de React y dependencias
# (Nota: Puede mostrar advertencias de paquetes antiguos, ignorarlas si termina con éxito)
npm install

# --- LÍNEA DE CONFIRMACIÓN ---
# Verás una carpeta llamada 'node_modules' y un mensaje: "added XXX packages".

# 3. Iniciar el servidor de desarrollo
npm run dev
```

Verificar: `http://localhost:5173` debe mostrar "TurnoIA — En construcción".

## Workflow Diario: Cómo retomar el trabajo

```bash
Nota para el equipo: Una vez realizado el Setup inicial (Sprint 0), este es el flujo de trabajo diario. No es necesario volver a crear el entorno virtual ni reinstalar dependencias.

# 1. Levantar el Backend (Servidor)
# Abrir una terminal en la raíz del proyecto y ejecutar:

cd backend
source venv/Scripts/activate        # Activar entorno (verificar el prefijo (venv))
python -m uvicorn main:app --reload # Inicia el motor de la API
Verificación: http://localhost:8000 debe responder {"status": "ok"}.

# 2. Levantar el Frontend (Interfaz)
# Abrir una segunda terminal y ejecutar:

cd frontend
npm run dev

Verificación: http://localhost:5173 debe mostrar "TurnoIA — En construcción".                 # Inicia la interfaz de usuario

# 3. Cómo cerrar el proyecto (Limpieza)

## Para evitar que los procesos queden consumiendo memoria en segundo plano:
## En ambas terminales, presionar Ctrl + C para apagar los servidores.
## En la terminal del Backend, escribir deactivate para cerrar el entorno virtual de Python.

```
