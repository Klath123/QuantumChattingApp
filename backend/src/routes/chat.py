
from fastapi import WebSocket, WebSocketDisconnect, APIRouter, Depends, HTTPException
from fastapi.websockets import WebSocketState
from src.ws.connection_manager import manager
from src.utils.auth import get_current_user_ws, get_current_user
from src.db.main import messages
from datetime import datetime
from fastapi.responses import JSONResponse
import traceback
import asyncio
import json

chatRouter = APIRouter()
@chatRouter.websocket("/ws/chat")
async def chat_socket(websocket: WebSocket):    
    try:
        # Accept the WebSocket connection first
        await websocket.accept()
        print("🔌 WebSocket connection accepted")
        
        # Authenticate the user
        user = await get_current_user_ws(websocket)
        if not user:
            await websocket.send_text("STATUS:❌ Unauthorized - Please log in")
            await websocket.close(code=1008, reason="Unauthorized")
            return
       
        user_id = str(user["_id"])
        print(f"✅ User authenticated: {user_id}")

        # Connect the user to the manager
        await manager.connect(websocket, user_id)
        
        # Send initial status
        await websocket.send_text("STATUS:✅ Connected successfully")
        
        # Main message handling loop
        try:
            while websocket.client_state == WebSocketState.CONNECTED:
                try:
                    # Set a timeout for receiving messages to allow for periodic cleanup
                    data = await asyncio.wait_for(websocket.receive_json(), timeout=30.0)
                    print(f"📨 Received data from {user_id}: {data}")

                    msg_type = data.get("type")
                    
                    if msg_type == "encrypted-message":
                        await handle_encrypted_message(websocket, user_id, data)
                        
                    elif msg_type == "pair":
                        await handle_pair_request(websocket, user_id, data)
                        
                    elif msg_type == "ping":
                        # Handle ping/pong for connection health
                        await websocket.send_text(json.dumps({"type": "pong"}))
                        
                    else:
                        print(f"⚠️ Unknown message type: {msg_type}")
                        await websocket.send_text("STATUS:❌ Unknown message type")

                except asyncio.TimeoutError:
                    # Send a ping to check if connection is still alive
                    try:
                        await websocket.send_text(json.dumps({"type": "ping"}))
                    except Exception:
                        # Connection is likely dead
                        break
                        
                except json.JSONDecodeError as e:
                    print(f"❌ Invalid JSON from {user_id}: {e}")
                    await websocket.send_text("STATUS:❌ Invalid message format")
                    
                except Exception as e:
                    print(f"❌ Error processing message from {user_id}: {e}")
                    traceback.print_exc()
                    await websocket.send_text(f"STATUS:❌ Message processing error")

        except WebSocketDisconnect:
            print(f"🔌 WebSocket disconnect event for {user_id}")
            
        except Exception as e:
            print(f"❌ Unexpected error in message loop for {user_id}: {e}")
            traceback.print_exc()
            
        finally:
            # Ensure cleanup happens
            if user_id:
                print(f"🧹 Cleaning up connection for {user_id}")
                manager.disconnect(user_id)

    except Exception as e:
        print(f"❌ Connection error during setup: {e}")
        traceback.print_exc()
        try:
            if websocket.client_state == WebSocketState.CONNECTED:
                await websocket.close(code=1011, reason="Internal server error")
        except Exception:
            pass
        
        if user_id:
            manager.disconnect(user_id)

async def handle_encrypted_message(websocket: WebSocket, user_id: str, data: dict):
    """Handle encrypted message sending"""
    try:
        # Validate required fields
        required_fields = ["ciphertext", "encryptedMessage", "iv", "from", "to"]
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            await websocket.send_text(f"STATUS:❌ Missing fields: {', '.join(missing_fields)}")
            return

        to_user_id = data.get("to")
        from_user_id = data.get("from")
        signature = data.get("signature")  # Extract signature
        
        # Verify the sender matches the authenticated user
        if from_user_id != user_id:
            await websocket.send_text("STATUS:❌ Sender ID mismatch")
            return

        if not to_user_id:
            await websocket.send_text("STATUS:❌ Missing recipient")
            return

        # Log signature presence for debugging
        print(f"📝 Message has signature: {bool(signature)}")

        # Check if recipient is online
        if not manager.is_user_online(to_user_id):
            await websocket.send_text(f"STATUS:❌ User {to_user_id} is not online")
            return

        # Pair users for this conversation
        manager.pair_users(user_id, to_user_id)
        manager.pair_users(to_user_id, user_id)

        print(f"🔄 Attempting to send message from {user_id} to {to_user_id}")

        # Send the encrypted message (signature is already included in data)
        success = await manager.send_to_peer(user_id, data)
        
        if not success:
            await websocket.send_text("STATUS:❌ Failed to deliver message")
            
    except Exception as e:
        print(f"❌ Error handling encrypted message: {e}")
        traceback.print_exc()
        await websocket.send_text("STATUS:❌ Message handling error")

async def handle_pair_request(websocket: WebSocket, user_id: str, data: dict):
    """Handle explicit pairing requests"""
    try:
        peer_id = data.get("to")
        if not peer_id:
            await websocket.send_text("STATUS:❌ Missing 'to' field in pair request")
            return
            
        if not manager.is_user_online(peer_id):
            await websocket.send_text(f"STATUS:❌ User {peer_id} is not online")
            return
            
        manager.pair_users(user_id, peer_id)
        await websocket.send_text(f"STATUS:🔐 Paired with {peer_id}")
        
    except Exception as e:
        print(f"❌ Error handling pair request: {e}")
        await websocket.send_text("STATUS:❌ Pairing error")

# NEW: Add endpoint to retrieve messages with signatures

@chatRouter.get("/messages/{peer_id}")
async def get_messages_with_signatures(peer_id: str, current_user = Depends(get_current_user)):
    """Retrieve messages between current user and peer, including signatures"""
    try:
        user_id = str(current_user["_id"])
        
        # Find all messages between the two users
        message_filter = {
            "$or": [
                {"sender_id": user_id, "receiver_id": peer_id},
                {"sender_id": peer_id, "receiver_id": user_id}
            ]
        }
        
        # Retrieve messages sorted by timestamp
        cursor = messages.find(message_filter).sort("timestamp", 1)
        message_list = []
        
        for msg in cursor:
            message_data = {
                "_id": str(msg["_id"]),
                "sender_id": msg["sender_id"],
                "receiver_id": msg["receiver_id"],
                "message_type": msg.get("message_type", "text"),
                "timestamp": msg["timestamp"].isoformat(),  # Convert to ISO string
            }
            
            # Include encrypted fields if present
            if msg.get("ciphertext"):
                message_data["ciphertext"] = msg["ciphertext"]
            if msg.get("encrypted_message"):
                message_data["encrypted_message"] = msg["encrypted_message"]
            if msg.get("iv"):
                message_data["iv"] = msg["iv"]
            if msg.get("signature"):
                message_data["signature"] = msg["signature"]
                print(f"📤 Including signature for message {msg['_id']}")
            
            # Include plain message if present (for backward compatibility)
            if msg.get("message"):
                message_data["message"] = msg["message"]
                
            message_list.append(message_data)
        
        print(f"📜 Retrieved {len(message_list)} messages for {user_id} <-> {peer_id}")
        print(f"📝 Messages with signatures: {sum(1 for msg in message_list if msg.get('signature'))}")
        
        return message_list
        
    except Exception as e:
        print(f"❌ Error retrieving messages: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to retrieve messages")
                            

# @chatRouter.get("/messages/{peer_id}")
# async def get_chat_messages(peer_id: str, user = Depends(get_current_user)):
#     """Get chat history between two users"""
#     try:
#         user_id = str(user["_id"])

#         # Query for messages between the two users
#         chat_history = list(messages.find({
#             "$or": [
#                 {"sender_id": user_id, "receiver_id": peer_id},
#                 {"sender_id": peer_id, "receiver_id": user_id}
#             ]
#         }).sort("timestamp", 1))

#         # Format the response
#         formatted_messages = []
#         for msg in chat_history:
#             formatted_msg = {
#                 "_id": str(msg["_id"]),
#                 "sender_id": msg["sender_id"],
#                 "receiver_id": msg["receiver_id"],
#                 "timestamp": msg["timestamp"].isoformat()
#             }
            
#             # Handle different message formats (encrypted vs plain)
#             if msg.get("message_type") == "encrypted":
#                 formatted_msg.update({
#                     "message_type": "encrypted",
#                     "ciphertext": msg.get("ciphertext"),
#                     "encrypted_message": msg.get("encrypted_message"),
#                     "iv": msg.get("iv")
#                 })
#             else:
#                 # Legacy format or plain message
#                 formatted_msg["message"] = msg.get("message", "")
                
#             formatted_messages.append(formatted_msg)

#         return JSONResponse(content=formatted_messages)
        
#     except Exception as e:
#         print(f"❌ Error fetching chat messages: {e}")
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail="Failed to fetch messages")

# from fastapi.responses import JSONResponse

# @chatRouter.get("/messages/{peer_id}")
# async def get_chat_messages(peer_id: str, user = Depends(get_current_user)):
#     user_id = str(user["_id"])

#     chat_history = list(messages.find({
#         "$or": [
#             {"sender_id": user_id, "receiver_id": peer_id},
#             {"sender_id": peer_id, "receiver_id": user_id}
#         ]
#     }).sort("timestamp", 1))

#     for msg in chat_history:
#         msg["_id"] = str(msg["_id"])
#         msg["timestamp"] = msg["timestamp"].isoformat()

#     return JSONResponse(content=chat_history)

@chatRouter.websocket("/ws/test")
async def test_websocket(websocket: WebSocket):
    """
    Minimal WebSocket endpoint for testing - NO AUTHENTICATION
    Use this to test if basic WebSocket functionality works
    """
    try:
        print("🧪 Test WebSocket: Accepting connection...")
        await websocket.accept()
        print("🧪 Test WebSocket: Connection accepted!")
        
        await websocket.send_text("STATUS:✅ Test connection successful!")
        
        while True:
            try:
                data = await websocket.receive_text()
                print(f"🧪 Test WebSocket received: {data}")
                
                # Echo the message back
                await websocket.send_text(f"Echo: {data}")
                
            except WebSocketDisconnect:
                print("🧪 Test WebSocket: Client disconnected")
                break
            except Exception as e:
                print(f"🧪 Test WebSocket error: {e}")
                break
                
    except Exception as e:
        print(f"🧪 Test WebSocket setup error: {e}")
        try:
            await websocket.close(code=1011, reason=str(e))
        except:
            pass
