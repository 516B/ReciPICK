from fastapi import APIRouter, Query
from app.services.client import client

router = APIRouter()

@router.get("/search/category")
async def search_by_category(
    name: str = Query(...),
    page: int = Query(1),
    per_page: int = Query(10)
):
    try:
        result = client.collections["recipes"].documents.search({
            "q": name,
            "query_by": "category",
            "page": page,
            "per_page": per_page,
        })
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
        return {"recipes": [], "error": str(e)}
