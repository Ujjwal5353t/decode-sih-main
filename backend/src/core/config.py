from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database
    DATABASE_URL: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_DAYS: int = 7

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str

    # Admin seed
    ADMIN_EMAIL: str = "admin003@gmail.com"
    ADMIN_PASSWORD: str = "123456789"

    # App
    APP_NAME: str = "Decode-SIH API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False


settings = Settings()  # type: ignore[call-arg]
