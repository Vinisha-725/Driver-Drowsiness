# Installation Guide

## Quick Start

### 1. System Requirements
- Windows 10/11
- Python 3.8+
- Webcam
- 4GB RAM minimum

### 2. Setup Steps

```bash
# Clone the repository
git clone https://github.com/Vinisha-725/Driver-Drowsiness.git
cd Driver-Drowsiness

# Create virtual environment
python -m venv drowsy_env

# Activate virtual environment
drowsy_env\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the system
python vision_module.py
```

### 3. Dependency Installation

If manual installation needed:

```bash
pip install numpy opencv-python mediapipe==0.10.5 scipy playsound==1.2.2
```

### 4. Troubleshooting

**MediaPipe Solutions API Error:**
```bash
pip uninstall mediapipe -y
pip install mediapipe==0.10.5 --force-reinstall
```

**No Sound on Windows:**
- Ensure Windows system sounds are enabled
- Check volume levels
- Test with: `python -c "import winsound; winsound.Beep(1000, 200)"`

### 5. First Run

1. Camera permission will be requested - allow access
2. Position face clearly in camera view
3. Look for green eye contours around your eyes
4. Monitor EAR value in bottom-left corner
5. Test by closing eyes to trigger alerts

### 6. Configuration

Edit `vision_module.py` to adjust sensitivity:

```python
# Less sensitive (fewer false alerts)
EAR_THRESHOLD = 0.25
DROWSY_FRAMES_THRESHOLD = 25

# More sensitive (catch drowsiness earlier)  
EAR_THRESHOLD = 0.15
DROWSY_FRAMES_THRESHOLD = 15
```

## Support

For installation issues:
- Check Python version: `python --version`
- Verify virtual environment: `pip list`
- Test camera: `python robust_camera_test.py`
