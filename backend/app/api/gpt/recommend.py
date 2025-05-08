from fastapi import APIRouter
from pydantic import BaseModel
from openai import OpenAI
from collections import defaultdict
import os
from dotenv import load_dotenv
from app.services.client import client as ts_client

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
router = APIRouter()

class PromptRequest(BaseModel):
    message: str
    previous_ingredients: list[str] = []
    seen_recipe_ids: list[str] = []

@router.post("/recommend")
async def recommend_recipe(req: PromptRequest):
    try:
        # GPT에게 재료 추출 또는 '이전 재료 사용' 판단 요청
        extract_prompt = [
            {
                "role": "system",
                "content": (
                    "사용자의 입력 문장에서 요리에 사용할 식재료만 추출하세요. "
                    "만약 사용자가 재료를 명시하지 않고 이전 재료로 다시 추천을 요청한 경우에는 "
                    "정확하게 '이전 재료 사용'이라고만 출력하세요.\n\n"
                    "예시:\n"
                    "- 입력: '두부 김치 요리 알려줘' → 출력: 두부, 김치\n"
                    "- 입력: '다른 요리 추천해줘' → 출력: 이전 재료 사용"
                )
            },
            {"role": "user", "content": req.message}
        ]

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=extract_prompt,
            temperature=0,
            max_tokens=100,
        )

        result_line = response.choices[0].message.content.strip()
        print("GPT 응답 결과:", result_line)

        if result_line == "이전 재료 사용":
            ingredients = req.previous_ingredients
        else:
            ingredients = [i.strip() for i in result_line.split(",") if i.strip()]

        if not ingredients:
            return {
                "recipes": [],
                "ingredients": [],
                "seen_recipe_ids": req.seen_recipe_ids,
            }

        # Typesense 검색 및 정확한 재료 포함 여부 필터링
        recipe_score = defaultdict(lambda: {"count": 0, "data": None})

        for ing in ingredients:
            result = ts_client.collections["recipes"].documents.search({
                "q": ing,
                "query_by": "ingredients",
                "per_page": 50
            })
            for hit in result["hits"]:
                doc = hit["document"]
                real_ings = doc.get("ingredients", [])

                # 정확한 재료 포함 여부 검사
                if any(
                    ing == real_ing.strip().split(":")[0]
                    for real_ing in real_ings
                ):
                    recipe_score[doc["id"]]["count"] += 1
                    recipe_score[doc["id"]]["data"] = doc

        # 재료 일치 수 기준 정렬
        sorted_recipes = sorted(
            recipe_score.values(),
            key=lambda x: (-x["count"], x["data"]["title"])
        )

        # 이전에 본 레시피 제외
        unseen_recipes = [
            r["data"] for r in sorted_recipes
            if r["data"]["id"] not in req.seen_recipe_ids
        ]

        top_recipes = unseen_recipes[:3]
        updated_seen = req.seen_recipe_ids + [r["id"] for r in top_recipes]

        return {
            "recipes": [{"id": r["id"], "title": r["title"]} for r in top_recipes],
            "ingredients": ingredients,
            "seen_recipe_ids": updated_seen,
        }

        

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}
