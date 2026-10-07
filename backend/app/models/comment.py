from datetime import datetime
from sqlalchemy import DateTime,ForeignKey,String,Text
from sqlalchemy.orm import Mapped,mapped_column


from app.db.base import Base


class Comment(Base):
    __tablename__ = "comment"

    id: Mapped[int] = mapped_column(primary_key=True)

    content: Mapped[str] = mapped_column(Text,nullable=False)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"),nullable=False)

    post_id: Mapped[int]= mapped_column(ForeignKey("posts.id"),nullable=False)

    create_at: Mapped[datetime] = mapped_column(
        DateTime,default=datetime.utcnow,nullable=False
    )