from flask import Flask, jsonify, render_template_string
from flask_cors import CORS
import cv2
import threading
import time
import json
from vision_module import compute_ear_from_frame

app = Flask(__name__)
CORS(app)

# Global variables
current_ear = 0.25
face_detected = False
camera_active = False
cap = None
detection_thread = None

@app.route('/')
def index():
    return render_template_string('''
    <!DOCTYPE html>
    <html>
    <head><title>Driver Safety Backend</title></head>
    <body>
        <h1>🚗 Driver Safety Backend</h1>
        <p>✅ Server is running on port 5000</p>
        <p>📹 Camera: ''' + ('ACTIVE' if camera_active else 'READY') + '''</p>
    </body>
    </html>
    ''')

@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({
        'status': 'running',
        'camera_active': camera_active,
        'current_ear': current_ear,
        'face_detected': face_detected,
        'timestamp': time.time()
    })

@app.route('/api/camera/start', methods=['POST'])
def start_camera():
    global camera_active, cap, detection_thread
    
    if not camera_active:
        try:
            print("📹 Starting camera...")
            cap = cv2.VideoCapture(0)
            
            if cap.isOpened():
                print("✅ Camera opened successfully")
                camera_active = True
                detection_thread = threading.Thread(target=process_camera, daemon=True)
                detection_thread.start()
                
                return jsonify({
                    'status': 'success',
                    'message': 'Camera started with MediaPipe detection'
                })
            else:
                print("❌ Failed to open camera")
                return jsonify({
                    'status': 'error',
                    'message': 'Could not open camera'
                }), 500
                
        except Exception as e:
            print(f"❌ Camera error: {e}")
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
    global camera_active, cap
    
    camera_active = False
    if cap:
        cap.release()
        cap = None
    print("📹 Camera stopped")
    
    return jsonify({
        'status': 'success',
        'message': 'Camera stopped'
    })

@app.route('/api/eye-data', methods=['GET'])
def get_eye_data():
    return jsonify({
        'type': 'eye_data',
        'ear': round(current_ear, 3),
        'face_detected': face_detected,
        'camera_active': camera_active,
        'timestamp': time.time()
    })

def process_camera():
    global current_ear, face_detected, camera_active, cap
    
    print("🎥 Camera processing started")
    
    while camera_active and cap and cap.isOpened():
        ret, frame = cap.read()
        if ret:
            frame = cv2.resize(frame, (640, 480))
            frame = cv2.flip(frame, 1)
            
            ear, left_eye, right_eye = compute_ear_from_frame(frame)
            
            if ear is not None:
                current_ear = ear
                face_detected = True
            else:
                current_ear = 0.25
                face_detected = False
            
            time.sleep(0.1)  # 10 FPS
        else:
            print("❌ Failed to read frame")
            time.sleep(0.1)
    
    print("🎥 Camera processing stopped")
    camera_active = False
    if cap:
        cap.release()
        cap = None

if __name__ == '__main__':
    print("🚀 Starting Flask server on http://localhost:5000")
    print("📱 Web app can connect to this server")
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
