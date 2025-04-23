from fastapi import APIRouter, Query
from app.services.client import client

router = APIRouter()

@router.get("/search")
async def search_recipes(ingredient: str = Query(..., description="검색할 재료")):
    try:
        result = client.collections["recipes"].documents.search({
            "q": ingredient,
            "query_by": "ingredients",
            "per_page": 5
        })

        recipes = [
            {
                "id": hit["document"]["id"],
                "title": hit["document"]["title"]
            }
            for hit in result["hits"]
        ]

        return {"recipes": recipes}

    except Exception as e:
        print("검색 오류:", e)
        return {"recipes": [], "error": str(e)}
