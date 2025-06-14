from fastapi import APIRouter
from pydantic import BaseModel
from openai import OpenAI
import os
from dotenv import load_dotenv
import json
import re

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
router = APIRouter()

class SubstituteRequest(BaseModel):
    ingredients: list[str]
    steps: list[str]
    substitutes: list[str]
    serving: str = ""

def build_prompt(req: SubstituteRequest, strict=False):
    ingredients_str = "\n".join(req.ingredients)
    steps_str = "\n".join(f"{i+1}. {s}" for i, s in enumerate(req.steps))
    substitutes_str = ", ".join(req.substitutes)

    base_prompt = (
        f"당신은 요리 전문가이자 레시피 분석 AI입니다.\n"
        f"사용자가 다음 재료를 사용할 수 없습니다: {substitutes_str}.\n\n"
        "지켜야 할 조건:\n"
        "- substitutes 목록에 포함된 재료만 반드시 대체하세요. 다른 재료는 그대로 두세요.\n"
        "- substitutes에 포함된 재료는 출력 JSON의 ingredients 배열에 반드시 포함되어야 합니다.\n"
        "- substitutes에 없는 재료는 출력하지 마세요. 포함되면 잘못된 출력입니다.\n"
        "- 예시: 사용자가 '생크림'만 요청한 경우, 출력은 생크림에 대한 대체안만 포함되어야 합니다.\n\n"
        "출력 형식:\n"
        "{\n"
        "  \"ingredients\": [\"재료명: 대체안\"],\n"
        "  \"steps\": [\"조리1\", \"조리2\", ...]\n"
        "}\n\n"
        "재료 출력 규칙:\n"
        "1) 대체 가능:\n"
        "- 형식: '재료명: 대체안1 (양) | 대체안2 (양)'\n"
        "2) 생략 가능:\n"
        "- 형식: '재료명: 기존 양(생략 가능)'\n"
        "3) 대체 불가:\n"
        "- 형식: '재료명: 기존 양(대체 불가)'\n\n"
        f"조리 순서는 원래 단계 수({len(req.steps)})를 유지해야 하며, 대체된 재료만 조리 단계에 반영하세요.\n\n"
        f"레시피 제목: {req.substitutes[0]} 없는 {req.serving} 기준 레시피\n"
        f"재료:\n{ingredients_str}\n\n조리 순서:\n{steps_str}"
    )

    if strict:
        base_prompt += f"\n\n주의: '{substitutes_str}' 재료 중 일부가 누락되었습니다. 반드시 포함해서 다시 출력하세요.\n"

    return base_prompt

def is_placeholder(value: str) -> bool:
    if not value:
        return True
    pattern = re.compile(r"(대체안\d*|정량|양|대체재|없음|생략 가능)")
    return bool(pattern.search(value))

def normalize_parentheses(val: str) -> str:
    val = re.sub(r'\(*\s*(대체 불가|생략 가능)\s*\)*', r'(\1)', val)
    val = re.sub(r'\)\)+', ')', val)
    return val

def get_substitute_response(req: SubstituteRequest, strict=False):
    print("\n[GPT 요청] 대체안 생성 요청 중...\n")
    prompt = build_prompt(req, strict)
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "당신은 요리 전문가입니다."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.65,
        max_tokens=2000,
    )
    content = response.choices[0].message.content.strip()
    if "{" in content:
        content = content[content.find("{"):]
    parsed = json.loads(content)
    print("[GPT 응답 결과 ingredients]:")
    for i in parsed.get("ingredients", []):
        print("-", i)
    return {"parsed": parsed}

def request_final_judgment(ingredient: str, amount: str, steps: list[str]) -> str:
    if any(kw in amount for kw in ["비정량", "약간", "적당량", "소량"]):
        print(f"[최종 판단 건너뜀] {ingredient}: '{amount}' → 생략 가능\n")
        return "생략 가능"

    steps_str = "\n".join(f"{i+1}. {s}" for i, s in enumerate(steps))
    prompt = (
        f"다음 재료가 레시피에서 누락되었거나 대체안이 불확실합니다.\n"
        f"- 재료명: {ingredient}\n"
        f"- 원래 양: {amount}\n\n"
        f"이 재료는 생략 가능한지, 아니면 반드시 필요한데 대체 불가능한지를 판단해 주세요.\n"
        f"출력은 반드시 아래 중 하나만 포함해야 합니다:\n"
        f"- 생략 가능\n"
        f"- 대체 불가\n\n"
        f"레시피 조리 순서:\n{steps_str}"
    )

    print(f"[GPT 요청] 최종 판단 요청: {ingredient} → GPT에게 생략 가능/대체 불가 판단 요청 중...")
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "당신은 요리 전문가입니다."},
            {"role": "user", "content": prompt},
        ],
        temperature=0,
        max_tokens=100,
    )
    result = response.choices[0].message.content.strip()
    print(f"[GPT 응답 결과] {ingredient} → {result}\n")
    return result

@router.post("/substitute")
async def recommend_substitute(req: SubstituteRequest):
    try:
        MAX_RETRY = 5
        retry_count = 0
        result = get_substitute_response(req)
        parsed = result["parsed"]

        def to_dict(ingredients_list):
            return {
                i.split(":")[0].strip(): i.split(":", 1)[1].strip()
                for i in ingredients_list if ":" in i
            }

        parsed_dict = to_dict(parsed.get("ingredients", []))

        def find_retry_targets(parsed_dict):
            retry = []
            for sub in req.substitutes:
                val = parsed_dict.get(sub)
                if val is None or is_placeholder(val) or ("대체 불가" in val and retry_count < MAX_RETRY):
                    retry.append(sub)
            return retry

        retry_targets = find_retry_targets(parsed_dict)

        while retry_targets and retry_count < MAX_RETRY:
            retry_count += 1
            print(f"\n[재시도 {retry_count}] → 대상: {retry_targets}\n")
            retry_req = SubstituteRequest(
                ingredients=req.ingredients,
                steps=req.steps,
                substitutes=retry_targets,
                serving=req.serving,
            )
            retry_result = get_substitute_response(retry_req, strict=True)
            retry_parsed = retry_result["parsed"]
            retry_dict = to_dict(retry_parsed.get("ingredients", []))

            still_missing = []
            for k in retry_targets:
                v = retry_dict.get(k)
                original_amount = next((i.split(":", 1)[1].strip() for i in req.ingredients if i.startswith(k + ":")), "")
                if v:
                    if is_placeholder(v):
                        still_missing.append(k)
                    elif "대체 불가" in v and retry_count < MAX_RETRY:
                        still_missing.append(k)
                    else:
                        parsed_dict[k] = v
                else:
                    still_missing.append(k)
            retry_targets = still_missing

        for sub in req.substitutes:
            val = parsed_dict.get(sub)
            if val is None or is_placeholder(val):
                original_amount = next((i.split(":", 1)[1].strip() for i in req.ingredients if i.startswith(sub + ":")), "")
                judgment = request_final_judgment(sub, original_amount, req.steps)
                if judgment == "생략 가능":
                    parsed_dict[sub] = f"{original_amount} (생략 가능)"
                else:
                    parsed_dict[sub] = f"{original_amount} (대체 불가)"

        merged_ingredients = []
        for item in req.ingredients:
            if ":" in item:
                k, v = item.split(":", 1)
                key = k.strip()
                original_val = v.strip()
                val = parsed_dict.get(key, original_val)
                val = normalize_parentheses(val)
                merged_ingredients.append(f"{key}: {val}")

        parsed["ingredients"] = merged_ingredients
        print("\n[최종 결과 ingredients]:")
        for i in merged_ingredients:
            print("-", i)

        return {"result": parsed}

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}