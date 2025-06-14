from fastapi import APIRouter
from pydantic import BaseModel
from openai import OpenAI
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
        # GPT로부터 재료 추출
        extract_prompt = [
            {
                "role": "system",
                "content": (
                    "사용자의 입력 문장에서 요리에 사용할 식재료만 추출하세요. "
                    "여러 개일 경우 쉼표(,)로 구분하여 출력하세요. "
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

        print("최종 추출된 재료 리스트:", ingredients)

        if not ingredients:
            return {
                "recipes": [],
                "ingredients": [],
                "seen_recipe_ids": req.seen_recipe_ids,
            }

        # 재료별 검색 → 레시피 모으기
        all_docs = dict()

        for ing in ingredients:
            result = ts_client.collections["recipes"].documents.search({
                "q": ing,
                "query_by": "ingredients",
                "per_page": 100
            })
            for hit in result["hits"]:
                doc = hit["document"]
                all_docs[doc["id"]] = doc

        # 실제 재료 포함 여부 확인
        fully_matched = []
        partial_matched = []

        for doc in all_docs.values():
            real_ings = [ri.strip().split(":")[0] for ri in doc.get("ingredients", [])]
            matched = set()

            for ing in ingredients:
                if any(ing in real for real in real_ings):
                    matched.add(ing)

            if len(matched) == len(ingredients):
                fully_matched.append(doc)
            elif matched:
                partial_matched.append(doc)

        # 이전에 본 거 제거
        unseen_fully = [r for r in fully_matched if r["id"] not in req.seen_recipe_ids]
        top_recipes = unseen_fully[:3]
        updated_seen = req.seen_recipe_ids + [r["id"] for r in top_recipes]

        # fallback: 일부 재료 포함된 레시피
        if not top_recipes:
            unseen_partial = [r for r in partial_matched if r["id"] not in updated_seen]
            top_recipes = unseen_partial[:3]
            updated_seen += [r["id"] for r in top_recipes]

        return {
            "recipes": [{"id": r["id"], "title": r["title"]} for r in top_recipes],
            "ingredients": ingredients,
            "seen_recipe_ids": updated_seen,
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}
