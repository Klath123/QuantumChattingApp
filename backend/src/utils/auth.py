from fastapi import HTTPException, Depends, Header,Request,WebSocket,BackgroundTasks
from secrets import compare_digest
from jose import jwt, JWTError
import bcrypt, os, uuid
from datetime import datetime, timedelta, timezone
from src.models.auth import UserRegister, UserLogin
from bson.objectid import ObjectId
from jwt.exceptions import InvalidTokenError
from src.db.main import users
import re
from src.config import Config
from bson import ObjectId
import json
from fastapi.encoders import jsonable_encoder
from typing import Dict
import base64
from src.utils.email import welcome_email
import random



credentials_exception = HTTPException(
    status_code=401,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

def hash_password(pw):
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt())

def verify_password(pw, hashed):
    return bcrypt.checkpw(pw.encode(), hashed)

def validate_password(password: str):
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="Password must include at least one uppercase letter")
    if not re.search(r"[a-z]", password):
        raise HTTPException(status_code=400, detail="Password must include at least one lowercase letter")
    if not re.search(r"[0-9]", password):
        raise HTTPException(status_code=400, detail="Password must include at least one digit")
    
def create_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a JWT token with the provided data."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=Config.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, Config.SECRET_KEY, algorithm=Config.ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            Config.SECRET_KEY,
            algorithms=[Config.ALGORITHM]
        )
        return payload
    except JWTError:
        raise credentials_exception

    


def register_user(data: UserRegister, background_tasks: BackgroundTasks):
    # Validate required fields
    if not data.username or not data.password or not data.email:
        raise HTTPException(status_code=400, detail="Username, password, and email are required")
    
    # Validate email format
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, data.email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    # Check if username is taken
    if users.find_one({"username": data.username}):
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Check if email is already registered
    if users.find_one({"email": data.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate password strength
    validate_password(data.password)
    
    now = datetime.now(timezone.utc)
    invite_code = str(uuid.uuid4())[:8]
    
    try:
        # Decode public keys from base64
        kyber_public_key = base64.b64decode(data.kyberPublicKey)
        dilithium_public_key = base64.b64decode(data.dilithiumPublicKey)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid public key encoding")
    
    # Save user data including email in DB
    user = {
        "username": data.username,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "kyber_public_key": kyber_public_key.hex(),
        "dilithium_public_key": dilithium_public_key.hex(),
        "created_at": now,
        "updated_at": now,
        "invite_code": invite_code,
        "is_active": True
    }
    
    users.insert_one(user)
    
    # Send welcome email - using your working pattern
    html = f"""
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Welcome to Our Secure Platform</title>
  <style>
    body {{
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }}
    .container {{
      background-color: #ffffff;
      margin: 50px auto;
      padding: 30px;
      max-width: 600px;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }}
    h1 {{
      color: #333333;
    }}
    p {{
      color: #555555;
      line-height: 1.6;
    }}
    .invite-code {{
      background-color: #f8f9fa;
      border: 2px dashed #007bff;
      padding: 15px;
      text-align: center;
      margin: 20px 0;
      border-radius: 5px;
    }}
    .code {{
      font-family: 'Courier New', monospace;
      font-size: 18px;
      font-weight: bold;
      color: #007bff;
    }}
    .button {{
      display: inline-block;
      padding: 10px 20px;
      margin-top: 20px;
      background-color: #4CAF50;
      color: #ffffff;
      text-decoration: none;
      border-radius: 5px;
    }}
    .footer {{
      margin-top: 30px;
      font-size: 12px;
      color: #aaaaaa;
    }}
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome to Our Secure Platform!</h1>
    <p>Hi {data.username},</p>
    <p>Thank you for registering with our quantum-secure platform. We're excited to have you on board!</p>
    <p>Your account has been successfully created with post-quantum cryptographic protection.</p>
    
    <div class="invite-code">
      <p><strong>Your Invite Code:</strong></p>
      <p class="code">{invite_code}</p>
      <p><small>Share this code with friends to invite them to the platform</small></p>
    </div>
    
    <p>Your account is now active and ready to use. You can start exploring our secure features immediately.</p>
    <p>If you have any questions or need assistance, feel free to reply to this email.</p>
    
    <div class="footer">
      &copy; 2025 Secure Platform. All rights reserved.
    </div>
  </div>
</body>
</html>
"""
    
    subject = "Welcome to Our Secure Platform - Account Created Successfully"
    welcome_email([data.email], html, subject, background_tasks)
    
    return {
        "msg": "User registered successfully",
        "invite_code": invite_code
    }


def authenticate_user(data: UserLogin) -> dict:
    user = users.find_one({"username": data.username})

    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token({"sub": user["username"]})
    return {"user": user, "token": token}


def get_current_user(request: Request):
    token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(status_code=401, detail="Missing token")

    try:
        data = decode_token(token)
        user = users.find_one({"username": data["sub"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user.pop("password_hash", None)
        user["id"] = str(user["_id"])
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    
async def get_current_user_ws(websocket: WebSocket):
    token = websocket.cookies.get("access_token")
    print(token)
    if not token:
        return None
    try:
        data = decode_token(token)
        user = users.find_one({"username": data["sub"]})
        if not user:
            return None
        user.pop("password_hash", None)
        user["id"] = str(user["_id"])
        return user
    except Exception:
        return None
    

async def send_otp(
    username: str, 
    background_tasks: BackgroundTasks
):
    """
    Send OTP for login verification
    """
    # Find user by username
    user = users.find_one({"username": username})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=400, detail="User account is inactive")
    
    # Generate 6-digit OTP
    otp = f"{random.randint(100000, 999999)}"
    expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    # Update user document with OTP and expiry
    users.update_one(
        {"username": username},
        {
            "$set": {
                "login_otp": otp,
                "login_otp_expiry": expiry
            }
        }
    )
    
    # Create HTML email template
    html = f"""
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Login Verification - OTP</title>
  <style>
    body {{
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }}
    .container {{
      background-color: #ffffff;
      margin: 50px auto;
      padding: 30px;
      max-width: 600px;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }}
    h1 {{
      color: #333333;
      text-align: center;
    }}
    p {{
      color: #555555;
      line-height: 1.6;
    }}
    .otp-box {{
      background-color: #f8f9fa;
      border: 2px solid #007bff;
      padding: 20px;
      text-align: center;
      margin: 25px 0;
      border-radius: 8px;
    }}
    .otp-code {{
      font-family: 'Courier New', monospace;
      font-size: 32px;
      font-weight: bold;
      color: #007bff;
      letter-spacing: 5px;
      margin: 10px 0;
    }}
    .warning {{
      background-color: #fff3cd;
      border: 1px solid #ffeaa7;
      color: #856404;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }}
    .footer {{
      margin-top: 30px;
      font-size: 12px;
      color: #aaaaaa;
      text-align: center;
    }}
  </style>
</head>
<body>
  <div class="container">
    <h1>🔐 Login Verification</h1>
    <p>Hello <strong>{user['username']}</strong>,</p>
    <p>We received a login attempt for your secure account. To complete the login process, please use the OTP below:</p>
    
    <div class="otp-box">
      <p><strong>Your OTP Code:</strong></p>
      <div class="otp-code">{otp}</div>
      <p><small>This code is valid for 10 minutes</small></p>
    </div>
    
    <div class="warning">
      <strong>⚠️ Security Notice:</strong><br>
      If you didn't attempt to log in, please ignore this email and consider changing your password.
      Never share this OTP with anyone.
    </div>
    
    <p>This OTP will expire in 10 minutes for your security.</p>
    <p>If you have any concerns about your account security, please contact our support team immediately.</p>
    
    <div class="footer">
      &copy; 2025 Secure Platform. All rights reserved.<br>
      This is an automated message, please do not reply.
    </div>
  </div>
</body>
</html>
"""
    
    subject = "Login Verification - Your OTP Code"
    email = user.get("email")
    
    if not email:
        raise HTTPException(status_code=400, detail="User email not found")
    
    # Send email in background
    welcome_email([email], html, subject, background_tasks)
    
    return {
        "success": True,
        "message": "OTP sent to your registered email",
        "expires_in": "10 minutes"
    }


async def verify_login_otp(username: str, otp: str):
    """
    Verify the OTP for login
    """
    user = users.find_one({"username": username})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    stored_otp = user.get("login_otp")
    otp_expiry = user.get("login_otp_expiry")
    
    if not stored_otp or not otp_expiry:
        raise HTTPException(status_code=400, detail="No OTP found. Please request a new one.")
    
    # Check if OTP has expired
    if datetime.now(timezone.utc) > otp_expiry:
        # Clean up expired OTP
        users.update_one(
            {"username": username},
            {"$unset": {"login_otp": "", "login_otp_expiry": ""}}
        )
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    
    # Verify OTP
    if stored_otp != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Clean up used OTP
    users.update_one(
        {"username": username},
        {"$unset": {"login_otp": "", "login_otp_expiry": ""}}
    )
    
    # Generate login token
    token = create_token({"sub": username})
    
    return {
        "success": True,
        "message": "Login verified successfully",
        "user": user,
        "token": token
    }