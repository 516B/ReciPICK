from fastapi import APIRouter, Query
from app.services.client import client

router = APIRouter()

@router.get("/title")  # /search/title 로 접근 가능
async def search_by_title(
    q: str = Query(...),
    page: int = Query(1),
    per_page: int = Query(8)
):
    print(f"🔍 검색 실행됨 | q={q}, page={page}, per_page={per_page}")
    try:
        result = client.collections["recipes"].documents.search({
            "q": q,
            "query_by": "title",
            "page": page,
            "per_page": per_page
        })

        print("🔍 Raw result from Typesense:", result)

        recipes = [
            {
                "id": hit["document"]["id"],
                "title": hit["document"]["title"],
                "image_url": hit["document"]["image_url"]
            }
            for hit in result["hits"]
        ]

        return {"recipes": recipes}
    except Exception as e:
        print(" 에러 발생:", e)
        return {"recipes": [], "error": str(e)}
