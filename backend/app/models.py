from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from .database import Base

# User 테이블
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)

    
    bookmarks = relationship("Bookmark", back_populates="user")


# Bookmark 테이블
class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    recipe_id = Column(Integer)

    # 중복 레시피 찜 방지
    __table_args__ = (UniqueConstraint("user_id", "recipe_id", name="unique_user_recipe"),)

    user = relationship("User", back_populates="bookmarks")
