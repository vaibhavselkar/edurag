from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime
from bson import ObjectId
from core.database import get_db
from core.security import hash_password, verify_password, create_access_token, get_current_user
from models.user import UserCreate, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


def serialize_user(user: dict) -> UserOut:
    return UserOut(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        role=user["role"],
        created_at=user["created_at"],
    )


@router.post("/register", status_code=201)
async def register(payload: UserCreate):
    db = get_db()
    existing = await db.users.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_count = await db.users.count_documents({})
    role = "admin" if user_count == 0 else "user"

    user_doc = {
        "name": payload.name,
        "email": payload.email,
        "password": hash_password(payload.password),
        "role": role,
        "created_at": datetime.utcnow().isoformat(),
    }
    result = await db.users.insert_one(user_doc)
    return {
        "id": str(result.inserted_id),
        "name": user_doc["name"],
        "email": user_doc["email"],
        "role": user_doc["role"],
        "created_at": user_doc["created_at"],
    }


@router.post("/login")
async def login(form: OAuth2PasswordRequestForm = Depends()):
    print(f"[LOGIN] Step 1 - received username: {form.username}")
    db = get_db()
    print(f"[LOGIN] Step 2 - db object: {db}")
    user = await db.users.find_one({"email": form.username})
    print(f"[LOGIN] Step 3 - user found: {user is not None}")
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No account found with this email")
    if not verify_password(form.password, user["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password")

    token = create_access_token({"sub": str(user["_id"]), "role": user["role"]})
    print(f"[LOGIN] Step 7 - token created, returning response")
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
        },
    }


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "name": current_user["name"],
        "email": current_user["email"],
        "role": current_user["role"],
        "created_at": current_user["created_at"].isoformat() if hasattr(current_user["created_at"], "isoformat") else str(current_user["created_at"]),
    }
