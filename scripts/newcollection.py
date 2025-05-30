from typesense import Client
import json

client = Client({
    "nodes": [{"host": "localhost", "port": "8108", "protocol": "http"}],
    "api_key": "xyz", 
    "connection_timeout_seconds": 10
})

# 기존 컬렉션 삭제 (있을 경우)
try:
    client.collections["recipes_gpt"].delete()
    print("✅ 기존 recipes_gpt 삭제 완료")
except:
    print("ℹ️ 기존 컬렉션 없음")

# 새 컬렉션 스키마 정의
schema = {
    "name": "recipes_gpt",
    "fields": [
        {"name": "id", "type": "string"},
        {"name": "title", "type": "string"},
        {"name": "cook_time", "type": "string"},
        {"name": "cook_time_minutes", "type": "int32"},
        {"name": "difficulty", "type": "string", "facet": True},
        {"name": "ingredients", "type": "string[]"},
        {"name": "image_url", "type": "string"}
    ],
    "default_sorting_field": "cook_time_minutes"
}

# 생성
client.collections.create(schema)
print("✅ 새 컬렉션 recipes_gpt 생성 완료")
