import cv2
import numpy as np
import time

# Load OpenCV's pre-trained Haar Cascade classifier for face detection
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Initialize webcam
cap = cv2.VideoCapture(0)

print("Camera started. Press 'q' to quit, 'ESC' to force quit")
print("If camera doesn't stop, close the window manually or press Ctrl+C")

try:
    while True:
        # Read frame from webcam
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame")
            break
        
        # Convert frame to grayscale for face detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        # Draw rectangles around faces
        for (x, y, w, h) in faces:
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            cv2.putText(frame, 'Face', (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
        
        # Display the resulting frame
        cv2.imshow('Face Detection - Press Q to Quit', frame)
        
        # Break loop on 'q' or ESC key press
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q') or key == 27:  # 27 is ESC key
            print("Quit key pressed")
            break

except KeyboardInterrupt:
    print("\nKeyboard interrupt received")

finally:
    # Release the capture and destroy all windows
    print("Releasing camera...")
    cap.release()
    cv2.destroyAllWindows()
    
    # Force close any remaining windows
    for i in range(5):
        cv2.waitKey(1)
    
    print("Camera stopped successfully")
