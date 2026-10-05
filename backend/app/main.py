from fastapi import FastAPI , Depends
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

from app.db.dependencis import get_db
app = FastAPI(title = "Blog API")

from app.api.users import router as users_router
from app.api.post import router as post_router
from app.api.uploads import router as upload_router

app.include_router(users_router)
app.include_router(post_router)
app.include_router(upload_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
) 

@app.get('/')
def root():
    return {"message":"Blog API IS RUNNING"}


@app.get("/db-test")
def db_test(db:Session = Depends(get_db)):
    return {"message":"Database session created succesfuly"}
