import numpy as np


def calculate_angle(a, b, c):
    """Calculate angle at point b given three 2D points a, b, c."""
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)

    ba = a - b
    bc = c - b

    cosine = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-6)
    angle = np.degrees(np.arccos(np.clip(cosine, -1.0, 1.0)))
    return angle


# YOLO11 keypoint indices
NOSE = 0
L_SHOULDER, R_SHOULDER = 5, 6
L_ELBOW, R_ELBOW = 7, 8
L_WRIST, R_WRIST = 9, 10
L_HIP, R_HIP = 11, 12
L_KNEE, R_KNEE = 13, 14
L_ANKLE, R_ANKLE = 15, 16


def score_squat(keypoints):
    """
    Score squat form 0-100.
    Ideal: knee angle 80-100 degrees at bottom, back straight.
    """
    errors = []
    score = 100

    try:
        # Left knee angle (hip - knee - ankle)
        l_knee_angle = calculate_angle(
            keypoints[L_HIP], keypoints[L_KNEE], keypoints[L_ANKLE]
        )
        # Right knee angle
        r_knee_angle = calculate_angle(
            keypoints[R_HIP], keypoints[R_KNEE], keypoints[R_ANKLE]
        )
        avg_knee_angle = (l_knee_angle + r_knee_angle) / 2

        # Hip angle (shoulder - hip - knee)
        l_hip_angle = calculate_angle(
            keypoints[L_SHOULDER], keypoints[L_HIP], keypoints[L_KNEE]
        )
        r_hip_angle = calculate_angle(
            keypoints[R_SHOULDER], keypoints[R_HIP], keypoints[R_KNEE]
        )
        avg_hip_angle = (l_hip_angle + r_hip_angle) / 2

        # Score knee depth
        if avg_knee_angle > 160:
            # Standing — not squatting yet
            score -= 10
        elif avg_knee_angle < 60:
            errors.append("Too deep — stop before knees hurt")
            score -= 20
        elif 80 <= avg_knee_angle <= 110:
            pass  # Perfect depth
        else:
            score -= 10

        # Score back posture (hip angle should be 45-90 when squatting)
        if avg_hip_angle < 40:
            errors.append("Leaning too far forward")
            score -= 25
        elif avg_hip_angle > 100 and avg_knee_angle < 140:
            errors.append("Keep chest up")
            score -= 15

        # Check knee alignment (knees should not cave inward)
        l_knee_x = keypoints[L_KNEE][0]
        r_knee_x = keypoints[R_KNEE][0]
        l_ankle_x = keypoints[L_ANKLE][0]
        r_ankle_x = keypoints[R_ANKLE][0]

        if abs(l_knee_x - l_ankle_x) > 40:
            errors.append("Left knee caving inward")
            score -= 20
        if abs(r_knee_x - r_ankle_x) > 40:
            errors.append("Right knee caving inward")
            score -= 20

    except Exception:
        pass

    return max(0, score), errors


def score_pushup(keypoints):
    """
    Score pushup form 0-100.
    Ideal: body straight, elbow angle 80-100 at bottom.
    """
    errors = []
    score = 100

    try:
        # Elbow angle (shoulder - elbow - wrist)
        l_elbow_angle = calculate_angle(
            keypoints[L_SHOULDER], keypoints[L_ELBOW], keypoints[L_WRIST]
        )
        r_elbow_angle = calculate_angle(
            keypoints[R_SHOULDER], keypoints[R_ELBOW], keypoints[R_WRIST]
        )
        avg_elbow_angle = (l_elbow_angle + r_elbow_angle) / 2

        # Hip sag check (hip should be inline with shoulder and ankle)
        l_body_angle = calculate_angle(
            keypoints[L_SHOULDER], keypoints[L_HIP], keypoints[L_ANKLE]
        )
        r_body_angle = calculate_angle(
            keypoints[R_SHOULDER], keypoints[R_HIP], keypoints[R_ANKLE]
        )
        avg_body_angle = (l_body_angle + r_body_angle) / 2

        # Score elbow depth
        if avg_elbow_angle < 60:
            errors.append("Too low — ease up on depth")
            score -= 15
        elif 80 <= avg_elbow_angle <= 110:
            pass  # Perfect
        elif avg_elbow_angle > 160:
            score -= 5  # Just standing/up position

        # Score body alignment
        if avg_body_angle < 150:
            errors.append("Hips sagging — keep body straight")
            score -= 30
        elif avg_body_angle > 200:
            errors.append("Hips too high — lower them")
            score -= 20

    except Exception:
        pass

    return max(0, score), errors


def score_lunge(keypoints):
    """
    Score lunge form 0-100.
    Ideal: front knee 90 degrees, back knee near floor.
    """
    errors = []
    score = 100

    try:
        # Front knee angle
        l_knee_angle = calculate_angle(
            keypoints[L_HIP], keypoints[L_KNEE], keypoints[L_ANKLE]
        )
        r_knee_angle = calculate_angle(
            keypoints[R_HIP], keypoints[R_KNEE], keypoints[R_ANKLE]
        )

        # The front knee is the one more bent
        front_knee = min(l_knee_angle, r_knee_angle)

        # Torso upright check
        torso_angle = calculate_angle(
            keypoints[L_SHOULDER], keypoints[L_HIP], keypoints[L_KNEE]
        )

        if front_knee > 120:
            errors.append("Lunge deeper — bend front knee more")
            score -= 20
        elif front_knee < 70:
            errors.append("Front knee too far forward over toes")
            score -= 20

        if torso_angle < 150:
            errors.append("Keep torso upright")
            score -= 25

    except Exception:
        pass

    return max(0, score), errors


EXERCISE_SCORERS = {
    "squat": score_squat,
    "pushup": score_pushup,
    "lunge": score_lunge,
}


def score_exercise(exercise_name, keypoints):
    """Main entry point — score any exercise."""
    scorer = EXERCISE_SCORERS.get(exercise_name, score_squat)
    return scorer(keypoints)