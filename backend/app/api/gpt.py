from fastapi import APIRouter
from pydantic import BaseModel
from openai import OpenAI  # ✅ 최신 버전 방식
import os
from dotenv import load_dotenv

load_dotenv()  # .env 파일 불러오기
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))  # ✅ 클라이언트 생성

router = APIRouter()

class PromptRequest(BaseModel):
    message: str

@router.post("/recommend")
async def recommend_recipe(req: PromptRequest):
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",  # 또는 gpt-4
            messages=[
                {"role": "system", "content": "당신은 요리 전문가입니다. 사용자의 재료로 레시피 3개를 추천해주세요."},
                {"role": "user", "content": req.message}
            ],
            temperature=0.7,
            max_tokens=500
        )
        reply = response.choices[0].message.content.strip()
        return {"result": reply}
    except Exception as e:
        return {"error": str(e)}
