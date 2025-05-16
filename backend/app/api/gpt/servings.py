# app/api/gpt/servings.py

from fastapi import APIRouter
from pydantic import BaseModel
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
router = APIRouter()

class ServingsRequest(BaseModel):
    ingredients: list[str]
    steps: list[str]
    current_serving: str
    target_serving: str

@router.post("/servings")
async def convert_servings(req: ServingsRequest):
    try:
        prompt = (
            f"다음은 {req.current_serving} 기준 레시피입니다.\n"
            f"{req.target_serving} 기준으로 재료 양과 조리 단계를 모두 알맞게 조정해 주세요.\n\n"
            f"🧾 재료 목록:\n" + "\n".join(req.ingredients) +
            f"\n\n👨‍🍳 조리 순서:\n" + "\n".join(f"{i+1}. {s}" for i, s in enumerate(req.steps))
        )

        messages = [
            {"role": "system", "content": "당신은 요리 전문가입니다. 사용자의 레시피를 원하는 인분에 맞게 조정해 주세요."},
            {"role": "user", "content": prompt}
        ]

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.5,
            max_tokens=1000,
        )

        return {"result": response.choices[0].message.content.strip()}

    except Exception as e:
        return {"error": str(e)}
