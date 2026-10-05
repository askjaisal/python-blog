from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.db.base import Base
from app.models import User


def build_database_url() -> str:
    if settings.app_env == "production" and settings.database_url:
        return settings.database_url

    return str(
        URL.create(
            drivername="postgresql+psycopg",
            username=settings.database_user,
            password=settings.database_password,
            host=settings.database_host,
            port=settings.database_port,
            database=settings.database_name,
        )
    )


DATABASE_URL = build_database_url()

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)
Base.metadata.create_all(bind=engine)