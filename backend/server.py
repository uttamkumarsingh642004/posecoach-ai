import os
import time
import jwt
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from datetime import datetime

STREAM_API_KEY = os.getenv("STREAM_API_KEY", "")
STREAM_API_SECRET = os.getenv("STREAM_API_SECRET", "")
PORT = int(os.getenv("PORT", 8000))
CALL_ID = "posecoach-session"

app = FastAPI(title="PoseCoach AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TokenRequest(BaseModel):
    userId: str
    userName: str

@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

@app.post("/token")
async def get_token(request: TokenRequest):
    try:
        payload = {
            "user_id": request.userId,
            "iss": "stream-video-python",
            "sub": f"user/{request.userId}",
            "iat": int(time.time()),
            "exp": int(time.time()) + 3600,
        }
        token = jwt.encode(payload, STREAM_API_SECRET, algorithm="HS256")
        return {
            "token": token,
            "apiKey": STREAM_API_KEY,
            "callId": CALL_ID,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=PORT)