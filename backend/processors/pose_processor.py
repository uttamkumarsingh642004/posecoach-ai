import asyncio
import numpy as np
from ultralytics import YOLO
from exercise_rules import score_exercise

# Keypoint indices
L_HIP, R_HIP = 11, 12
L_KNEE, R_KNEE = 13, 14

# Callback to broadcast data to WebSocket clients
_broadcast_callback = None


def set_broadcast_callback(callback):
    global _broadcast_callback
    _broadcast_callback = callback


class PoseCoachProcessor:
    """
    Processes video frames using YOLO11 pose detection.
    Scores exercise form and counts reps.
    """

    def __init__(self, model_path="yolo11n-pose.pt", device="cpu"):
        print(f"Loading YOLO model: {model_path} on {device}")
        self.model = YOLO(model_path)
        self.device = device
        self.exercise = "squat"

        # Rep counting state
        self.rep_count = 0
        self.rep_state = "up"  # "up" or "down"
        self.frame_count = 0

    def set_exercise(self, exercise_name):
        """Switch exercise and reset rep counter."""
        self.exercise = exercise_name
        self.rep_count = 0
        self.rep_state = "up"
        print(f"Exercise changed to: {exercise_name}")

    def _count_reps(self, keypoints):
        """Count reps by tracking knee angle oscillation."""
        try:
            l_hip = keypoints[L_HIP]
            l_knee = keypoints[L_KNEE]

            # Simple vertical position tracking
            knee_y = l_knee[1]
            hip_y = l_hip[1]

            # When knee is significantly below hip = "down" position
            if knee_y > hip_y * 1.15:
                if self.rep_state == "up":
                    self.rep_state = "down"
            else:
                if self.rep_state == "down":
                    self.rep_state = "up"
                    self.rep_count += 1

        except Exception:
            pass

    def process_frame(self, frame_image):
        """
        Process a single frame image (numpy array).
        Returns dict with score, reps, errors, keypoints.
        """
        import time
        start = time.time()

        result = {
            "score": 0,
            "reps": self.rep_count,
            "errors": [],
            "keypoints": [],
            "frameTime": 0,
            "personDetected": False,
        }

        try:
            results = self.model(frame_image, device=self.device, verbose=False)

            if results and results[0].keypoints is not None:
                kps = results[0].keypoints.xy.cpu().numpy()

                if len(kps) > 0 and kps[0].shape[0] == 17:
                    keypoints = kps[0]  # First person detected
                    result["personDetected"] = True
                    result["keypoints"] = keypoints.tolist()

                    # Score form
                    score, errors = score_exercise(self.exercise, keypoints)
                    result["score"] = score
                    result["errors"] = errors

                    # Count reps
                    self._count_reps(keypoints)
                    result["reps"] = self.rep_count

        except Exception as e:
            print(f"Frame processing error: {e}")

        result["frameTime"] = round((time.time() - start) * 1000, 1)

        # Broadcast to WebSocket clients
        if _broadcast_callback:
            asyncio.create_task(_broadcast_callback(result))

        return result