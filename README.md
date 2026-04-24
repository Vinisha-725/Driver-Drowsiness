# Driver Drowsiness Detection System

A real-time computer vision system that monitors driver drowsiness using eye aspect ratio (EAR) and provides audio-visual alerts when drowsiness is detected.

## 🚗 Features

- **Real-time Eye Tracking**: Uses MediaPipe Face Mesh for precise eye landmark detection
- **EAR Calculation**: Eye Aspect Ratio algorithm for accurate drowsiness detection
- **Progressive Alerts**: Warning → Alert system with escalating visual warnings
- **Audio Alerts**: Windows system beeps for attention-grabbing alerts
- **Visual Feedback**: Color-coded status indicators and flashing borders
- **Performance Optimized**: Resized frames and TensorFlow Lite acceleration

## 📋 Requirements

### Python Dependencies
```
numpy>=2.0.0
opencv-python>=4.5.0
mediapipe==0.10.5
scipy>=1.7.0
playsound==1.2.2
```

### Hardware Requirements
- Webcam (USB or built-in)
- Windows OS (for winsound audio alerts)
- Minimum 4GB RAM
- Python 3.8+

## 🚨 Alert System

### Detection Parameters
- **EAR Threshold**: 0.20 (below this indicates drowsiness)
- **Frame Threshold**: 20 consecutive frames (sustained drowsiness)
- **Alert Cooldown**: 5 seconds (prevents audio spam)

### Alert Stages
1. **Normal** (EAR ≥ 0.20): Green indicators, normal status
2. **Warning** (5+ frames): "WARNING: DROWSY!" + flashing red border
3. **Alert** (20+ frames): "ALERT: WAKE UP!" + 3-beep sequence

### Audio Alerts
- **Pattern**: 3 beeps (1000Hz, 200ms each, 0.1s gaps)
- **Fallback**: System beep if winsound fails
- **Non-blocking**: Maintains video flow during alerts

## 🛠️ Installation

1. **Clone Repository**
```bash
git clone https://github.com/Vinisha-725/Driver-Drowsiness.git
cd Driver-Drowsiness
```

2. **Setup Virtual Environment**
```bash
python -m venv drowsy_env
drowsy_env\Scripts\activate
```

3. **Install Dependencies**
```bash
pip install -r requirements.txt
```

4. **Run System**
```bash
python vision_module.py
```

## 📁 Project Structure

```
Driver-Drowsiness/
├── vision_module.py          # Main drowsiness detection system
├── robust_camera_test.py    # Basic face detection test
├── test.py                # Setup verification
├── requirements.txt         # Python dependencies
├── README.md              # This file
└── models/                # Model files directory
```

## 🎯 Usage

### Basic Operation
1. Run `python vision_module.py`
2. Position camera to capture face clearly
3. Monitor EAR value in bottom-left corner
4. System will alert automatically when drowsiness detected

### Controls
- **ESC**: Exit application
- **Close Window**: Exit application

### Display Information
- **EAR**: Current Eye Aspect Ratio (green = normal, red = drowsy)
- **Threshold**: Shows current drowsiness threshold (0.20)
- **Drowsy frames**: Progress towards alert (X/20)
- **FPS**: Real-time performance metric

## ⚙️ Configuration

### Adjusting Sensitivity
Modify these parameters in `vision_module.py`:

```python
EAR_THRESHOLD = 0.20          # Lower = more sensitive
DROWSY_FRAMES_THRESHOLD = 20    # Lower = faster alerts
ALERT_COOLDOWN = 5           # Lower = more frequent alerts
```

### Audio Customization
Replace beep sequence with custom audio:
```python
# Replace winsound.Beep() with:
playsound.playsound('custom_alert.wav', block=False)
```

## 🔧 Troubleshooting

### Common Issues

**No face detected**
- Ensure proper lighting
- Check camera positioning
- Verify camera permissions

**False alerts**
- Increase `EAR_THRESHOLD` (try 0.25)
- Increase `DROWSY_FRAMES_THRESHOLD` (try 25)
- Check for reflective glasses

**No audio alerts**
- Verify Windows system sounds enabled
- Check volume levels
- Test with headphones

**Performance issues**
- Reduce camera resolution
- Close other applications
- Ensure adequate lighting

## 📊 Technical Details

### Eye Aspect Ratio (EAR)
```
EAR = (A + B) / (2.0 * C)

Where:
A = distance between eye landmarks 1-5
B = distance between eye landmarks 2-4  
C = distance between eye landmarks 0-3
```

### MediaPipe Face Mesh
- 468 facial landmarks detected
- 6 landmarks per eye for EAR calculation
- Real-time processing at 30+ FPS

## 🚀 Future Enhancements

- [ ] Multiple face support
- [ ] Custom audio files
- [ ] Driver profile settings
- [ ] Mobile app integration
- [ ] Cloud logging system
- [ ] Machine learning model training

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Submit pull request
4. Follow coding standards

## 📞 Support

For issues and support:
- GitHub Issues: [Repository Issues](https://github.com/Vinisha-725/Driver-Drowsiness/issues)
- Documentation: [README Updates](https://github.com/Vinisha-725/Driver-Drowsiness/blob/main/README.md)

---

**⚠️ Safety Notice**: This system is designed to assist drivers but should not replace responsible driving practices. Always prioritize safety and take regular breaks when needed.
