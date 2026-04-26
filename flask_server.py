from flask import Flask, jsonify, render_template_string, Response
from flask_cors import CORS
import cv2
import threading
import time
import json
from vision_module import compute_ear_from_frame

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests

# Global variables for eye detection
current_ear = 0.25
face_detected = False
camera_active = False
cap = None
detection_thread = None

@app.route('/')
def index():
    """Simple status page"""
    return render_template_string("""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Driver Safety Backend</title>
        <style>
            body { font-family: Arial; margin: 40px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
            .status { color: #4CAF50; font-weight: bold; }
            .endpoint { background: #f0f0f0; padding: 10px; margin: 10px 0; border-radius: 5px; font-family: monospace; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚗 Driver Safety Backend</h1>
            <p class="status">✅ Server is running!</p>
            
            <h3>Available Endpoints:</h3>
            <div class="endpoint">GET /api/status - Get current status</div>
            <div class="endpoint">POST /api/camera/start - Start camera</div>
            <div class="endpoint">POST /api/camera/stop - Stop camera</div>
            <div class="endpoint">GET /api/eye-data - Get real-time eye data</div>
            
            <h3>Usage:</h3>
            <p>1. Start camera: POST /api/camera/start</p>
            <p>2. Get eye data: GET /api/eye-data (poll every 100ms)</p>
            <p>3. Stop camera: POST /api/camera/stop</p>
        </div>
    </body>
    </html>
    """)

@app.route('/api/status', methods=['GET'])
def get_status():
    """Get current server status"""
    return jsonify({
        'status': 'running',
        'camera_active': camera_active,
        'current_ear': current_ear,
        'face_detected': face_detected,
        'timestamp': time.time()
    })

@app.route('/api/camera/start', methods=['POST'])
def start_camera():
    """Start the camera for eye detection"""
    global camera_active, cap, detection_thread
    
    if not camera_active:
        try:
            cap = cv2.VideoCapture(0)
            if cap.isOpened():
                camera_active = True
                detection_thread = threading.Thread(target=process_camera, daemon=True)
                detection_thread.start()
                return jsonify({
                    'status': 'success',
                    'message': 'Camera started with MediaPipe detection'
                })
            else:
                return jsonify({
                    'status': 'error',
                    'message': 'Could not open camera'
                }), 500
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500
    else:
        return jsonify({
            'status': 'info',
            'message': 'Camera already running'
        })

@app.route('/api/camera/stop', methods=['POST'])
def stop_camera():
    """Stop the camera"""
    global camera_active, cap
    
    camera_active = False
    if cap:
        cap.release()
        cap = None
    
    return jsonify({
        'status': 'success',
        'message': 'Camera stopped'
    })

@app.route('/api/eye-data', methods=['GET'])
def get_eye_data():
    """Get current eye detection data"""
    return jsonify({
        'type': 'eye_data',
        'ear': round(current_ear, 3),
        'face_detected': face_detected,
        'camera_active': camera_active,
        'timestamp': time.time()
    })

@app.route('/video_feed')
def video_feed():
    """Video streaming route"""
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

def generate_frames():
    """Generate video frames for streaming"""
    global cap, camera_active
    
    while camera_active and cap and cap.isOpened():
        ret, frame = cap.read()
        if ret:
            # Process frame for display
            frame = cv2.resize(frame, (640, 480))
            frame = cv2.flip(frame, 1)
            
            # Add overlay text
            cv2.putText(frame, f"EAR: {current_ear:.3f}", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
            if face_detected:
                cv2.putText(frame, "Face Detected", (10, 60),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            else:
                cv2.putText(frame, "No Face", (10, 60),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            
            # Encode frame
            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()
            
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        else:
            break

def process_camera():
    """Background thread for camera processing"""
    global current_ear, face_detected, camera_active, cap
    
    print("📹 Camera processing started")
    
    while camera_active and cap and cap.isOpened():
        ret, frame = cap.read()
        if ret:
            # Process frame
            frame = cv2.resize(frame, (640, 480))
            frame = cv2.flip(frame, 1)
            
            # Get EAR from MediaPipe
            ear, left_eye, right_eye = compute_ear_from_frame(frame)
            
            if ear is not None:
                current_ear = ear
                face_detected = True
            else:
                current_ear = 0.25
                face_detected = False
            
            time.sleep(0.1)  # 10 FPS
        else:
            time.sleep(0.1)
    
    print("📹 Camera processing stopped")
    camera_active = False
    if cap:
        cap.release()
        cap = None

if __name__ == '__main__':
    print("🚀 Starting Flask server on http://localhost:5000")
    print("📱 Web app can connect to this server")
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
