from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import schemas, models, database
import app.schemas.auth as auth_schemas
import app.auth.utils as auth_utils

router = APIRouter()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register", response_model=auth_schemas.Token)
def register(user: auth_schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter((models.User.email == user.email) | (models.User.username == user.username)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email or username already registered")
    hashed_password = auth_utils.get_password_hash(user.password)
    db_user = models.User(username=user.username, email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    access_token = auth_utils.create_access_token(data={"sub": str(db_user.id), "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=auth_schemas.Token)
def login(form_data: auth_schemas.LoginForm, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.email).first()
    if not user or not auth_utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    access_token = auth_utils.create_access_token(data={"sub": str(user.id), "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=auth_schemas.UserOut)
def read_me(current_user: models.User = Depends(auth_utils.get_current_user)):
    return current_user
