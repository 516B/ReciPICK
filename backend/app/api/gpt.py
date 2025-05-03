from fastapi import APIRouter
from pydantic import BaseModel
from openai import OpenAI
import os
from dotenv import load_dotenv
from collections import defaultdict
from app.services.client import client as ts_client  # Typesense 클라이언트

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

router = APIRouter()

class PromptRequest(BaseModel):
    message: str

@router.post("/recommend")
async def recommend_recipe(req: PromptRequest):
    try:
        # ✅ 자연어 문장에서 재료만 추출 (강화된 프롬프트 사용)
        ingredient_extract_response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "사용자의 문장에서 요리에 사용할 식재료를 추출해주세요. "
                        "정확한 식재료 이름만 추출하며, 반드시 쉼표로 구분된 한 줄로 출력하세요. "
                        "예: 감자, 계란, 양파"
                    )
                },
                {
                    "role": "user",
                    "content": req.message
                }
            ],
            temperature=0,
            max_tokens=100
        )

        ingredient_line = ingredient_extract_response.choices[0].message.content.strip()
        ingredients = [i.strip() for i in ingredient_line.split(",") if i.strip()]

        if not ingredients:
            return {"recipes": [], "text": "입력된 문장에서 재료를 찾을 수 없어요."}

        # ✅ Typesense에서 검색 및 점수화
        recipe_score = defaultdict(lambda: {"count": 0, "data": None})

        for ing in ingredients:
            result = ts_client.collections["recipes"].documents.search({
                "q": ing,
                "query_by": "ingredients",
                "per_page": 50
            })
            for hit in result["hits"]:
                doc = hit["document"]
                recipe_score[doc["id"]]["count"] += 1
                recipe_score[doc["id"]]["data"] = doc

        sorted_recipes = sorted(recipe_score.values(), key=lambda x: -x["count"])
        top_recipes = [r["data"] for r in sorted_recipes[:3]]

        if not top_recipes:
            return {"recipes": [], "text": "해당 재료로 추천할 레시피가 없습니다."}

        return {
            "recipes": [{"id": r["id"], "title": r["title"]} for r in top_recipes]
        }

    except Exception as e:
        return {"error": str(e)}
