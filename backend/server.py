import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'processors'))

from dotenv import load_dotenv
load_dotenv()

import asyncio
import json
import time
from datetime import datetime
from typing import List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from stream_chat import StreamChat

from config import (
    STREAM_API_KEY, STREAM_API_SECRET,
    PORT, ALLOWED_ORIGINS
)

app = FastAPI(title="PoseCoach AI Backend")

# CORS — allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Track connected WebSocket clients
websocket_clients: List[WebSocket] = []


async def broadcast_pose_data(data: dict):
    """Send pose data to all connected frontend clients."""
    if not websocket_clients:
        return
    message = json.dumps(data)
    disconnected = []
    for client in websocket_clients:
        try:
            await client.send_text(message)
        except Exception:
            disconnected.append(client)
    for client in disconnected:
        websocket_clients.remove(client)


# Give the processor a reference to broadcast function
try:
    from processors.pose_processor import set_broadcast_callback
    set_broadcast_callback(broadcast_pose_data)
except Exception as e:
    print(f"Could not set broadcast callback: {e}")


# ── Request/Response models ──────────────────────────────────

class TokenRequest(BaseModel):
    userId: str
    userName: str


class ExerciseRequest(BaseModel):
    exercise: str


# ── Endpoints ────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


@app.post("/token")
async def get_token(request: TokenRequest):
    """Generate a Stream video token for the frontend user."""
    try:
        client = StreamChat(
            api_key=STREAM_API_KEY,
            api_secret=STREAM_API_SECRET
        )
        token = client.create_token(request.userId)
        return {
            "token": token,
            "apiKey": STREAM_API_KEY
        }
    except Exception as e:
        return {"error": str(e)}, 500


@app.post("/exercise")
async def set_exercise(request: ExerciseRequest):
    """Tell the pose processor which exercise is selected."""
    try:
        from processors.pose_processor import PoseCoachProcessor
        # Update the global processor if agent is running
        from agent import pose_processor
        pose_processor.set_exercise(request.exercise)
        return {"success": True, "exercise": request.exercise}
    except Exception as e:
        print(f"Could not update exercise: {e}")
        return {"success": False, "error": str(e)}


@app.websocket("/ws/pose")
async def websocket_pose(websocket: WebSocket):
    """WebSocket endpoint — streams pose data to frontend in real-time."""
    await websocket.accept()
    websocket_clients.append(websocket)
    print(f"WebSocket client connected. Total: {len(websocket_clients)}")
    try:
        while True:
            # Keep connection alive
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        websocket_clients.remove(websocket)
        print(f"WebSocket client disconnected. Total: {len(websocket_clients)}")


# ── Run ──────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=PORT, reload=True)
