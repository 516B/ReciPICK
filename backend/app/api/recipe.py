from fastapi import APIRouter
from app.services.client import client

router = APIRouter()

@router.get("/recipe/{id}")
async def get_recipe_by_id(id: str):
    try:
        return client.collections["recipes"].documents[id].retrieve()
    except Exception as e:
        return {"error": str(e)}
