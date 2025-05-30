from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from ..database import SessionLocal
from ..models import User
import bcrypt

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class SignupRequest(BaseModel):
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/signup")
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="이미 존재하는 이메일입니다.")
    
    hashed_pw = bcrypt.hashpw(req.password.encode("utf-8"), bcrypt.gensalt())
    user = User(email=email, password=hashed_pw.decode("utf-8"))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"userId": user.id}

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user or not bcrypt.checkpw(req.password.encode("utf-8"), user.password.encode("utf-8")):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 잘못되었습니다.")
    return {"userId": user.id}
