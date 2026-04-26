import cv2
import threading
import time
import json
import http.server
import socketserver
from urllib.parse import urlparse, parse_qs
from vision_module import compute_ear_from_frame

# Global variables
current_ear = 0.25
face_detected = False
camera_active = False
cap = None
detection_thread = None

class APIHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/status':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'status': 'running',
                'camera_active': camera_active,
                'current_ear': current_ear,
                'face_detected': face_detected,
                'timestamp': time.time()
            }
            self.wfile.write(json.dumps(response).encode())
            
        elif self.path == '/api/eye-data':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'type': 'eye_data',
                'ear': round(current_ear, 3),
                'face_detected': face_detected,
                'camera_active': camera_active,
                'timestamp': time.time()
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        global camera_active, cap, detection_thread
        
        if self.path == '/api/camera/start':
            if not camera_active:
                try:
                    print("📹 Starting camera...")
                    cap = cv2.VideoCapture(0)
                    
                    if cap.isOpened():
                        print("✅ Camera opened successfully")
                        camera_active = True
                        detection_thread = threading.Thread(target=process_camera, daemon=True)
                        detection_thread.start()
                        
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.end_headers()
                        
                        response = {
                            'status': 'success',
                            'message': 'Camera started with MediaPipe detection'
                        }
                        self.wfile.write(json.dumps(response).encode())
                    else:
                        print("❌ Failed to open camera")
                        self.send_response(500)
                        self.send_header('Content-type', 'application/json')
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.end_headers()
                        
                        response = {
                            'status': 'error',
                            'message': 'Could not open camera'
                        }
                        self.wfile.write(json.dumps(response).encode())
                        
                except Exception as e:
                    print(f"❌ Camera error: {e}")
                    self.send_response(500)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    
                    response = {
                        'status': 'error',
                        'message': str(e)
                    }
                    self.wfile.write(json.dumps(response).encode())
            else:
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {
                    'status': 'info',
                    'message': 'Camera already running'
                }
                self.wfile.write(json.dumps(response).encode())
                
        elif self.path == '/api/camera/stop':
            if not camera_active:
                camera_active = False
                if cap:
                    cap.release()
                    cap = None
                print("📹 Camera stopped")
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'status': 'success',
                'message': 'Camera stopped'
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def process_camera():
    global current_ear, face_detected, camera_active, cap
    
    print("🎥 Camera processing started")
    
    # Wait a moment for camera to initialize
    time.sleep(1)
    
    frame_count = 0
    
    while camera_active and cap and cap.isOpened():
        ret, frame = cap.read()
        frame_count += 1
        
        if ret:
            frame = cv2.resize(frame, (640, 480))
            frame = cv2.flip(frame, 1)
            
            # Debug: Save first few frames to check camera is working
            if frame_count <= 3:
                print(f"📹 Frame {frame_count}: {frame.shape} - Processing...")
            
            ear, left_eye, right_eye = compute_ear_from_frame(frame)
            
            if ear is not None:
                current_ear = ear
                face_detected = True
                # Only print every 10th frame to reduce spam
                if frame_count % 10 == 0:
                    print(f"👁️ EAR: {ear:.3f} - Face detected (Frame {frame_count})")
            else:
                current_ear = 0.25
                face_detected = False
                # Only print every 10th frame to reduce spam
                if frame_count % 10 == 0:
                    print(f"❌ No face detected (Frame {frame_count})")
            
            time.sleep(0.1)  # 10 FPS
        else:
            print(f"❌ Failed to read frame {frame_count}")
            time.sleep(0.1)
    
    print("🎥 Camera processing stopped")
    camera_active = False
    if cap:
        cap.release()
        cap = None

if __name__ == '__main__':
    print("🚀 Starting simple HTTP server on http://localhost:5000")
    print("📱 Web app can connect to this server")
    
    with socketserver.TCPServer(("", 5000), APIHandler) as httpd:
        print("✅ Server ready and waiting for connections...")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("🛑 Server stopped by user")
            camera_active = False
            if cap:
                cap.release()
