from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 라우터들 import
from app.api import chat, category, recipe, gpt, title

app = FastAPI()

# CORS 설정 (프론트와 통신 가능하게)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록 (prefix 통일)
app.include_router(chat.router,     prefix="/chat")       # /chat?ingredient=...
app.include_router(category.router, prefix="/category")   # /category?name=...
app.include_router(recipe.router,   prefix="/recipe")     # /recipe/:id
app.include_router(gpt.router,      prefix="/gpt")        # /gpt/recommend
app.include_router(title.router,    prefix="/search")     # /search/title
