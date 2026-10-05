from pydantic import BaseModel

class PostCreate(BaseModel):
    title:str
    content:str
    banner_image_url: str

class PostUpdate(BaseModel):
    title: str
    content: str
    banner_image_url: str | None = None