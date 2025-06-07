from fastapi import APIRouter, Depends, HTTPException, Request
from src.utils.auth import get_current_user
from bson import ObjectId
from typing import Dict
from src.db.main import users
from src.ws.connection_manager import manager
import base64
userRouter = APIRouter()

@userRouter.get("/me")
def me(user=Depends(get_current_user)):
    user["_id"] = str(user["_id"])
    return user

@userRouter.post("/connect")
def connect_with_invite_code(data: dict, current_user=Depends(get_current_user)):
    invite_code = data.get("invite_code")
    if not invite_code:
        raise HTTPException(status_code=400, detail="Invite code is required")

    target_user = users.find_one({"invite_code": invite_code}, {"username": 1})
    if not target_user:
        raise HTTPException(status_code=404, detail="No user found with this invite code")

    if target_user["_id"] == current_user["_id"]:
        raise HTTPException(status_code=400, detail="You cannot connect to yourself")

    users.update_one({"_id": current_user["_id"]}, {"$addToSet": {"connected_users": str(target_user["_id"])}})
    users.update_one({"_id": target_user["_id"]}, {"$addToSet": {"connected_users": str(current_user["_id"])}})

    return {
        "msg": "Connected successfully",
        "connected_user": {"_id": str(target_user["_id"]), "username": target_user["username"]}
    }

@userRouter.get("/connections")
def get_connections(current_user=Depends(get_current_user)):
    ids = current_user.get("connected_users", [])
    users_list = list(users.find({"_id": {"$in": [ObjectId(uid) for uid in ids]}}))
    return [{"username": u["username"], "user_id": str(u["_id"])} for u in users_list]

@userRouter.get("/keys/{user_id}")
async def get_keys(user_id: str):
    try:
        # Validate ObjectId
        if not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user_id")

        # Fetch only the needed fields (async if Motor)
        user =  users.find_one(
            {"_id": ObjectId(user_id)},
            {"_id": 0, "kyber_public_key": 1, "dilithium_public_key": 1}
        )
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Decode hex strings to bytes
        try:
            kyber_bytes = bytes.fromhex(user["kyber_public_key"])
            dilithium_bytes = bytes.fromhex(user["dilithium_public_key"])
        except Exception as e:
            raise HTTPException(status_code=500, detail="Invalid key format stored")

        # Encode bytes to base64 for frontend transmission
        kyber_b64 = base64.b64encode(kyber_bytes).decode("utf-8")
        dilithium_b64 = base64.b64encode(dilithium_bytes).decode("utf-8")

        return {
            "kyber_public_key": kyber_b64,
            "dilithium_public_key": dilithium_b64,
        }

    except HTTPException:
        # Re-raise known HTTP errors
        raise
    except Exception as e:
        # Unexpected errors
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")