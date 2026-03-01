import asyncio
import logging
import os
from dotenv import load_dotenv
load_dotenv()

from vision_agents.core import User, Agent
from vision_agents.core.agents import AgentLauncher
from vision_agents.plugins import getstream, gemini, elevenlabs, deepgram, ultralytics

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CALL_ID = "posecoach-session"

async def create_agent(**kwargs) -> Agent:
    agent = Agent(
        edge=getstream.Edge(call_id=CALL_ID),
        agent_user=User(name="Coach Alex", id="coach-alex"),
        instructions=open("instructions.md").read(),
        llm=gemini.Realtime(fps=5),
        tts=elevenlabs.TTS(),
        stt=deepgram.STT(),
        processors=[
            ultralytics.YOLOPoseProcessor(
                model_path="yolo11n-pose.pt",
                device="cpu",
            )
        ],
    )
    return agent

if __name__ == "__main__":
    launcher = AgentLauncher(create_agent)
    launcher.start()