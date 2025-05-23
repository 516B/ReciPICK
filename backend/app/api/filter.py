from fastapi import APIRouter, Query
from app.services.client import client

router = APIRouter()

@router.get("/difficulty-time")
async def filter_by_difficulty_time(
    difficulty: str = Query(None),
    max_time: int = Query(None),
    page: int = Query(1),
    per_page: int = Query(20)
):
    filters = []

    if difficulty:
        filters.append(f"difficulty:={difficulty}")
    if max_time is not None:
        filters.append(f"cook_time_minutes:<={max_time}")

    filter_query = " && ".join(filters) if filters else ""

    try:
        result = client.collections["recipes_gpt"].documents.search({
            "q": "*",
            "query_by": "title",
            "filter_by": filter_query,
            "page": page,
            "per_page": per_page
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
        return {"error": str(e)}
