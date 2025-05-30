from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# DB 초기화
from app.models import Base
from app.models import User 
from app.database import engine

# 라우터 import
from app.api import auth, chat, category, recipe, title, filter
from app.api.gpt import recommend, servings, substitute

# FastAPI 앱 생성
app = FastAPI()
Base.metadata.create_all(bind=engine)
print("✅ DB 테이블 생성 실행됨")
print("📁 users.db 절대경로:", os.path.abspath("users.db"))

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 배포 시 특정 도메인으로 제한 가능
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth.router,       prefix="/auth")       # 회원가입/로그인
app.include_router(chat.router,       prefix="/chat")       # /chat?ingredient=...
app.include_router(category.router,   prefix="/category")   # /category?name=...
app.include_router(recipe.router,     prefix="/recipe")     # /recipe/:id
app.include_router(title.router,      prefix="/search")     # /search/title
app.include_router(filter.router,     prefix="/filter")     # /filter/difficulty-time

# GPT 기반 기능들
app.include_router(recommend.router,  prefix="/gpt")        # /gpt/recommend
app.include_router(servings.router,   prefix="/gpt")        # /gpt/servings
app.include_router(substitute.router, prefix="/gpt")        # /gpt/substitute


