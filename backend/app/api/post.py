from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, select


from app.api.dependencies import get_current_user
from app.db.dependencis import get_db
from app.models import Post, User
from app.schemas.post import PostCreate, PostUpdate

router = APIRouter(prefix="/post", tags=["Posts"])


@router.get("/")
def get_posts(
    db: Session = Depends(get_db),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
):
    total = db.scalar(select(func.count()).select_from(Post)) or 0
    statement = (
        select(Post)
        .order_by(Post.create_at.desc(), Post.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    result = db.execute(statement)
    posts = result.scalars().all()

    return {
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": (total + page_size - 1) // page_size,
        "posts": [
            {
                "id": post.id,
                "title": post.title,
                "content": post.content,
                "banner_image_url": post.banner_image_url,
                "user_id": post.user_id,
            }
            for post in posts
        ]
    }

@router.get("/{post_id}")
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
):
    post = db.get(Post, post_id)

    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    return {
        "id": post.id,
        "title": post.title,
        "content": post.content,
        "banner_image_url": post.banner_image_url,
        "user_id": post.user_id,
    }

@router.post("/")
def create_post(
    post_data: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = Post(
        title=post_data.title,
        content=post_data.content,
        banner_image_url=post_data.banner_image_url,
        user_id=current_user.id,
    )
    db.add(post)

    db.commit()

    db.refresh(post)

    return {
        "message": "Post created succesfully",
        "post": {
            "id": post.id,
            "title": post.title,
            "content": post.content,
            "banner_image_url": post.banner_image_url,
            "user_id": post.user_id,
        },
    }


@router.put("/{post_id}")
def update_post(
    post_id: int,
    post_data: PostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = select(Post).where(
        Post.id == post_id,
        Post.user_id == current_user.id,
    )

    result = db.execute(statement)
    post = result.scalar_one_or_none()

    if post is None:
        return {"message": "Post not found"}

    post.title = post_data.title
    post.content = post_data.content
    if post_data.banner_image_url is not None:
        post.banner_image_url = post_data.banner_image_url

    db.commit()
    db.refresh(post)

    return {
        "message": "Post updated successfully",
        "post": {
            "id": post.id,
            "title": post.title,
            "content": post.content,
            "banner_image_url": post.banner_image_url,
            "user_id": post.user_id,
        },
    }

@router.delete("/{post_id}")
def delete_post(
    post_id:int,
    db:Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    statement = select(Post).where(
        Post.id == post_id,
        Post.user_id == current_user.id
    )

    result = db.execute(statement)

    post = result.scalar_one_or_none()

    if post is None:
        return {"message":"Post not found"}

    db.delete(post)
    db.commit()

    return{
        "message": "Post deleted successfully"
    }