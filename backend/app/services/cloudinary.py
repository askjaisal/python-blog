import cloudinary.uploader

from fastapi import UploadFile

from app.core.cloudinary import cloudinary


async def upload_image(file: UploadFile) -> str:
    contents = await file.read()

    result = cloudinary.uploader.upload(
        contents,
        folder="python-blog/posts",
    )

    return result["secure_url"]