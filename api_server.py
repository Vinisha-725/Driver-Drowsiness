from flask import Flask, jsonify, Response, request
from flask_cors import CORS
import cv2
import numpy as np
import base64
import json
import threading
import time
from vision_module import compute_ear_from_frame, EAR_THRESHOLD, DROWSY_FRAMES_THRESHOLD, ALERT_COOLDOWN

app = Flask(__name__)
CORS(app)

# Global variables for camera and detection state
camera = None
detection_thread = None
detection_active = False
current_ear = 0.25
drowsy_frame_count = 0
last_alert_time = 0
alert_triggered = False
ear_history = []
fps = 0
prev_time = 0

def camera_thread():
    """Background thread for camera processing"""
    global camera, detection_active, current_ear, drowsy_frame_count, last_alert_time, alert_triggered, ear_history, fps, prev_time
    
    if camera is None:
        camera = cv2.VideoCapture(0)
        if not camera.isOpened():
            print("❌ Failed to open camera")
            return
    
    print("🎥 Camera thread started")
    
    while detection_active:
        ret, frame = camera.read()
        if not ret:
            continue
        
        # Resize and flip for better UX
        frame = cv2.resize(frame, (640, 480))
        frame = cv2.flip(frame, 1)
        
        # Get EAR from vision module
        ear, left_eye, right_eye = compute_ear_from_frame(frame)
        
        if ear is not None:
            # Smooth EAR with history
            ear_history.append(ear)
            if len(ear_history) > 10:
                ear_history.pop(0)
            
            smooth_ear = sum(ear_history) / len(ear_history)
            current_ear = smooth_ear
            
            # Drowsiness detection logic
            if smooth_ear < EAR_THRESHOLD:
                drowsy_frame_count += 1
                
                # Trigger alert if threshold reached
                if drowsy_frame_count >= DROWSY_FRAMES_THRESHOLD:
                    current_time = time.time()
                    
                    # Continuous alert - trigger every cooldown period while EAR is low
                    if current_time - last_alert_time >= ALERT_COOLDOWN:
                        alert_triggered = True
                        last_alert_time = current_time
                        print("🚨 CONTINUOUS DROWSINESS ALERT! Driver appears to be asleep!")
                    else:
                        alert_triggered = True  # Keep alert state active between beeps
                else:
                    alert_triggered = False
            else:
                # Reset counter when eyes are open
                if drowsy_frame_count > 0:
                    drowsy_frame_count = max(0, drowsy_frame_count - 2)
                alert_triggered = False
        else:
            current_ear = 0.25
            drowsy_frame_count = 0
            alert_triggered = False
        
        # Calculate FPS
        curr_time = time.time()
        if prev_time != 0:
            fps = 1 / (curr_time - prev_time)
    # Small delay to prevent excessive CPU usage
        time.sleep(0.02)  # ~50 FPS for smoother processing

@app.route('/api/start_camera', methods=['POST'])
def start_camera():
    """Start the camera and detection thread"""
    global detection_active, detection_thread
    
    if detection_active:
        return jsonify({'status': 'already_active'})
    
    detection_active = True
    detection_thread = threading.Thread(target=camera_thread)
    detection_thread.daemon = True
    detection_thread.start()
    
    return jsonify({'status': 'started'})

@app.route('/api/stop_camera', methods=['POST'])
def stop_camera():
    """Stop the camera and detection thread"""
    global detection_active, camera
    
    detection_active = False
    
    if camera:
        camera.release()
        camera = None
    
    return jsonify({'status': 'stopped'})

@app.route('/api/get_ear', methods=['GET'])
def get_ear():
    """Get current EAR value and detection status"""
    return jsonify({
        'ear': current_ear,
        'threshold': EAR_THRESHOLD,
        'drowsy_frames': drowsy_frame_count,
        'alert_triggered': alert_triggered,
        'fps': fps,
        'is_detecting': detection_active
    })

@app.route('/api/get_frame', methods=['GET'])
def get_frame():
    """Get current camera frame as base64"""
    if camera is None or not detection_active:
        return jsonify({'error': 'Camera not active'})
    
    ret, frame = camera.read()
    if not ret:
        return jsonify({'error': 'Failed to capture frame'})
    
    # Resize and flip
    frame = cv2.resize(frame, (640, 480))
    frame = cv2.flip(frame, 1)
    
    # Get EAR and draw overlays
    ear, left_eye, right_eye = compute_ear_from_frame(frame)
    
    if ear is not None:
        # Draw EAR text (no eye contours)
        color = (0, 255, 0) if ear >= EAR_THRESHOLD else (0, 0, 255)
        cv2.putText(frame, f"EAR: {ear:.3f}", (10, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        
        # Draw status
        if alert_triggered:
            cv2.putText(frame, "ALERT: WAKE UP!", (150, 100), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 3)
        elif drowsy_frame_count > 5:
            cv2.putText(frame, "WARNING: DROWSY!", (200, 50), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 165, 0), 2)
    
    # Encode frame as JPEG with lower quality for faster transmission
    encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 70]  # Reduced quality
    _, buffer = cv2.imencode('.jpg', frame, encode_param)
    frame_base64 = base64.b64encode(buffer).decode('utf-8')
    
    return jsonify({
        'frame': frame_base64,
        'ear': ear if ear is not None else 0.25,
        'alert_triggered': alert_triggered
    })

@app.route('/api/calibrate_baseline', methods=['POST'])
def calibrate_baseline():
    """Calibrate baseline EAR (simplified version)"""
    # For now, return a default baseline
    # In a real implementation, this would collect samples over time
    return jsonify({
        'baseline': 0.25,
        'threshold': EAR_THRESHOLD,
        'status': 'calibrated'
    })

@app.route('/api/status', methods=['GET'])
def get_status():
    """Get overall system status"""
    return jsonify({
        'camera_active': detection_active,
        'camera_available': camera is not None and camera.isOpened() if camera else False,
        'current_ear': current_ear,
        'threshold': EAR_THRESHOLD,
        'fps': fps,
        'drowsy_frames': drowsy_frame_count,
        'alert_triggered': alert_triggered
    })

if __name__ == '__main__':
    print("🚀 Starting Driver Safety API Server...")
    print("📡 API will be available at http://localhost:8080")
    print("🎥 Camera endpoints:")
    print("   POST /api/start_camera - Start camera")
    print("   POST /api/stop_camera - Stop camera")
    print("   GET  /api/get_ear - Get EAR value")
    print("   GET  /api/get_frame - Get camera frame")
    print("   GET  /api/status - Get system status")
    
    app.run(host='0.0.0.0', port=8080, debug=False, threaded=True)
