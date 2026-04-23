import cv2
import mediapipe as mp
import numpy as np
from scipy.spatial import distance
import time
import winsound

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


# Drowsiness detection parameters
EAR_THRESHOLD = 0.20  # Below this = drowsy (lowered to reduce false positives)
DROWSY_FRAMES_THRESHOLD = 20  # Consecutive frames to trigger alert (increased)
ALERT_COOLDOWN = 5  # Seconds between alerts (increased)

# Webcam
cap = cv2.VideoCapture(0)

ear_history = []
prev_time = 0
drowsy_frame_count = 0
last_alert_time = 0
alert_active = False

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

        # Display EAR with threshold info
        color = (0, 255, 0) if smooth_ear >= EAR_THRESHOLD else (0, 0, 255)
        cv2.putText(frame, f"EAR: {smooth_ear:.2f} (Thresh: {EAR_THRESHOLD})", (10, 460),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
        
        # Show drowsy frame count for debugging
        if drowsy_frame_count > 0:
            cv2.putText(frame, f"Drowsy frames: {drowsy_frame_count}/{DROWSY_FRAMES_THRESHOLD}", (10, 440),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 0), 1)

        # Drowsiness detection logic
        if smooth_ear < EAR_THRESHOLD:
            drowsy_frame_count += 1
            
            # Visual warning when approaching threshold
            if drowsy_frame_count > 5:
                cv2.putText(frame, "WARNING: DROWSY!", (200, 50),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
                
                # Flash red border
                if int(time.time() * 2) % 2 == 0:  # Flash every 0.5 seconds
                    cv2.rectangle(frame, (5, 5), (635, 475), (0, 0, 255), 5)
            
            # Trigger alert if threshold exceeded
            if drowsy_frame_count >= DROWSY_FRAMES_THRESHOLD:
                current_time = time.time()
                if current_time - last_alert_time > ALERT_COOLDOWN:
                    alert_active = True
                    last_alert_time = current_time
                    
                    # Audio alert - multiple beeps for attention
                    try:
                        # Play 3 beeps in sequence
                        for _ in range(3):
                            winsound.Beep(1000, 200)  # 1000Hz for 200ms
                            time.sleep(0.1)  # Small gap between beeps
                    except:
                        # Fallback to system beep if winsound fails
                        for _ in range(3):
                            print('\a')
                            time.sleep(0.1)
                    
                    # Visual alert
                    cv2.putText(frame, "ALERT: WAKE UP!", (150, 100),
                               cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 3)
        else:
            # Reset counter when eyes are open
            if drowsy_frame_count > 0:
                drowsy_frame_count = max(0, drowsy_frame_count - 2)  # Gradual reset
            
            # Show status
            if drowsy_frame_count > 0:
                cv2.putText(frame, f"Recovering... ({drowsy_frame_count})", (200, 50),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 165, 0), 2)

    else:
        cv2.putText(frame, "No face", (10, 460),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
        # Reset drowsy counter when no face detected
        drowsy_frame_count = 0

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