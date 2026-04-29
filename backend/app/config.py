from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "TurnoIA"
    ENVIRONMENT: str = "development"

    # Base de datos
    DATABASE_URL: str

    # Twilio (se usa en S2)
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_WHATSAPP_NUMBER: str = ""

    # JWT (S1)
    JWT_SECRET_KEY: str = "dev_secret_change_me"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
