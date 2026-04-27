#!/bin/bash
# Simple API test script for camera endpoints

echo "🎥 Testing Camera API Endpoints..."
echo "Make sure the API server is running on http://localhost:8080"
echo ""

API_BASE="http://localhost:8080/api"

# Test 1: Start camera
echo "1. Starting camera..."
curl -X POST "$API_BASE/start_camera" -H "Content-Type: application/json"
echo ""
echo ""

# Wait for camera to initialize
echo "Waiting 2 seconds for camera to initialize..."
sleep 2

# Test 2: Get status
echo "2. Getting status..."
curl -X GET "$API_BASE/status" -H "Content-Type: application/json"
echo ""
echo ""

# Test 3: Get EAR values
echo "3. Getting EAR data..."
curl -X GET "$API_BASE/get_ear" -H "Content-Type: application/json"
echo ""
echo ""

# Test 4: Get camera frame
echo "4. Getting camera frame..."
curl -X GET "$API_BASE/get_frame" -H "Content-Type: application/json" | head -c 200
echo "..."
echo ""

# Test 5: Stop camera
echo "5. Stopping camera..."
curl -X POST "$API_BASE/stop_camera" -H "Content-Type: application/json"
echo ""
echo ""

echo "✅ API test completed!"
