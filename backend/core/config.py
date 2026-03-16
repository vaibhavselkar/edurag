from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    groq_api_key: str
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db: str = "edurag"
    chroma_persist_dir: str = "../vector_store"
    upload_dir: str = "../uploads"
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    groq_model: str = "llama-3.3-70b-versatile"

    class Config:
        env_file = ".env"


settings = Settings()

# Available Groq models for question generation
AVAILABLE_MODELS = [
    {"id": "llama-3.3-70b-versatile",  "label": "Llama 3.3 70B — Best Quality (default)"},
    {"id": "llama-3.1-8b-instant",     "label": "Llama 3.1 8B — Fastest"},
    {"id": "mixtral-8x7b-32768",       "label": "Mixtral 8x7B — Balanced"},
    {"id": "gemma2-9b-it",             "label": "Gemma 2 9B — Compact"},
]