import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from vision_agents import Agent, User
from vision_agents.plugins import getstream, gemini, elevenlabs, deepgram
from processors.pose_processor import PoseCoachProcessor
from config import (
    STREAM_API_KEY, STREAM_API_SECRET,
    GEMINI_API_KEY, ELEVENLABS_API_KEY, DEEPGRAM_API_KEY
)

# Create the pose processor
pose_processor = PoseCoachProcessor(
    model_path="yolo11n-pose.pt",
    device="cpu"
)

# Build the Vision Agent
agent = Agent(
    edge=getstream.Edge(
        api_key=STREAM_API_KEY,
        api_secret=STREAM_API_SECRET,
    ),
    agent_user=User(name="Coach Alex", id="posecoach-agent"),
    instructions="Read @instructions.md",
    llm=gemini.Realtime(
        api_key=GEMINI_API_KEY,
        fps=10
    ),
    processors=[pose_processor],
    tts=elevenlabs.TTS(api_key=ELEVENLABS_API_KEY),
    stt=deepgram.STT(api_key=DEEPGRAM_API_KEY),
)

if __name__ == "__main__":
    print("Starting PoseCoach AI agent...")
    agent.start()