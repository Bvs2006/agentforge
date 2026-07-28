from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from models.schemas import UserRegister, UserLogin, Token, UserOut
from utils.auth_utils import (
    register_user, get_user_by_email, verify_password,
    create_token, decode_token
)

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload

@router.post("/register", response_model=Token)
async def register(data: UserRegister):
    user = register_user(data.username, data.email, data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Email already registered")
    token = create_token({"sub": user["id"], "email": user["email"], "username": user["username"]})
    return {"access_token": token}

@router.post("/login", response_model=Token)
async def login(data: UserLogin):
    user = get_user_by_email(data.email)
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token({"sub": user["id"], "email": user["email"], "username": user["username"]})
    return {"access_token": token}

@router.get("/me", response_model=UserOut)
async def me(current_user: dict = Depends(get_current_user)):
    return UserOut(id=current_user["sub"], username=current_user["username"], email=current_user["email"])