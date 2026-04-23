import cv2
import mediapipe as mp
import numpy as np
from scipy.spatial import distance
import time


# MediaPipe setup
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(refine_landmarks=True)


# Eye landmark indices
LEFT_EYE = [33, 160, 158, 133, 153, 144]
RIGHT_EYE = [362, 385, 387, 263, 373, 380]


# Convert normalized landmarks → pixel coordinates
def get_eye_points(landmarks, indices, w, h):
    points = []
    for i in indices:
        x = int(landmarks[i].x * w)
        y = int(landmarks[i].y * h)
        points.append((x, y))
    return points


# Eye Aspect Ratio
def EAR(eye):
    A = distance.euclidean(eye[1], eye[5])
    B = distance.euclidean(eye[2], eye[4])
    C = distance.euclidean(eye[0], eye[3])
    return (A + B) / (2.0 * C)


# Integration-ready function
def compute_ear_from_frame(frame):
    h, w, _ = frame.shape
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    results = face_mesh.process(rgb)

    if not results.multi_face_landmarks:
        return None, None, None

    face_landmarks = results.multi_face_landmarks[0]
    landmarks = face_landmarks.landmark

    left_eye = get_eye_points(landmarks, LEFT_EYE, w, h)
    right_eye = get_eye_points(landmarks, RIGHT_EYE, w, h)

    leftEAR = EAR(left_eye)
    rightEAR = EAR(right_eye)
    ear = (leftEAR + rightEAR) / 2.0

    return ear, left_eye, right_eye


# Webcam
cap = cv2.VideoCapture(0)

ear_history = []
prev_time = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Resize + flip (better UX + performance)
    frame = cv2.resize(frame, (640, 480))
    frame = cv2.flip(frame, 1)

    # Get EAR + eye points
    ear, left_eye, right_eye = compute_ear_from_frame(frame)

    if ear is not None:

        # Smooth EAR
        ear_history.append(ear)
        if len(ear_history) > 10:
            ear_history.pop(0)

        smooth_ear = sum(ear_history) / len(ear_history)

        # Draw eye contours
        cv2.polylines(frame, [np.array(left_eye)], True, (0, 255, 0), 1)
        cv2.polylines(frame, [np.array(right_eye)], True, (0, 255, 0), 1)

        # Display EAR
        cv2.putText(frame, f"EAR: {smooth_ear:.2f}", (10, 460),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

    else:
        cv2.putText(frame, "No face", (10, 460),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)

    # FPS calculation
    curr_time = time.time()
    fps = 1 / (curr_time - prev_time) if prev_time != 0 else 0
    prev_time = curr_time

    cv2.putText(frame, f"FPS: {int(fps)}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)

    cv2.imshow("Drowsiness Detection - Vision Module", frame)

    if cv2.waitKey(1) == 27:
        break

cap.release()
cv2.destroyAllWindows()