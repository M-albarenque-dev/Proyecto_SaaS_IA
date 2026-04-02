from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "TurnoIA"
    ENVIRONMENT: str = "development"

    # Base de datos (leer del archivo .env)
    DATABASE_URL: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Instancia singleton — importar con: from app.config import settings
settings = Settings()
