from fastapi import APIRouter,File,UploadFile

from app.services.cloudinary import upload_image

router = APIRouter(prefix='/uploads',tags=["Uploads"])


@router.post('/image')
async def upload_image_endpoint(
    file: UploadFile = File(...),
):
    image_url = await upload_image(file)

    return{
        "message":"Image uploaded succesfully",
        "image_url":image_url
    }