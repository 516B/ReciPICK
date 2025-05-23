from typesense import Client
import json
import os

client = Client({
    "nodes": [{"host": "localhost", "port": "8200", "protocol": "http"}],
    "api_key": "xyz",
    "connection_timeout_seconds": 10
})

# JSON 경로 정확하게 지정
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(BASE_DIR, '..', 'data', 'recipes_with_minutes.json')

# 데이터 로드
with open(json_path, encoding="utf-8") as f:
    docs = json.load(f)

# 업로드
res = client.collections["recipes_gpt"].documents.import_(
    docs, {"action": "upsert"}
)

print("✅ 데이터 업로드 완료")
