from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select


from app.api.dependencies import get_current_user
from app.db.dependencis import get_db
from app.models import Post, User, Comment
from app.schemas.comment import CommentCreate

router = APIRouter(prefix="/posts", tags=["Comment"])


@router.get("/{post_id}/comments")
def get_comments(
    post_id: int,
    db: Session = Depends(get_db),
):
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    statement = (
        select(Comment, User.username)
        .join(User, User.id == Comment.user_id)
        .where(Comment.post_id == post_id)
        .order_by(Comment.create_at.asc(), Comment.id.asc())
    )
    rows = db.execute(statement).all()

    return {
        "comments": [
            {
                "id": comment.id,
                "content": comment.content,
                "user_id": comment.user_id,
                "post_id": comment.post_id,
                "username": username,
                "created_at": comment.create_at,
            }
            for comment, username in rows
        ]
    }


@router.post("/{post_id}/comments")
def create_comment(
    post_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = select(Post).where(Post.id == post_id)
    result = db.execute(statement)

    post = result.scalar_one_or_none()

    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    comment = Comment(
        content=comment_data.content, user_id=current_user.id, post_id=post_id
    )

    db.add(comment)
    db.commit()
    db.refresh(comment)

    return {
        "message": "Comment created successfully",
        "comment": {
            "id": comment.id,
            "content": comment.content,
            "user_id": comment.user_id,
            "post_id": comment.post_id,
            "username": current_user.username,
            "created_at": comment.create_at,
        },
    }
