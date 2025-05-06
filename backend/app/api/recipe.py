from fastapi import APIRouter, Query
from app.services.client import client

router = APIRouter()

@router.get("/{id}")
async def get_recipe_by_id(id: str):
    try:
        return client.collections["recipes"].documents[id].retrieve()
    except Exception as e:
        return {"error": str(e)}

@router.get("/search/title")
async def search_recipe_by_title(q: str = Query(...)):
    try:
        results = client.collections["recipes"].documents.search({
            "q": q,
            "query_by": "title"
        })
        return {"recipes": [
            {
                "id": hit["document"]["id"],
                "title": hit["document"]["title"],
                "image_url": hit["document"]["image_url"]
            }
            for hit in results["hits"]
        ]}
    except Exception as e:
        return {"recipes": [], "error": str(e)}
