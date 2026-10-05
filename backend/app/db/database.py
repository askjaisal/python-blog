from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.db.base import Base
from app.models import User

DATABASE_URL = URL.create(
    drivername="postgresql+psycopg",
    username=settings.database_user,
    password=settings.database_password,
    host=settings.database_host,
    port=settings.database_port,
    database=settings.database_name,
)

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)
Base.metadata.create_all(bind=engine)