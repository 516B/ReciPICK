from fastapi import APIRouter
from pydantic import BaseModel
from openai import OpenAI
import os
from dotenv import load_dotenv
from app.services.client import client as ts_client
import json

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
router = APIRouter()

class CustomRecipe(BaseModel):
    id: str
    title: str
    ingredients: list[str]

class CustomRecommendRequest(BaseModel):
    recent_recipes: list[CustomRecipe] = []
    bookmarked_recipe_ids: list[str] = []

@router.post("/custom")
async def custom_recommend(req: CustomRecommendRequest):
    candidate_docs = []
    seen_ids = set()

    for rec in req.recent_recipes:
        for ing in rec.ingredients:
            res = ts_client.collections["recipes"].documents.search({
                "q": ing,
                "query_by": "ingredients",
                "per_page": 10
            })
            for hit in res["hits"]:
                doc = hit["document"]
                if doc["id"] not in seen_ids:
                    candidate_docs.append(doc)
                    seen_ids.add(doc["id"])

    exclude_set = set([r.id for r in req.recent_recipes] + req.bookmarked_recipe_ids)
    unique_candidates = {
        doc["id"]: doc for doc in candidate_docs if doc["id"] not in exclude_set
    }.values()
    candidates_list = list(unique_candidates)[:30]

    candidates_for_prompt = [
        f'{doc["id"]}. {doc["title"]} (재료: {", ".join([i.split(":")[0] for i in doc["ingredients"][:5]])})'
        for doc in candidates_list
    ]
    candidates_str = "\n".join(candidates_for_prompt)

    recent_summaries = [
        f'{r.id}. {r.title} (재료: {", ".join(r.ingredients)})'
        for r in req.recent_recipes
    ]

    prompt = (
        "최근 사용자가 본 레시피:\n"
        + "\n".join(recent_summaries)
        + "\n\n아래 후보 레시피 중에서 사용자에게 추천하고 싶은 6개를 골라줘.\n"
        "단, 비슷한 재료나 스타일의 요리가 반복되지 않도록 해줘.\n"
        "각 추천은 사용자의 입장에서 이야기하듯, 말끝에 '~요', '~예요', '~딱이에요!' 식으로 친근하고 캐주얼하게 한두 문장으로 써줘.\n"
        "형식: [{\"id\": id, \"title\": \"레시피명\", \"reason\": \"추천 이유\"}]\n\n"
        "후보 목록:\n" + candidates_str
    )

    messages = [
        {"role": "system", "content": "너는 한국 요리 추천 전문가야."},
        {"role": "user", "content": prompt}
    ]

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=messages,
        temperature=0.7,
        max_tokens=1000
    )
    content = response.choices[0].message.content.strip()

    json_start = content.find("[")
    json_end = content.rfind("]") + 1
    recipes_json = content[json_start:json_end]
    gpt_recs = json.loads(recipes_json)

    docs_map = {doc["id"]: doc for doc in candidates_list}
    recipes = []
    for rec in gpt_recs:
        doc = docs_map.get(str(rec["id"]))
        if doc:
            recipes.append({
                "id": doc["id"],
                "title": doc["title"],
                "image_url": doc.get("image_url", ""),
                "reason": rec.get("reason", "")
            })

    return {"recipes": recipes}
