import cv2
import mediapipe as mp
import numpy as np
import math

# MediaPipe setup - create fresh instance
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(refine_landmarks=True)

# Eye landmark indices
LEFT_EYE = [33, 160, 158, 133, 153, 144]
RIGHT_EYE = [362, 385, 387, 263, 373, 380]

def get_eye_points(landmarks, indices, w, h):
    """Convert normalized landmarks to pixel coordinates"""
    points = []
    for i in indices:
        x = int(landmarks[i].x * w)
        y = int(landmarks[i].y * h)
        points.append((x, y))
    return points

def euclidean_distance(p1, p2):
    """Manual euclidean distance calculation"""
    return math.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

def EAR(eye):
    """Calculate Eye Aspect Ratio"""
    A = euclidean_distance(eye[1], eye[5])
    B = euclidean_distance(eye[2], eye[4])
    C = euclidean_distance(eye[0], eye[3])
    ear = (A + B) / (2.0 * C)
    return ear

def compute_ear_from_frame(frame):
    """Clean function to compute EAR from frame without blocking"""
    try:
        h, w, _ = frame.shape
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Process with MediaPipe
        results = face_mesh.process(rgb)
        
        if not results.multi_face_landmarks:
            print("❌ No face detected")
            return None, None, None
        
        face_landmarks = results.multi_face_landmarks[0]
        landmarks = face_landmarks.landmark
        
        # Get eye points
        left_eye = get_eye_points(landmarks, LEFT_EYE, w, h)
        right_eye = get_eye_points(landmarks, RIGHT_EYE, w, h)
        
        # Calculate EAR for both eyes
        leftEAR = EAR(left_eye)
        rightEAR = EAR(right_eye)
        ear = (leftEAR + rightEAR) / 2.0
        
        print(f"👁️ EAR: {ear:.3f} (Left: {leftEAR:.3f}, Right: {rightEAR:.3f})")
        return ear, left_eye, right_eye
        
    except Exception as e:
        print(f"❌ Error in compute_ear_from_frame: {e}")
        return None, None, None
