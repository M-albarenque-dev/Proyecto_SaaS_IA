from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "TurnoIA"
    ENVIRONMENT: str = "development"

    # Base de datos
    DATABASE_URL: str

    # Twilio
    TWILIO_ACCOUNT_SID: str
    TWILIO_AUTH_TOKEN: str
    TWILIO_WHATSAPP_NUMBER: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()