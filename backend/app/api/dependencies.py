from fastapi import Cookie, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.dependencis import get_db
from app.models import Session as UserSession, User


def get_current_user(
        session_token: str | None = Cookie(default=None),
        db: Session = Depends(get_db),
):
    if session_token is None:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )
    statement = select(UserSession).where(
        UserSession.session_token == session_token
    )

    result = db.execute(statement)
    user_session=result.scalar_one_or_none()

    if user_session is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid Session"
        )
    
    statement = select(User).where(
        User.id == user_session.user_id
    )

    result = db.execute(statement)
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )
    return user