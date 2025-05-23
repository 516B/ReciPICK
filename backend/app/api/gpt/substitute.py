from fastapi import APIRouter
from pydantic import BaseModel
from openai import OpenAI
import os
from dotenv import load_dotenv
import json

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
router = APIRouter()

class SubstituteRequest(BaseModel):
    ingredients: list[str]
    steps: list[str]
    substitutes: list[str]
    serving: str = ""

@router.post("/substitute")
async def recommend_substitute(req: SubstituteRequest):
    try:
        ingredients_str = "\n".join(req.ingredients)
        steps_str = "\n".join(f"{i+1}. {s}" for i, s in enumerate(req.steps))
        substitutes_str = ", ".join(req.substitutes)
        serving_str = f" (인분: {req.serving})" if req.serving else ""

        # 프롬프트 구성
        prompt = (
            f"당신은 요리 전문가이자 레시피 분석 AI입니다.\n"
            f"사용자가 다음 재료를 사용할 수 없습니다: {substitutes_str}.\n\n"
            f"전체 재료 목록을 유지하되, 해당 항목만 대체하고\n"
            "대체된 재료는 재료명 하나당 최대 3가지 대체안(정량 포함)을 제안해주세요.\n"
            "형식: '재료명: 대체안1 (정량1) / 대체안2 (정량2) / 대체안3 (정량3)'\n"
            "예: 맛술: 사과주스 1큰술 / 설탕물 1큰술 / 미림 1큰술\n"
            f"대체 비율, 양이 반드시 있어야 하며, 나머지 재료는 원래 양을 유지합니다.\n\n"
            f"조리 순서는 반드시 기존 단계 수({len(req.steps)}개)를 유지하고,\n"
            "각 단계의 전체 문장을 그대로 유지하되 해당 재료명만 바꾸세요.\n"
            "즉, 단계 구조는 보존하고 어색하지 않도록 바꾸세요.\n\n"
            f"출력 형식은 아래와 같아야 합니다:\n"
            f"{{\n"
            f"  \"ingredients\": [\"재료명: 대체안\"],\n"
            f"  \"steps\": [\"조리1\", \"조리2\", ...]\n"
            f"}}\n\n"
            f"---\n"
            f"레시피 제목: {req.substitutes[0]} 없는 {req.serving} 기준 레시피\n"
            f"재료:\n{ingredients_str}\n\n"
            f"조리 순서:\n{steps_str}"
        )

        messages = [
            {
                "role": "system",
                "content": (
                    "당신은 요리 전문가입니다. 사용자가 특정 재료를 사용할 수 없는 상황에서, \n"
                    "그 재료의 역할(예: 풍미, 점도, 비린내 제거 등)을 분석하고, \n"
                    "대체 가능한 재료와 정확한 양을 추천해 주세요. JSON 형식으로만 출력하세요."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ]

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.5,
            max_tokens=2000,  
        )
        content = response.choices[0].message.content.strip()

        if "{" in content:
            content = content[content.find("{"):]
        parsed = json.loads(content)

        # 원래 재료 딕셔너리로 만들기
        original_dict = {}
        for item in req.ingredients:
            if ":" in item:
                k, v = item.split(":", 1)
                original_dict[k.strip()] = v.strip()

        # 대체된 재료 덮어쓰기
        for item in parsed.get("ingredients", []):
            if ":" in item:
                k, v = item.split(":", 1)
                original_dict[k.strip()] = v.strip()

        # 최종 병합된 재료 리스트로 교체
        parsed["ingredients"] = [f"{k}: {v}" for k, v in original_dict.items()]

        # 불가능 판별 로직
        impossible_targets = []
        for sub in req.substitutes:
            for ing in parsed.get("ingredients", []):
                if sub in ing and ("대체가 불가능" in ing or "불가" in ing):
                    impossible_targets.append(sub)
        if impossible_targets:
            return {"impossible": impossible_targets}

        return {"result": parsed}

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}