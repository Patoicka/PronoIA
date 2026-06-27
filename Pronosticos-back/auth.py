import os
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import bcrypt
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

import models
from database import get_db

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "kronos-secret-change-in-production")
ALGORITHM  = "HS256"
TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 horas

router  = APIRouter(prefix="/api/auth", tags=["auth"])
_bearer = HTTPBearer()


# ---------- Schemas ----------

class RegisterRequest(BaseModel):
    nombres:          str
    apellidos:        str
    fecha_nacimiento: Optional[date] = None
    correo:           EmailStr
    telefono:         Optional[str] = None
    password:         str

class LoginRequest(BaseModel):
    correo:   EmailStr
    password: str

class UpdateProfileRequest(BaseModel):
    nombres:          str
    apellidos:        str
    fecha_nacimiento: Optional[date] = None
    telefono:         Optional[str]  = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password:     str

class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user: dict


# ---------- Helpers ----------

def _hash(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def _verify(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())

def _create_token(data: dict) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    return jwt.encode({**data, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


# ---------- Endpoints ----------

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.correo == body.correo).first():
        raise HTTPException(status_code=409, detail="El correo ya está registrado")

    user = models.User(
        nombres          = body.nombres.strip(),
        apellidos        = body.apellidos.strip(),
        fecha_nacimiento = body.fecha_nacimiento,
        correo           = body.correo.lower(),
        telefono         = body.telefono,
        hashed_password  = _hash(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = _create_token({"sub": str(user.id), "correo": user.correo})
    return TokenResponse(access_token=token, user=_user_dict(user))


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.correo == body.correo.lower()).first()
    if not user or not _verify(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

    token = _create_token({"sub": str(user.id), "correo": user.correo})
    return TokenResponse(access_token=token, user=_user_dict(user))


def _get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(_bearer),
    db: Session = Depends(get_db),
) -> models.User:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user


@router.get("/me")
def get_me(current_user: models.User = Depends(_get_current_user)):
    return _user_dict(current_user)


@router.put("/me")
def update_me(
    body: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(_get_current_user),
):
    current_user.nombres          = body.nombres.strip()
    current_user.apellidos        = body.apellidos.strip()
    current_user.fecha_nacimiento = body.fecha_nacimiento
    current_user.telefono         = body.telefono
    db.commit()
    db.refresh(current_user)
    return _user_dict(current_user)


@router.put("/me/password")
def change_password(
    body: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(_get_current_user),
):
    if not _verify(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")
    current_user.hashed_password = _hash(body.new_password)
    db.commit()
    return {"detail": "Contraseña actualizada"}


def _user_dict(user: models.User) -> dict:
    return {
        "id":               user.id,
        "nombres":          user.nombres,
        "apellidos":        user.apellidos,
        "correo":           user.correo,
        "telefono":         user.telefono,
        "fecha_nacimiento": str(user.fecha_nacimiento) if user.fecha_nacimiento else None,
    }
