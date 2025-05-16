from fastapi import APIRouter
from pydantic import BaseModel
from openai import OpenAI
import os
from dotenv import load_dotenv
import json

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
        ingredients_text = "\n".join(req.ingredients)
        steps_text = "\n".join(f"{i+1}. {s}" for i, s in enumerate(req.steps))

        prompt = (
            f"다음은 {req.current_serving} 기준의 요리 레시피입니다.\n"
            f"{req.target_serving} 기준으로 재료와 조리 순서를 조정해서 JSON 형식으로 출력해 주세요.\n"
            f"반드시 아래의 JSON 형식을 따르세요:\n\n"
            f"""{{
  "title": "레시피 제목",
  "serving": "{req.target_serving}",
  "ingredients": ["재료1", "재료2"],
  "steps": ["조리1", "조리2"]
}}\n\n"""
            f"🧾 재료:\n{ingredients_text}\n\n"
            f"👨‍🍳 조리 순서:\n{steps_text}"
        )

        messages = [
            {"role": "system", "content": "당신은 요리 전문가입니다. 사용자의 레시피를 원하는 인분에 맞게 조정하고 JSON으로 출력해 주세요."},
            {"role": "user", "content": prompt}
        ]

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.5,
            max_tokens=1000,
        )

        content = response.choices[0].message.content.strip()

        parsed = json.loads(content)

        return {
            "result": parsed
        }

    except Exception as e:
        return {"error": str(e)}
