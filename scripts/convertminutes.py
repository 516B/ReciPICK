import re
import json
import os

def extract_minutes(cook_time):
    if not cook_time:
        return None
    match = re.search(r'(\d+)', cook_time)
    return int(match.group(1)) if match else None

def process_file(input_path, output_path):
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    for recipe in data:
        recipe['cook_time_minutes'] = extract_minutes(recipe.get('cook_time', ''))

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# 경로 설정
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
input_file = os.path.join(BASE_DIR, 'data', 'recipes_cleaned.json')
output_file = os.path.join(BASE_DIR, 'data', 'recipes_with_minutes.json')

process_file(input_file, output_file)
print("✅ cook_time_minutes 필드 추가 완료!")
