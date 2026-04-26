# Driver Drowsiness Detection - React Frontend

A modern React (Vite + Tailwind CSS) web application for real-time driver drowsiness detection using webcam and MediaPipe Face Mesh.

## 🚀 Features

- **Real-time Eye Detection**: Uses MediaPipe Face Mesh for accurate eye tracking
- **Drowsiness Alerts**: Multi-level alert system with sound and vibration
- **Session Management**: Track monitoring sessions with detailed statistics
- **Baseline Calibration**: Personalized detection based on individual eye characteristics
- **Privacy-focused**: All processing happens locally in the browser
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Theme**: Modern glassmorphism UI with neon accents

## 🛠️ Tech Stack

- **React 18**: Modern functional components with hooks
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **MediaPipe Face Mesh**: Face and eye landmark detection
- **Web Audio API**: Sound alerts and notifications
- **LocalStorage**: Persistent data storage

## 📱 Screens

1. **Home**: Dashboard with quick stats and monitoring controls
2. **Monitoring**: Live camera feed with real-time EAR display
3. **Profile**: User profile and baseline calibration
4. **Settings**: Alert preferences and sensitivity controls
5. **History**: Session history and statistics

## 🧩 Components

### Core Components
- `Navbar`: Navigation component with active state
- `CameraFeed`: Video feed with face overlay
- `EARDisplay`: Real-time EAR value visualization
- `AlertSystem`: Multi-level alert management
- `StatsPanel`: Session statistics display

### Custom Hooks
- `useEAR`: Eye detection and EAR calculation logic

### Utilities
- `SessionManager`: LocalStorage data management

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Modern web browser with webcam support

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open browser**:
   Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 📖 Usage

### Basic Workflow

1. **Calibrate Baseline**: Go to Profile → Calibrate Baseline
2. **Start Monitoring**: Click "Start Monitoring" on Home screen
3. **Allow Camera**: Grant webcam permissions when prompted
4. **Monitor**: System tracks eye aspect ratio in real-time
5. **Alerts**: Receive warnings when drowsiness is detected
6. **View History**: Check session statistics in History screen

### Alert Levels

- **🟢 Normal**: EAR > threshold
- **🟡 Warning**: EAR < threshold (beeping sounds)
- **🔴 Alert**: EAR < threshold × 0.6 (loud alarm + vibration)

### Settings

- **Sound Alerts**: Enable/disable audio warnings
- **Vibration Alerts**: Mobile device vibration (if supported)
- **Sensitivity**: Low/Medium/High detection sensitivity
- **Data Storage**: Save session history locally

## 🔧 Configuration

### Tailwind CSS

The project uses a custom Tailwind configuration with:

- **Dark theme colors**: `dark-bg`, `dark-card`, `dark-border`
- **Neon accents**: `neon-green`, `neon-yellow`, `neon-red`
- **Custom animations**: `pulse-glow`, `fade-in`, `slide-up`
- **Glassmorphism effects**: Backdrop blur and transparency

### MediaPipe Integration

The app uses MediaPipe Face Mesh with:
- **468 facial landmarks** for accurate detection
- **Eye landmarks**: 6 points per eye for EAR calculation
- **Real-time processing**: 30+ FPS performance
- **Confidence thresholds**: Configurable detection sensitivity

## 📊 Data Structure

### Session Data

```javascript
{
  date: "2026-04-26T...",
  duration: 123, // seconds
  alerts: 3,
  avgEAR: 0.234,
  drowsyFrames: 15,
  baselineEAR: 0.25
}
```

### Settings Data

```javascript
{
  soundEnabled: true,
  vibrationEnabled: false,
  sensitivity: 'medium',
  saveHistory: true,
  userName: 'Driver'
}
```

## 🔒 Privacy & Security

- **Local Processing**: All computation happens in the browser
- **No Server Dependency**: Standalone operation
- **Data Privacy**: User data never leaves the device
- **Camera Consent**: Explicit user permission required
- **LocalStorage**: Data stored locally, can be cleared

## 🎨 UI Design

### Design Principles

- **Dark Theme**: Easy on the eyes during night driving
- **Glassmorphism**: Modern blur effects and transparency
- **Neon Accents**: High visibility status indicators
- **Responsive Layout**: Mobile-first design approach
- **Smooth Animations**: Professional transitions and feedback

### Color Scheme

- **Background**: `#0a0a0f` (dark blue-black)
- **Cards**: `#1a1a2e` (semi-transparent)
- **Neon Green**: `#00ff88` (normal status)
- **Neon Yellow**: `#ffcc00` (warning status)
- **Neon Red**: `#ff0044` (alert status)

## 🚀 Performance

### Optimization Techniques

- **Throttled Updates**: FPS limiting for smooth performance
- **Memory Management**: Proper cleanup of intervals and streams
- **Lazy Loading**: MediaPipe loaded on demand
- **Efficient Algorithms**: Optimized EAR calculations

### Browser Support

- **Chrome 90+**: Full feature support
- **Firefox 88+**: Full feature support
- **Safari 14+**: Full feature support
- **Edge 90+**: Full feature support

## 🐛 Troubleshooting

### Common Issues

1. **Camera not working**:
   - Check browser permissions
   - Ensure HTTPS (localhost is exempt)
   - Try different browser

2. **MediaPipe not loading**:
   - Check internet connection
   - Clear browser cache
   - Disable ad blockers

3. **Alerts not sounding**:
   - Enable sound in settings
   - Check browser audio permissions
   - Ensure tab is not muted

4. **Performance issues**:
   - Close other browser tabs
   - Reduce camera resolution
   - Check system resources

### Debug Mode

Open browser console (F12) to see:
- EAR calculation logs
- Face detection status
- Performance metrics
- Error messages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Dependencies

- [React](https://reactjs.org/) - UI library
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [React Router](https://reactrouter.com/) - Routing
- [MediaPipe](https://mediapipe.dev/) - Computer vision

---

**Built with ❤️ for safer driving** 🚗👁️📊
