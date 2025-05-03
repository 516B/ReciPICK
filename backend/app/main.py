from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


# 라우터들 import
from app.api import chat, category, recipe, gpt  


app = FastAPI()


# CORS 설정 (프론트와 통신 가능하게)
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
app.include_router(gpt.router)  # GPT 라우터 등록


