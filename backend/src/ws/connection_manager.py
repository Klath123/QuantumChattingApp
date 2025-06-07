from fastapi import WebSocket
from typing import Dict
from src.db.main import messages  # Assuming Motor is used here
from datetime import datetime, timezone
import json
import asyncio
from fastapi.websockets import WebSocketState

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.paired_users: Dict[str, str] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        """Connect a user, handling existing connections properly"""
        # If user already has an active connection, close it first
        if user_id in self.active_connections:
            old_ws = self.active_connections[user_id]
            try:
                if old_ws.client_state == WebSocketState.CONNECTED:
                    await old_ws.close(code=1000, reason="New connection established")
            except Exception as e:
                print(f"⚠️ Error closing old connection for {user_id}: {e}")
            finally:
                self.active_connections.pop(user_id, None)
        
        self.active_connections[user_id] = websocket
        print(f"🔗 User {user_id} connected. Active connections: {list(self.active_connections.keys())}")

    def disconnect(self, user_id: str):
        """Disconnect a user and clean up all related data"""
        # Remove from active connections
        websocket = self.active_connections.pop(user_id, None)
        
        if websocket:
            try:
                # Attempt to close the websocket if it's still connected
                if websocket.client_state == WebSocketState.CONNECTED:
                    asyncio.create_task(websocket.close(code=1000, reason="User disconnected"))
            except Exception as e:
                print(f"⚠️ Error closing websocket for {user_id}: {e}")

        # Remove all pairings involving this user
        self.paired_users.pop(user_id, None)
        # Remove reverse pairings
        to_remove = [k for k, v in self.paired_users.items() if v == user_id]
        for k in to_remove:
            self.paired_users.pop(k, None)
        
        print(f"🔌 Disconnected {user_id}. Active: {list(self.active_connections.keys())}")

    def pair_users(self, sender_id: str, receiver_id: str):
        """Pair users for messaging"""
        if sender_id in self.active_connections and receiver_id in self.active_connections:
            self.paired_users[sender_id] = receiver_id
            print(f"👥 Paired: {sender_id} -> {receiver_id}")
            print(f"🔗 All pairings: {self.paired_users}")
        else:
            print(f"❌ Cannot pair users - one or both not connected: {sender_id}, {receiver_id}")

    def is_mutually_paired(self, user1_id: str, user2_id: str) -> bool:
        """Check if two users are mutually paired"""
        mutual = (
            self.paired_users.get(user1_id) == user2_id and
            self.paired_users.get(user2_id) == user1_id
        )
        print(f"🤝 Mutual pairing check {user1_id} <-> {user2_id}: {mutual}")
        return mutual

    async def send_status_message(self, user_id: str, status: str):
        """Send status messages separately from encrypted messages"""
        if user_id not in self.active_connections:
            print(f"❌ User {user_id} not in active connections for status message")
            return False
            
        websocket = self.active_connections[user_id]
        
        try:
            # Check if websocket is still connected
            if websocket.client_state != WebSocketState.CONNECTED:
                print(f"❌ WebSocket for {user_id} is not connected (state: {websocket.client_state})")
                self.disconnect(user_id)
                return False
                
            await websocket.send_text(f"STATUS:{status}")
            print(f"📊 Status sent to {user_id}: {status}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to send status to {user_id}: {e}")
            self.disconnect(user_id)
            return False

    async def send_to_peer(self, sender_id: str, encrypted_payload):
        """Send encrypted message to paired peer with signature support"""
        # Get receiver from payload (more reliable than pairing lookup)
        receiver_id = encrypted_payload.get("to")

        if not receiver_id:
            print(f"❌ No receiver specified in payload from {sender_id}")
            await self.send_status_message(sender_id, "❌ No receiver specified")
            return False

        print(f"📤 Attempting to send from {sender_id} to {receiver_id}")

        # Log signature information
        has_signature = bool(encrypted_payload.get("signature"))
        print(f"📝 Message from {sender_id} has signature: {has_signature}")

        # Check if receiver is online
        if receiver_id not in self.active_connections:
            print(f"❌ Receiver {receiver_id} not in active connections")
            await self.send_status_message(sender_id, f"❌ User {receiver_id} is offline")
            return False

        receiver_ws = self.active_connections[receiver_id]

        # Check if receiver's websocket is still connected
        if receiver_ws.client_state != WebSocketState.CONNECTED:
            print(f"❌ Receiver {receiver_id} websocket is not connected")
            self.disconnect(receiver_id)
            await self.send_status_message(sender_id, f"❌ User {receiver_id} disconnected")
            return False

        try:
            # Send the encrypted payload as JSON string (includes signature if present)
            await receiver_ws.send_text(json.dumps(encrypted_payload))
            print(f"✅ Message sent successfully to {receiver_id}")
            if has_signature:
                print(f"📝 Signature included in message to {receiver_id}")

            # IMPROVED: Save chat to MongoDB with better error handling
            try:
                # Validate required fields before insertion
                required_fields = ["ciphertext", "encryptedMessage", "iv"]
                missing_fields = [field for field in required_fields if not encrypted_payload.get(field)]

                if missing_fields:
                    print(f"⚠️ Missing required fields for DB save: {missing_fields}")
                    # Still continue - message was delivered
                else:
                    # Create the message document with all necessary fields
                    message_doc = {
                        "sender_id": sender_id,
                        "receiver_id": receiver_id,
                        "message_type": "encrypted",
                        "ciphertext": encrypted_payload.get("ciphertext"),
                        "encrypted_message": encrypted_payload.get("encryptedMessage"),  # Note: field name mapping
                        "iv": encrypted_payload.get("iv"),
                        "timestamp": datetime.now(timezone.utc)
                    }

                    # Add signature if present
                    if encrypted_payload.get("signature"):
                        message_doc["signature"] = encrypted_payload.get("signature")
                        print(f"💾 Preparing to save message with signature from {sender_id}")

                    print(f"💾 Attempting to save message doc: {message_doc}")

                    # Insert the message - SYNCHRONOUS call since you're not using Motor
                    result = messages.insert_one(message_doc)

                    if result.inserted_id:
                        print(f"✅ Message saved to database with ID: {result.inserted_id}")
                        if message_doc.get("signature"):
                            print(f"📝 Signature saved to database for message {result.inserted_id}")
                    else:
                        print(f"❌ Failed to save message - no inserted_id returned")

            except Exception as db_error:
                print(f"❌ Database save failed: {db_error}")
                print(f"❌ Error type: {type(db_error)}")
                import traceback
                traceback.print_exc()
                # Don't fail the message delivery if DB save fails

            # Send success status to sender
            await self.send_status_message(sender_id, "✅ Message delivered")
            return True

        except Exception as e:
            print(f"❌ Failed to send to {receiver_id}: {e}")
            await self.send_status_message(sender_id, f"❌ Delivery failed: {str(e)}")

            # Check if the error is due to connection issues
            if "ConnectionClosed" in str(type(e)) or "websocket" in str(e).lower():
                self.disconnect(receiver_id)

            return False

    async def broadcast_user_status(self, user_id: str, status: str):
        """Broadcast user status to all paired users"""
        paired_users = [uid for uid, paired_with in self.paired_users.items() if paired_with == user_id]
        
        for paired_user in paired_users:
            await self.send_status_message(paired_user, f"👤 {user_id} is {status}")

    def get_active_users(self) -> list:
        """Get list of currently active user IDs"""
        return list(self.active_connections.keys())

    def is_user_online(self, user_id: str) -> bool:
        """Check if a specific user is online"""
        if user_id not in self.active_connections:
            return False
        
        websocket = self.active_connections[user_id]
        return websocket.client_state == WebSocketState.CONNECTED

    async def cleanup_stale_connections(self):
        """Clean up connections that are no longer active"""
        stale_users = []
        
        for user_id, websocket in self.active_connections.items():
            if websocket.client_state != WebSocketState.CONNECTED:
                stale_users.append(user_id)
        
        for user_id in stale_users:
            print(f"🧹 Cleaning up stale connection for {user_id}")
            self.disconnect(user_id)

manager = ConnectionManager()