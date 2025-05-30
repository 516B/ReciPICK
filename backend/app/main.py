from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# DB 초기화
from app.models import Base, User  
from app.database import engine

# 라우터 import
from app.api import auth, chat, category, recipe, title, filter
from app.api.gpt import recommend, servings, substitute

# FastAPI 앱 생성
app = FastAPI()

# DB 테이블 생성
Base.metadata.create_all(bind=engine)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth.router,       prefix="/auth")
app.include_router(chat.router,       prefix="/chat")
app.include_router(category.router,   prefix="/category")
app.include_router(recipe.router,     prefix="/recipe")
app.include_router(title.router,      prefix="/search")
app.include_router(filter.router,     prefix="/filter")

# GPT 기반 기능들
app.include_router(recommend.router,  prefix="/gpt")
app.include_router(servings.router,   prefix="/gpt")
app.include_router(substitute.router, prefix="/gpt")
