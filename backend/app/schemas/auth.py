from pydantic import BaseModel, EmailStr, validator
from typing import Literal
from datetime import datetime
from pydantic import ConfigDict
class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: Literal['admin', 'geologist']

class UserCreate(UserBase):
    password: str
    password_confirm: str

    @validator('password')
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

    @validator('password_confirm')
    def passwords_match(cls, v: str, values):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v

class LoginForm(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: Literal['admin', 'geologist']
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
