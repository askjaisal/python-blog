from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response
from datetime import datetime, timezone, timedelta
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.security import (
    create_session_token,
    hash_password,
    verify_password,
)
from app.db.dependencis import get_db
from app.models import Session as UserSession, User
from app.schemas.user import UserCreate, UserLogin
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/")
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
):
    password_hash = hash_password(user_data.password)

    user = User(
        username=user_data.username, email=user_data.email, password_hash=password_hash
    )

    db.add(user)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="A user with that username or email already exists",
        ) from exc

    db.refresh(user)

    return {
        "message": "User created Succesfully",
        "user": {"id": user.id, "username": user.username, "email": user.email},
    }


@router.post("/login")
def login_user(
    request: Request,
    user_data: UserLogin,
    response: Response,
    db: Session = Depends(get_db),
):
    statement = select(User).where(User.email == user_data.email)

    result = db.execute(statement)
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    password_valid = verify_password(user_data.password, user.password_hash)

    if not password_valid:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    session_token = create_session_token()

    user_session = UserSession(
        user_id=user.id,
        session_token=session_token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )

    db.add(user_session)

    db.commit()

    origin = request.headers.get("origin")
    is_cross_site = bool(origin) and not origin.startswith(("http://localhost", "http://127.0.0.1"))

    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True if is_cross_site else False,
        samesite="none" if is_cross_site else "lax",
        max_age=7 * 24 * 60 * 60,
        path="/",
    )

    return {
        "message": "Login Successful",
        "user": {"id": user.id, "username": user.username, "email": user.email},
    }


@router.get("/me")
def get_me(
    current_user: User = Depends(get_current_user),
):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
    }


@router.post("/logout")
def logout_user(
    response: Response,
    session_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
):
    if session_token is not None:
        statement = select(UserSession).where(
            UserSession.session_token == session_token
        )

        result = db.execute(statement)
        user_session = result.scalar_one_or_none()

        if user_session is not None:
            db.delete(user_session)
            db.commit()

    response.delete_cookie(key="session_token", path="/")

    return {"message": "Logout successful"}
