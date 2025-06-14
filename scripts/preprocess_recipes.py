import json
import os
import re

def preprocess_recipe(recipe):
    def clean_text(text):
        return text.strip().replace('\n', ' ').replace('\r', ' ')

    def remove_emojis(text):
        emoji_ranges = (
            u"\U0001F600-\U0001F64F"  # emoticons
            u"\U0001F300-\U0001F5FF"  # symbols & pictographs
            u"\U0001F680-\U0001F6FF"  # transport & map
            u"\U0001F1E0-\U0001F1FF"  # flags (iOS)
            u"\U00002700-\U000027BF"  # dingbats
            u"\U0001F900-\U0001F9FF"  # supplemental symbols and pictographs
            u"\U00002600-\U000026FF"  # misc symbols
            u"\U00002300-\U000023FF"  # misc technical
            u"\U00002000-\U0000209F"  # general punctuation
            u"\U0001FA70-\U0001FAFF"  # symbols and pictographs extended-A
            u"\u200d"                 # zero-width joiner
            u"\uFE0F"                 # variation selector
        )
        emoji_pattern = re.compile(f"[{emoji_ranges}]", flags=re.UNICODE)
        return emoji_pattern.sub('', text)

    def is_uncertain_amount(amount):
        keywords = ['취향껏', '조금', '약간', '선택', '기호에 따라']
        if 'or' in amount.lower():
            return True
        # 단순한 분수 (1/2, 2/3 등)은 허용
        if re.fullmatch(r'\d+\s*/\s*\d+', amount.strip()):
            return False
        return any(k in amount.lower() for k in keywords)


    # 제목 이모티콘 제거 + 개행 제거
    recipe['title'] = clean_text(remove_emojis(recipe.get('title', '제목 없음')))

    # 빈 필드 처리
    for key in ['serving', 'cook_time', 'difficulty', 'category']:
        value = recipe.get(key)
        recipe[key] = clean_text(value) if value and str(value).strip() else '정보 없음'

    # steps 정리
    recipe['steps'] = [
        clean_text(remove_emojis(s)) for s in recipe.get('steps', []) if isinstance(s, str) and s.strip()
    ]
    if not recipe['steps']:
        recipe['steps'] = ['조리 순서 없음']

    # ingredients dict → list[str]
    ingredients_dict = recipe.get('ingredients', {})
    ingredient_list = []
    if isinstance(ingredients_dict, dict) and ingredients_dict:
        for name, amount in ingredients_dict.items():
            name = clean_text(remove_emojis(name))
            amount = clean_text(remove_emojis(amount))
            if not name:
                continue
            if is_uncertain_amount(amount):
                ingredient_list.append(f"{name}: (비정량) {amount}")
            else:
                ingredient_list.append(f"{name}: {amount}")
    else:
        ingredient_list = ['재료 정보 없음']
    recipe['ingredients'] = ingredient_list

    return recipe


base_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.abspath(os.path.join(base_dir, "..", "data"))
input_path = os.path.join(data_dir, "recipes_raw.json")
output_path = os.path.join(data_dir, "recipes_cleaned.json")

# JSON 읽기
with open(input_path, "r", encoding="utf-8") as f:
    recipes = json.load(f)

# 전처리 적용
cleaned_recipes = [preprocess_recipe(r) for r in recipes]

# 저장
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(cleaned_recipes, f, ensure_ascii=False, indent=2)

print(f"전처리 완료: {len(cleaned_recipes)}개 레시피 → {output_path} 에 저장되었습니다.")
