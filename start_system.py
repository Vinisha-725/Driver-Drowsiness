import subprocess
import sys
import time
import threading
import webbrowser
from pathlib import Path

def start_backend():
    """Start the Flask API server"""
    print("🚀 Starting Backend API Server...")
    try:
        subprocess.run([sys.executable, "api_server.py"], check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Backend failed to start: {e}")
    except KeyboardInterrupt:
        print("\n🛑 Backend stopped")

def start_frontend():
    """Start the React frontend"""
    print("🎨 Starting Frontend...")
    frontend_path = Path("frontend")
    if not frontend_path.exists():
        print("❌ Frontend directory not found")
        return
    
    try:
        # Change to frontend directory and run npm dev
        subprocess.run(["npm", "run", "dev"], cwd=str(frontend_path), check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Frontend failed to start: {e}")
    except KeyboardInterrupt:
        print("\n🛑 Frontend stopped")

def main():
    print("🚗 Driver Drowsiness Detection System")
    print("=" * 50)
    
    # Check if dependencies are installed
    print("📦 Checking dependencies...")
    
    try:
        import flask
        import flask_cors
        import cv2
        import mediapipe
        print("✅ Backend dependencies OK")
    except ImportError as e:
        print(f"❌ Missing backend dependency: {e}")
        print("💡 Run: pip install -r requirements.txt")
        return
    
    # Check if frontend dependencies are installed
    frontend_path = Path("frontend")
    node_modules_path = frontend_path / "node_modules"
    if not node_modules_path.exists():
        print("❌ Frontend dependencies not installed")
        print("💡 Run: cd frontend && npm install")
        return
    
    print("✅ Frontend dependencies OK")
    
    print("\n🎯 Choose how to start:")
    print("1. Start Backend Only")
    print("2. Start Frontend Only") 
    print("3. Start Both (Recommended)")
    
    choice = input("\nEnter choice (1-3): ").strip()
    
    if choice == "1":
        start_backend()
    elif choice == "2":
        start_frontend()
    elif choice == "3":
        print("\n🔄 Starting both Backend and Frontend...")
        
        # Start backend in a separate thread
        backend_thread = threading.Thread(target=start_backend, daemon=True)
        backend_thread.start()
        
        # Wait a moment for backend to start
        time.sleep(3)
        
        # Open browser after frontend starts
        def open_browser():
            time.sleep(5)  # Wait for frontend to start
            print("📡 API will be available at http://localhost:8080")
            webbrowser.open("http://localhost:5173")
        
        browser_thread = threading.Thread(target=open_browser, daemon=True)
        browser_thread.start()
        
        # Start frontend in main thread
        start_frontend()
        
    else:
        print("❌ Invalid choice")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
    except Exception as e:
        print(f"❌ Error: {e}")
