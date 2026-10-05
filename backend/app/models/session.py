from datetime import datetime

from sqlalchemy import DateTime,ForeignKey,String
from sqlalchemy.orm import Mapped,mapped_column

from app.db.base import Base



class Session(Base):
    __tablename__ = "session"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    session_token : Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False
    )

    expires_at: Mapped[datetime]=mapped_column(
        DateTime,
        nullable=False

    )