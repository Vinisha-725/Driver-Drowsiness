# Driver Safety Web App

A modern, minimal mobile/web application for driver drowsiness detection with real-time monitoring, progressive alerts, and comprehensive session tracking.

## 🚀 Quick Start

1. **Open the App**
   ```bash
   # Simply open index.html in your browser
   open index.html
   ```

2. **Grant Camera Permission**
   - Accept the camera consent popup
   - Allow browser camera access when prompted

3. **Start Monitoring**
   - Click "Start Monitoring" from the home screen
   - Toggle camera to begin detection
   - Monitor EAR values and alerts in real-time

## 📱 Features

### 🏠 Home Dashboard
- **Quick Stats**: Sessions today, total time, alerts triggered
- **One-Tap Actions**: Start monitoring, view profile, settings, history
- **System Status**: Real-time monitoring status indicator

### 👁️ Monitoring Screen
- **Live Camera Feed**: Real-time video with overlay information
- **EAR Display**: Current Eye Aspect Ratio with color coding
- **Alert Status**: Visual indicators for normal/warning/drowsy states
- **Performance Metrics**: FPS counter and system performance

### 👤 Profile Management
- **Driver Profile**: User ID and statistics
- **Baseline Calibration**: Personalized EAR threshold calibration
- **Session History**: Comprehensive driving session data
- **Performance Analytics**: Average session times and alert patterns

### ⚙️ Settings & Preferences
- **Alert Controls**: Toggle audio, visual, and vibration alerts
- **Sensitivity Levels**: Low/Medium/High detection sensitivity
- **Privacy Settings**: Data collection and storage preferences
- **System Configuration**: Customizable thresholds and cooldowns

### 📊 History & Reports
- **Session Tracking**: Detailed logs of all monitoring sessions
- **Alert Statistics**: Frequency and timing of drowsiness alerts
- **Performance Trends**: Long-term driving pattern analysis
- **Export Options**: Data export for further analysis

## 🎨 Design Features

### Dark Theme with Neon Accents
- **Primary Colors**: Dark backgrounds (#0a0a0f, #1a1a2e)
- **Neon Accents**: Green (#00ff88), Blue (#00d4ff), Red (#ff006e)
- **Status Indicators**: Color-coded alert states
- **Smooth Transitions**: Subtle animations and micro-interactions

### Mobile-First Design
- **Responsive Layout**: Optimized for mobile devices (320px-480px)
- **Touch-Friendly**: Large tap targets and gestures
- **Bottom Navigation**: Easy thumb-reach navigation
- **Performance Optimized**: Smooth 60fps animations

### Accessibility Features
- **High Contrast**: Clear visual hierarchy
- **Reduced Motion**: Respects user motion preferences
- **Screen Reader**: Semantic HTML and ARIA labels
- **Keyboard Navigation**: Full keyboard support

## 🔧 Technical Implementation

### Frontend Technologies
- **HTML5**: Semantic markup and modern features
- **CSS3**: Flexbox, Grid, Custom Properties, Animations
- **JavaScript ES6+**: Modern syntax and APIs
- **WebRTC**: Camera access and media streaming
- **Web Audio API**: Alert sound generation
- **LocalStorage**: Persistent settings and session data

### Architecture Patterns
- **Component-Based**: Modular screen and feature organization
- **Event-Driven**: Responsive user interaction handling
- **State Management**: Centralized app state and settings
- **Progressive Enhancement**: Core functionality without JavaScript

### Performance Optimizations
- **Lazy Loading**: Screen content loaded on demand
- **Debounced Events**: Optimized interaction handling
- **Memory Management**: Proper cleanup and resource management
- **Efficient Animations**: GPU-accelerated CSS transforms

## 📊 Monitoring Algorithm

### Eye Aspect Ratio (EAR)
```
EAR = (A + B) / (2.0 * C)

Where:
A = distance between eye landmarks 1-5
B = distance between eye landmarks 2-4  
C = distance between eye landmarks 0-3
```

### Alert Thresholds
- **Normal**: EAR ≥ 0.25 (eyes open)
- **Warning**: 0.20 ≤ EAR < 0.25 (approaching drowsiness)
- **Alert**: EAR < 0.20 (drowsy state)

### Sensitivity Levels
- **Low**: Threshold 0.15 (reduced false positives)
- **Medium**: Threshold 0.20 (balanced detection)
- **High**: Threshold 0.30 (maximum sensitivity)

## 🔒 Privacy & Security

### Data Protection
- **Local Storage**: All data stored locally on device
- **No Cloud Upload**: No data transmitted to external servers
- **Camera Consent**: Explicit user permission required
- **Data Control**: User can clear all data at any time

### Security Features
- **HTTPS Required**: Secure camera access
- **Permission Model**: Granular feature permissions
- **Data Minimization**: Only essential data collected
- **Transparency**: Clear data usage policies

## 🚀 Deployment

### Local Development
```bash
# Serve locally (any static server)
python -m http.server 8000
# or
npx serve .
```

### Production Deployment
- **Static Hosting**: Deploy to any static hosting service
- **CDN**: Use CDN for global performance
- **HTTPS**: Required for camera access
- **Domain**: Custom domain for production use

### Browser Support
- **Chrome/Edge**: Full support with all features
- **Firefox**: Full support with WebRTC enabled
- **Safari**: Full support on iOS 13+
- **Mobile**: Full support on modern mobile browsers

## 🛠️ Customization

### Theme Customization
```css
/* Modify CSS variables for custom themes */
:root {
    --neon-green: #00ff88;     /* Primary accent */
    --neon-blue: #00d4ff;      /* Secondary accent */
    --bg-primary: #0a0a0f;     /* Main background */
    --bg-secondary: #1a1a2e;   /* Card backgrounds */
}
```

### Alert Configuration
```javascript
// Customize alert behavior
const alertConfig = {
    threshold: 0.20,           // EAR threshold
    framesRequired: 20,         // Consecutive frames
    cooldownMs: 5000,          // Alert cooldown
    soundFrequency: 1000,      // Beep frequency (Hz)
    vibrationPattern: [200, 100, 200] // Vibration pattern
};
```

### Feature Extensions
- **Multi-Language**: Add internationalization support
- **Cloud Sync**: Optional cloud data synchronization
- **Advanced Analytics**: Machine learning integration
- **Voice Alerts**: Text-to-speech alert system
- **Fleet Management**: Multi-driver dashboard

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch
3. Make changes with semantic commits
4. Test across browsers and devices
5. Submit pull request with description

### Code Standards
- **ESLint**: JavaScript linting and formatting
- **Prettier**: Consistent code formatting
- **Semantic HTML**: Proper markup structure
- **CSS Guidelines**: BEM methodology for CSS classes
- **Documentation**: Clear comments and README updates

## 📞 Support

### Common Issues
- **Camera Access**: Ensure HTTPS and proper permissions
- **Performance**: Close other tabs/apps for better performance
- **Compatibility**: Use modern browser for full features
- **Storage**: Clear browser data if issues persist

### Troubleshooting
```javascript
// Debug mode - enable console logging
window.driverSafetyApp.debugMode = true;

// Reset all settings
localStorage.clear();
location.reload();
```

## 📄 License

This project is open source under the MIT License.

---

**⚠️ Safety Notice**: This app is designed to assist drivers but should not replace responsible driving practices. Always prioritize safety, take regular breaks, and never drive when tired.
