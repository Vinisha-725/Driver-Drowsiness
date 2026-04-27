#!/usr/bin/env python3
"""
Simple camera test script to verify backend camera functionality
Run this separately from the frontend to test camera API endpoints
"""

import requests
import time
import base64
import cv2
import numpy as np
from PIL import Image
import io

API_BASE_URL = "http://localhost:8080/api"

def test_camera_api():
    """Test camera API endpoints"""
    print("🎥 Testing Camera API...")
    print("=" * 50)
    
    # Test 1: Start camera
    print("1. Starting camera...")
    try:
        response = requests.post(f"{API_BASE_URL}/start_camera")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        if response.status_code != 200:
            print("❌ Failed to start camera")
            return False
    except Exception as e:
        print(f"❌ Error starting camera: {e}")
        return False
    
    # Wait for camera to initialize
    print("   Waiting 2 seconds for camera to initialize...")
    time.sleep(2)
    
    # Test 2: Get EAR values
    print("2. Testing EAR endpoint...")
    try:
        response = requests.get(f"{API_BASE_URL}/get_ear")
        print(f"   Status: {response.status_code}")
        ear_data = response.json()
        print(f"   EAR Data: {ear_data}")
        
        if response.status_code != 200:
            print("❌ Failed to get EAR data")
            return False
    except Exception as e:
        print(f"❌ Error getting EAR data: {e}")
        return False
    
    # Test 3: Get camera frames
    print("3. Testing frame endpoint...")
    try:
        response = requests.get(f"{API_BASE_URL}/get_frame")
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            frame_data = response.json()
            if 'frame' in frame_data:
                print(f"   Frame size: {len(frame_data['frame'])} bytes")
                
                # Try to decode the frame
                try:
                    frame_bytes = base64.b64decode(frame_data['frame'])
                    frame_array = np.frombuffer(frame_bytes, dtype=np.uint8)
                    frame = cv2.imdecode(frame_array, cv2.IMREAD_COLOR)
                    
                    if frame is not None:
                        print(f"   Frame shape: {frame.shape}")
                        print("   ✅ Frame decoded successfully")
                        
                        # Save a test frame
                        cv2.imwrite("test_frame.jpg", frame)
                        print("   📸 Test frame saved as 'test_frame.jpg'")
                    else:
                        print("   ❌ Failed to decode frame")
                        return False
                except Exception as e:
                    print(f"   ❌ Error decoding frame: {e}")
                    return False
            else:
                print("   ❌ No frame data in response")
                return False
        else:
            print(f"   ❌ Failed to get frame: {response.json()}")
            return False
    except Exception as e:
        print(f"   ❌ Error getting frame: {e}")
        return False
    
    # Test 4: Get status
    print("4. Testing status endpoint...")
    try:
        response = requests.get(f"{API_BASE_URL}/status")
        print(f"   Status: {response.status_code}")
        print(f"   Status Data: {response.json()}")
    except Exception as e:
        print(f"   ❌ Error getting status: {e}")
    
    # Test 5: Stop camera
    print("5. Stopping camera...")
    try:
        response = requests.post(f"{API_BASE_URL}/stop_camera")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   ❌ Error stopping camera: {e}")
    
    print("=" * 50)
    print("✅ Camera API test completed successfully!")
    return True

def test_direct_camera():
    """Test camera directly using OpenCV"""
    print("\n📷 Testing Direct Camera Access...")
    print("=" * 50)
    
    try:
        # Test camera directly
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            print("❌ Failed to open camera directly")
            return False
        
        print("✅ Camera opened successfully")
        
        # Set camera properties
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 320)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 240)
        cap.set(cv2.CAP_PROP_FPS, 15)
        
        # Test reading frames
        for i in range(5):
            ret, frame = cap.read()
            if ret:
                print(f"   Frame {i+1}: {frame.shape}")
                if i == 0:
                    cv2.imwrite("direct_test_frame.jpg", frame)
                    print("   📸 Direct test frame saved as 'direct_test_frame.jpg'")
            else:
                print(f"   ❌ Failed to read frame {i+1}")
        
        cap.release()
        print("✅ Direct camera test completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error in direct camera test: {e}")
        return False

if __name__ == "__main__":
    print("🎥 Camera Backend Test Script")
    print("Make sure the API server is running on http://localhost:8080")
    print()
    
    # Test direct camera access first
    direct_success = test_direct_camera()
    
    # Test API endpoints
    api_success = test_camera_api()
    
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    print(f"   Direct Camera: {'✅ PASS' if direct_success else '❌ FAIL'}")
    print(f"   API Endpoints: {'✅ PASS' if api_success else '❌ FAIL'}")
    
    if direct_success and api_success:
        print("\n🎉 All tests passed! Camera backend is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Check the error messages above.")
