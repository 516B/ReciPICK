import os
import json
from client import client
from index_schema import schema
import typesense

# 컬렉션 생성 함수
def create_typesense_index():
    try:
        client.collections.create(schema)
        print("Typesense 컬렉션 생성 완료!")
    except typesense.exceptions.ObjectAlreadyExists:
        print("! 컬렉션이 이미 존재합니다.")
    except Exception as e:
        print("! 컬렉션 생성 중 오류:", e)

# 인덱싱
def index_recipes_batch(all_recipes):
    try:
        documents = '\n'.join([
            json.dumps({
                "id": str(recipe["id"]),
                "title": recipe["title"],
                "category": recipe["category"],
                "serving": recipe["serving"],
                "image_url": recipe["image_url"],
                "cook_time": recipe["cook_time"],
                "difficulty": recipe["difficulty"],
                "ingredients": recipe.get("ingredients", []),
                "steps": recipe.get("steps", [])
            }) for recipe in all_recipes
        ])

        response = client.collections['recipes'].documents.import_(
            documents,
            {'action': 'upsert'}
        )
        print("upsert 완료!")
    except Exception as e:
        print("! upsert 실패:", e)

# JSON 파일 로드
def load_recipes_json():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.abspath(os.path.join(base_dir, "..", "..", "data"))
    json_path = os.path.join(data_path, "recipes_cleaned.json")
    with open(json_path, "r", encoding="utf-8") as f:
        return json.load(f)
    

# 실행
if __name__ == "__main__":
    all_recipes = load_recipes_json()
    create_typesense_index()
    index_recipes_batch(all_recipes)
