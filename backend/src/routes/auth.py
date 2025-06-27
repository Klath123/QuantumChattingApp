from fastapi import APIRouter,Response,BackgroundTasks,HTTPException
from src.utils.auth import register_user, authenticate_user,send_otp,verify_login_otp,create_token
from src.models.auth import UserRegister,UserLogin,OTPVerification,OTPRequest
from src.config import Config
authRouter = APIRouter() 

@authRouter.post("/register")
def register(data: UserRegister, background_tasks: BackgroundTasks):
    return register_user(data, background_tasks)

@authRouter.post("/login")
async def login(data: UserLogin, response: Response, background_tasks: BackgroundTasks):
    # Authenticate user credentials first
    user_data = authenticate_user(data)
    
    # At this point, credentials are valid but don't set cookie yet
    # Instead, send OTP for additional verification using existing utility
    
    await send_otp(data.username, background_tasks)
    
    # Return response indicating OTP is required
    return {
        "otp_required": True,
        "msg": "OTP sent to your registered email for verification",
        "expires_in": "10 minutes"
    }


# @authRouter.post("/logout")
# def logout(response: Response):
#     response.delete_cookie("access_token")
#     return {"message": "Logged out"}


@authRouter.post("/send-otp")
async def resend_otp(data: dict, background_tasks: BackgroundTasks):
    """
    Resend OTP for existing login attempt using existing utility
    """
    username = data.get("username")
    
    if not username:
        raise HTTPException(status_code=400, detail="Username is required")
    
    # Use existing utility function to send OTP
    result = await send_otp(username, background_tasks)
    
    return result

@authRouter.post("/verify-otp")
async def verify_otp_and_login(data: dict, response: Response):
    """
    Verify OTP and complete login process using existing utility
    """
    username = data.get("username")
    otp = data.get("otp")
    
    if not username or not otp:
        raise HTTPException(status_code=400, detail="Username and OTP are required")
    
    # Use existing utility function to verify OTP
    verification_result = await verify_login_otp(username, otp)
    
    # Extract token from verification result
    token = verification_result["token"]
    
    # Set authentication cookie
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,        # ✅ Set to True in production (with HTTPS)
        samesite="none",      # ✅ Lax is fine for most cases
        max_age=7 * 24 * 60 * 60,
        path="/"             # ✅ CRITICAL: ensures the cookie is sent to all endpoints
    )
    
    return {
        "success": True,
        "msg": "Login successful"
    }

@authRouter.get("/debug-token")
async def debug_token():
    try:
        test_token = create_token({"sub": "test_user"})
        return {
            "success": True,
            "token_preview": test_token[:20] + "...",
            "config": {
                "has_secret": bool(Config.SECRET_KEY),
                "algorithm": Config.ALGORITHM,
                "expire_minutes": Config.ACCESS_TOKEN_EXPIRE_MINUTES
            }
        }
    except Exception as e:
        return {"error": str(e)}


