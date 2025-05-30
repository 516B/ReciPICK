from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import Bookmark

router = APIRouter()

# DB 세션 의존성
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 찜 추가
@router.post("/{recipe_id}")
def add_bookmark(user_id: int, recipe_id: int, db: Session = Depends(get_db)):
    existing = db.query(Bookmark).filter_by(user_id=user_id, recipe_id=recipe_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 찜한 레시피입니다.")

    new_bookmark = Bookmark(user_id=user_id, recipe_id=recipe_id)
    db.add(new_bookmark)
    db.commit()
    return {"message": "찜 추가 완료"}

# 찜 삭제
@router.delete("/{recipe_id}")
def remove_bookmark(user_id: int, recipe_id: int, db: Session = Depends(get_db)):
    bookmark = db.query(Bookmark).filter_by(user_id=user_id, recipe_id=recipe_id).first()
    if not bookmark:
        raise HTTPException(status_code=404, detail="찜이 존재하지 않습니다.")

    db.delete(bookmark)
    db.commit()
    return {"message": "찜 삭제 완료"}

# 찜 목록 조회
@router.get("/")
def get_user_bookmarks(user_id: int, db: Session = Depends(get_db)):
    bookmarks = db.query(Bookmark).filter_by(user_id=user_id).all()
    recipe_ids = [b.recipe_id for b in bookmarks]
    return {"recipe_ids": recipe_ids}
