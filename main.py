import cv2
import time
from vision_module import compute_ear_from_frame
import winsound

# ---------------- SETTINGS ----------------
EAR_THRESHOLD = 0.25   # slightly increased for reliability
FRAME_LIMIT = 5      # reduced for testing

ALARM_COOLDOWN = 1
FRAME_SKIP = 1
# ------------------------------------------

COUNTER = 0
LAST_ALARM_TIME = 0

ear_history = []

cap = cv2.VideoCapture(0)

prev_time = 0
frame_count = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.resize(frame, (640, 480))
    frame = cv2.flip(frame, 1)

    frame_count += 1

    # Frame skipping
    if frame_count % FRAME_SKIP != 0:
        cv2.imshow("Driver Drowsiness Detection", frame)
        if cv2.waitKey(1) == 27:
            break
        continue

    # Get EAR
    ear, left_eye, right_eye = compute_ear_from_frame(frame)

    if ear is not None:

        # Debug print
        print("SMOOTH_EAR:", round(smooth_ear, 3), "COUNTER:", COUNTER)

        # Smooth EAR
        '''ear_history.append(ear)
        if len(ear_history) > 10:
            ear_history.pop(0)

        smooth_ear = sum(ear_history) / len(ear_history)'''

        # Threshold check - changing smooth_ear to ear for testing
        if ear < EAR_THRESHOLD:
            COUNTER += 1
        else:
            COUNTER = 0

        if COUNTER >= 3:
            print("COUNTER:", COUNTER)  

        # Drowsiness detection
        if COUNTER >= FRAME_LIMIT:

            # 🔹 Step 3: FORCE TEST ALERT DISPLAY
            cv2.putText(frame, "TEST ALERT", (100, 100),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 0), 3)

            # 🔹 Actual alert
            cv2.putText(frame, "DROWSINESS ALERT!", (80, 160),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)

            print("DROWSY TRIGGERED")

            current_time = time.time()

            if (current_time - LAST_ALARM_TIME) > ALARM_COOLDOWN:
                LAST_ALARM_TIME = current_time
                winsound.Beep(2500, 500)

    else:
        COUNTER = 0
        cv2.putText(frame, "No face detected", (20, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

    # FPS
    curr_time = time.time()
    fps = 1 / (curr_time - prev_time) if prev_time != 0 else 0
    prev_time = curr_time

    cv2.putText(frame, f"FPS: {int(fps)}", (20, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)

    cv2.imshow("Driver Drowsiness Detection", frame)

    if cv2.waitKey(1) == 27:
        break

cap.release()
cv2.destroyAllWindows()