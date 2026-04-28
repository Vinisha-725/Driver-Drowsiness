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
latest_frame = None  # Shared frame buffer
frame_lock = threading.Lock()  # Lock for thread-safe frame access

def camera_thread():
    """Background thread for camera processing"""
    global camera, detection_active, current_ear, drowsy_frame_count, last_alert_time, alert_triggered, ear_history, fps, prev_time, latest_frame
    
    if camera is None:
        camera = cv2.VideoCapture(0)
        
        # Wait a moment for camera to initialize
        time.sleep(0.5)
        
        if not camera.isOpened():
            print("❌ Failed to open camera")
            return
        
        # Standard camera settings for compatibility
        camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        camera.set(cv2.CAP_PROP_FPS, 30)
        camera.set(cv2.CAP_PROP_AUTOFOCUS, 1)
        camera.set(cv2.CAP_PROP_AUTO_EXPOSURE, 1)
        camera.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Reduce buffer for lower latency
        
        # Verify settings were applied
        actual_width = camera.get(cv2.CAP_PROP_FRAME_WIDTH)
        actual_height = camera.get(cv2.CAP_PROP_FRAME_HEIGHT)
        print(f"📷 Camera initialized: {actual_width}x{actual_height}")
        
        # Test read a frame to make sure it works
        ret, test_frame = camera.read()
        if ret:
            print(f"✅ Test frame captured: {test_frame.shape}")
        else:
            print("❌ Test frame capture failed")
    
    print("🎥 Camera thread started (optimized)")
    
    frame_count = 0
    while detection_active:
        try:
            ret, frame = camera.read()
            if not ret:
                print("❌ Failed to read frame from camera")
                continue
            
            # Frame is already resized by camera settings, just flip
            frame = cv2.flip(frame, 1)
            frame_count += 1
            
            # Log every 60 frames to reduce overhead
            if frame_count % 60 == 0:
                print(f"📹 Processed {frame_count} frames, detection_active: {detection_active}")
                
        except Exception as e:
            print(f"Camera read error: {e}")
            continue
        
        # Store frame in shared buffer for get_frame endpoint (limit memory usage)
        with frame_lock:
            # Clear previous frame to prevent memory buildup
            if latest_frame is not None:
                del latest_frame
            latest_frame = frame.copy()
        
        # Get EAR from vision module
        ear, left_eye, right_eye = compute_ear_from_frame(frame)
        
        if ear is not None:
            # Smooth EAR with history (limit history size)
            ear_history.append(ear)
            if len(ear_history) > 5:  # Reduced from 10 to 5 for less memory
                ear_history.pop(0)
            
            smooth_ear = sum(ear_history) / len(ear_history)
            current_ear = smooth_ear
            # print(f"📊 EAR computed: {ear:.3f} -> {smooth_ear:.3f}")  # Disabled for performance
            
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
                drowsy_frame_count = max(0, drowsy_frame_count - 1)
                alert_triggered = False
        else:
            print("⚠️ No face detected for EAR computation")
            current_ear = 0.25  # Default value when no face
            drowsy_frame_count = 0
            alert_triggered = False
        
        # Calculate FPS
        curr_time = time.time()
        if prev_time != 0:
            fps = 1 / (curr_time - prev_time)
        prev_time = curr_time
        
        # Optimized delay for performance
        time.sleep(0.1)  # ~10 FPS processing capability (major lag reduction)

@app.route('/api/start_camera', methods=['POST'])
def start_camera():
    """Start the camera and detection thread"""
    global detection_active, detection_thread
    
    if detection_active:
        print("📷 Camera already active")
        return jsonify({'status': 'already_active'})
    
    print("🚀 Starting camera and detection thread...")
    detection_active = True
    detection_thread = threading.Thread(target=camera_thread)
    detection_thread.start()
    
    return jsonify({'status': 'started'})

@app.route('/api/stop_camera', methods=['POST'])
def stop_camera():
    """Stop the camera and detection thread"""
    global detection_active, camera, latest_frame
    
    detection_active = False
    
    # Clear shared frame buffer
    with frame_lock:
        latest_frame = None
    
    # Wait a moment for thread to finish
    time.sleep(0.1)
    
    if camera:
        try:
            camera.release()
        except Exception as e:
            print(f"❌ Error releasing camera: {e}")
        finally:
            camera = None
    
    return jsonify({'status': 'stopped'})

@app.route('/api/get_ear', methods=['GET'])
def get_ear():
    """Get current EAR value and detection status"""
    response_data = {
        'ear': current_ear,
        'threshold': EAR_THRESHOLD,
        'drowsy_frames': drowsy_frame_count,
        'alert_triggered': alert_triggered,
        'fps': fps,
        'is_detecting': detection_active
    }
    # print(f"📊 EAR API Response: {response_data}")  # Disabled for performance
    return jsonify(response_data)

@app.route('/api/get_frame', methods=['GET'])
def get_frame():
    """Get current camera frame as base64"""
    if camera is None or not detection_active:
        return jsonify({'error': 'Camera not active'})
    
    # Use shared frame buffer to avoid camera conflicts
    with frame_lock:
        if latest_frame is None:
            return jsonify({'error': 'No frame available yet'})
        
        # Use frame directly without copying to reduce memory usage
        frame = latest_frame
    
    try:
        # Get EAR and draw overlays
        ear, left_eye, right_eye = compute_ear_from_frame(frame)
    except Exception as e:
        # Return frame without EAR data if computation fails
        ear = None
        left_eye = None
        right_eye = None
    
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
    
    # Encode frame as JPEG with optimized quality for speed
    encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 30]  # Very low quality for maximum speed
    _, buffer = cv2.imencode('.jpg', frame, encode_param)
    frame_base64 = base64.b64encode(buffer).decode('utf-8')
    
    # Skip debug prints for performance
    # print(f"📦 Frame encoded: {len(frame_base64)} bytes")
    
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
