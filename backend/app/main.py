from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import chat, category, recipe 

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(chat.router)
app.include_router(category.router)
app.include_router(recipe.router)
