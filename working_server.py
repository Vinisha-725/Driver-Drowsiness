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
        if self.path == '/api/camera/start':
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
            global camera_active, cap
            
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
    
    while camera_active and cap and cap.isOpened():
        ret, frame = cap.read()
        if ret:
            frame = cv2.resize(frame, (640, 480))
            frame = cv2.flip(frame, 1)
            
            ear, left_eye, right_eye = compute_ear_from_frame(frame)
            
            if ear is not None:
                current_ear = ear
                face_detected = True
                print(f"👁️ EAR: {ear:.3f} - Face detected")
            else:
                current_ear = 0.25
                face_detected = False
                print("❌ No face detected")
            
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
