import os
import json
import sqlite3

# 경로 설정
base_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.abspath(os.path.join(base_dir, "..", "data"))

json_path = os.path.join(data_dir, "recipes_cleaned.json")
db_path = os.path.join(data_dir, "recipes_cleaned.db")

# JSON 로딩
with open(json_path, "r", encoding="utf-8") as f:
    recipes = json.load(f)

# SQLite 저장
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 테이블 생성
cursor.execute("""
CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    title TEXT,
    category TEXT,
    serving TEXT,
    image_url TEXT,
    cook_time TEXT,
    difficulty TEXT,
    ingredients TEXT,
    steps TEXT
)
""")

# 데이터 저장
cursor.executemany("""
INSERT OR REPLACE INTO recipes (
    id, title, category, serving, image_url, cook_time, difficulty, ingredients, steps
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
""", [
    (
        r.get("id", ""),
        r.get("title", ""),
        r.get("category", ""),
        r.get("serving", ""),
        r.get("image_url", ""),
        r.get("cook_time", ""),
        r.get("difficulty", ""),
        json.dumps(r.get("ingredients", []), ensure_ascii=False),
        json.dumps(r.get("steps", []), ensure_ascii=False)
    ) for r in recipes
])

conn.commit()
conn.close()

print(f"총 {len(recipes)} 개의 레시피가 SQLite DB({db_path})에 저장되었습니다.")
