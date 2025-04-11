import requests
from bs4 import BeautifulSoup
import json
import time
import re
import sqlite3
import os
import concurrent.futures

BASE_URL = "https://www.10000recipe.com"
headers = {
    "User-Agent": "Mozilla/5.0"
}

categories = {
    "밑반찬": 63,
    "메인반찬": 56,
    "국/탕": 54,
    "찌개": 55,
    "양식": 65,
    "디저트": 60,
    "퓨전": 61,
    "빵": 66,
    "밥/죽/떡": 52,
    "샐러드": 64
}

def create_session():
    session = requests.Session()
    session.headers.update(headers)
    return session

def clean_ingredient(text):
    text = text.replace("구매", "").strip()
    parts = re.split(r'\n{2,}|\s{2,}', text)
    if len(parts) >= 2:
        name = parts[0].strip()
        amount = parts[1].strip()
        return name, amount
    return None, None

def extract_serving(category_text):
    match = re.search(r'(\d+\s*인분)', category_text)
    return match.group(1) if match else category_text.strip()

def get_recipe_ids_by_cat4(session, cat4, max_count=100):
    ids = set()
    page = 1
    while len(ids) < max_count:
        url = f"{BASE_URL}/recipe/list.html?cat4={cat4}&page={page}"
        try:
            res = session.get(url, timeout=5)
            res.raise_for_status()
            # print(f"카테고리 {cat4} - 페이지 {page} 요청 성공")
        except Exception as e:
            print(f"카테고리 {cat4} - 페이지 {page} 요청 실패: {e}")
            break

        soup = BeautifulSoup(res.text, "lxml")
        links = soup.select(".common_sp_link")
        if not links:
            break
        for link in links:
            rid = link["href"].split("/")[-1]
            ids.add(rid)
            if len(ids) >= max_count:
                break
        page += 1
        time.sleep(0.3)
    return list(ids)

def get_recipe_detail(session, recipe_id, category_name):
    url = f"{BASE_URL}/recipe/{recipe_id}"
    try:
        res = session.get(url, timeout=5)
        res.raise_for_status()
        # print(f"레시피 {recipe_id} 요청 성공")
    except Exception as e:
        print(f"레시피 {recipe_id} 요청 실패: {e}")
        return None

    soup = BeautifulSoup(res.text, "lxml")

    title_tag = soup.select_one(".view2_summary h3")
    title = title_tag.text.strip() if title_tag else "제목 없음"

    category_tag = soup.select_one(".view2_summary_info1")
    category_raw = category_tag.text.strip() if category_tag else ""
    serving = extract_serving(category_raw)

    image_tag = soup.select_one(".centeredcrop img")
    image_url = image_tag["src"] if image_tag and image_tag.has_attr("src") else ""

    cook_time_tag = soup.select_one(".view2_summary_info2")
    cook_time = cook_time_tag.text.strip() if cook_time_tag else ""

    difficulty_tag = soup.select_one(".view2_summary_info3")
    difficulty = difficulty_tag.text.strip() if difficulty_tag else ""

    raw_ingredients = soup.select(".ready_ingre3 ul li")
    ingredient_dict = {}
    for item in raw_ingredients:
        if item.text.strip():
            name, amount = clean_ingredient(item.text)
            if name and amount:
                ingredient_dict[name] = amount

    steps = [step.text.strip() for step in soup.select(".view_step_cont") if step.text.strip()]

    return {
        "id": recipe_id,
        "title": title,
        "category": category_name,
        "serving": serving,
        "image_url": image_url,
        "cook_time": cook_time,
        "difficulty": difficulty,
        "ingredients": ingredient_dict,
        "steps": steps
    }

def crawl_recipes():
    all_recipes = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        with create_session() as session:
            future_to_category = {executor.submit(get_recipe_ids_by_cat4, session, cat4, max_count=100): category_name for category_name, cat4 in categories.items()}
            
            for future in concurrent.futures.as_completed(future_to_category):
                category_name = future_to_category[future]
                try:
                    recipe_ids = future.result()
                    print(f"{category_name} - 수집 대상 ID 수: {len(recipe_ids)}")

                    recipe_futures = {executor.submit(get_recipe_detail, session, rid, category_name): rid for rid in recipe_ids}
                    for recipe_future in concurrent.futures.as_completed(recipe_futures):
                        recipe = recipe_future.result()
                        if recipe:
                            all_recipes.append(recipe)
                            print(f"레시피 {recipe['id']} 수집 완료! 현재까지 {len(all_recipes)}개의 레시피 수집됨.")  # 현재까지 수집된 레시피 개수 출력
                except Exception as e:
                    print(f"{category_name} 크롤링 중 오류:", e)
                time.sleep(0.3)
    
    return all_recipes

def save_to_sqlite(all_recipes, db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

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

    cursor.executemany("""
    INSERT OR REPLACE INTO recipes (
        id, title, category, serving, image_url, cook_time, difficulty, ingredients, steps
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, [
        (
            recipe["id"],
            recipe["title"],
            recipe["category"],
            recipe["serving"],
            recipe["image_url"],
            recipe["cook_time"],
            recipe["difficulty"],
            json.dumps(recipe["ingredients"], ensure_ascii=False),
            json.dumps(recipe["steps"], ensure_ascii=False)
        )
        for recipe in all_recipes
    ])

    conn.commit()
    conn.close()

# 메인 작업
all_recipes = crawl_recipes()

# 경로 설정
base_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.abspath(os.path.join(base_dir, "../../data"))

json_path = os.path.join(data_dir, "recipes_raw.json")
db_path = os.path.join(data_dir, "recipes_raw.db")

# JSON 저장
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(all_recipes, f, ensure_ascii=False, indent=2)

print(f"총 {len(all_recipes)} 개의 레시피가 {json_path} 에 저장되었습니다.")

# SQLite 저장
save_to_sqlite(all_recipes, db_path)

print(f"모든 작업 완료. JSON 및 SQLite 파일이 {data_dir}에 저장되었습니다.")
