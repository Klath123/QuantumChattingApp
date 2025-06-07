from pydantic import BaseModel,Field
from typing import Optional
from datetime import datetime

class UserRegister(BaseModel):
    username: str
    email: str  # or EmailStr for automatic email validation
    password: str
    kyberPublicKey: str
    dilithiumPublicKey: str

class UserModel(BaseModel):
    id: Optional[str]
    username: str
    password_hash: str
    invite_code: str
    kyber_public_key: str
    dilithium_public_key: str
    created_at: datetime
    is_active: bool

class UserLogin(BaseModel):
    username: str = Field(...)
    password: str = Field(...)
    
# Pydantic models for OTP
class OTPRequest(BaseModel):
    username: str

class OTPVerification(BaseModel):
    username: str
    otp: str