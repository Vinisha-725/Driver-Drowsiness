// Driver Safety App - JavaScript Functionality

class DriverSafetyApp {
    constructor() {
        this.currentScreen = 'homeScreen';
        this.isMonitoring = false;
        this.cameraStream = null;
        this.earValue = 0.25;
        this.alertStatus = 'normal';
        this.sessions = [];
        this.videoElement = null;
        this.canvasElement = null;
        this.ctx = null;
        this.eyeDetectionInterval = null;
        this.baselineBrightness = null;
        this.settings = {
            enableAlerts: true,
            soundAlerts: true,
            vibrationAlerts: false,
            sensitivity: 'medium',
            saveHistory: true
        };
        
        this.init();
    }

    init() {
        this.loadSettings();
        this.bindEvents();
        this.checkFirstVisit();
        this.updateUI();
    }

    // Check if it's the first visit and show consent popup
    checkFirstVisit() {
        const hasConsent = localStorage.getItem('cameraConsent');
        if (!hasConsent) {
            this.showConsentPopup();
        }
    }

    // Show consent popup
    showConsentPopup() {
        const popup = document.getElementById('consentPopup');
        popup.classList.add('active');
    }

    // Hide consent popup
    hideConsentPopup() {
        const popup = document.getElementById('consentPopup');
        popup.classList.remove('active');
    }

    // Load settings from localStorage
    loadSettings() {
        const savedSettings = localStorage.getItem('driverSafetySettings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            this.updateSettingsUI();
        }
    }

    // Save settings to localStorage
    saveSettings() {
        localStorage.setItem('driverSafetySettings', JSON.stringify(this.settings));
    }

    // Update settings UI to reflect current settings
    updateSettingsUI() {
        document.getElementById('enableAlerts').checked = this.settings.enableAlerts;
        document.getElementById('soundAlerts').checked = this.settings.soundAlerts;
        document.getElementById('vibrationAlerts').checked = this.settings.vibrationAlerts;
        document.getElementById('saveHistory').checked = this.settings.saveHistory;
        
        const sensitivityRadio = document.querySelector(`input[name="sensitivity"][value="${this.settings.sensitivity}"]`);
        if (sensitivityRadio) {
            sensitivityRadio.checked = true;
        }
    }

    // Bind all event listeners
    bindEvents() {
        // Consent popup
        document.getElementById('acceptConsent').addEventListener('click', () => this.handleConsent(true));
        document.getElementById('declineConsent').addEventListener('click', () => this.handleConsent(false));

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const screen = e.currentTarget.dataset.screen;
                this.showScreen(screen);
            });
        });

        // Home screen buttons
        document.getElementById('startMonitoring').addEventListener('click', () => {
            this.showScreen('monitoringScreen');
            this.startMonitoring();
        });

        document.getElementById('viewProfile').addEventListener('click', () => {
            this.showScreen('profileScreen');
        });

        document.getElementById('openSettings').addEventListener('click', () => {
            this.showScreen('settingsScreen');
        });

        document.getElementById('viewHistory').addEventListener('click', () => {
            this.showScreen('historyScreen');
            this.loadHistory();
        });

        // Monitoring screen
        document.getElementById('toggleCamera').addEventListener('click', () => this.toggleCamera());
        document.getElementById('stopMonitoring').addEventListener('click', () => this.stopMonitoring());

        // Profile screen
        document.getElementById('calibrateBaseline').addEventListener('click', () => this.calibrateBaseline());
        document.getElementById('resetProfile').addEventListener('click', () => this.resetProfile());

        // Settings screen
        document.getElementById('enableAlerts').addEventListener('change', (e) => {
            this.settings.enableAlerts = e.target.checked;
            this.saveSettings();
        });

        document.getElementById('soundAlerts').addEventListener('change', (e) => {
            this.settings.soundAlerts = e.target.checked;
            this.saveSettings();
        });

        document.getElementById('vibrationAlerts').addEventListener('change', (e) => {
            this.settings.vibrationAlerts = e.target.checked;
            this.saveSettings();
        });

        document.getElementById('saveHistory').addEventListener('change', (e) => {
            this.settings.saveHistory = e.target.checked;
            this.saveSettings();
        });

        document.querySelectorAll('input[name="sensitivity"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.settings.sensitivity = e.target.value;
                this.saveSettings();
            });
        });

        document.getElementById('clearData').addEventListener('click', () => this.clearAllData());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMonitoring) {
                this.stopMonitoring();
            }
        });
    }

    // Handle consent response
    handleConsent(accepted) {
        if (accepted) {
            localStorage.setItem('cameraConsent', 'true');
            this.hideConsentPopup();
        } else {
            // Handle declined consent - show message or disable features
            alert('Camera access is required for monitoring. Some features will be limited.');
            this.hideConsentPopup();
        }
    }

    // Screen navigation
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            setTimeout(() => {
                targetScreen.classList.add('active');
            }, 50);
        }

        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.screen === screenId) {
                item.classList.add('active');
            }
        });

        this.currentScreen = screenId;
    }

    // Start monitoring session
    startMonitoring() {
        this.isMonitoring = true;
        this.updateSystemStatus('Monitoring Active', 'alert');
        
        // Start camera automatically
        this.toggleCamera();
        
        // Start session tracking
        this.startSession();
    }

    // Stop monitoring session
    stopMonitoring() {
        this.isMonitoring = false;
        this.updateSystemStatus('System Idle', 'normal');
        
        // Stop camera
        this.stopCamera();
        
        // End session tracking
        this.endSession();
        
        // Return to home screen
        setTimeout(() => {
            this.showScreen('homeScreen');
        }, 1000);
    }

    // Toggle camera on/off
    async toggleCamera() {
        const button = document.getElementById('toggleCamera');
        const video = document.getElementById('cameraFeed');
        
        if (!this.cameraStream) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        facingMode: 'user'
                    } 
                });
                
                video.srcObject = stream;
                this.cameraStream = stream;
                this.videoElement = video;
                
                // Setup canvas for eye detection
                this.setupEyeDetection();
                
                button.innerHTML = '<span class="btn-icon">📹</span> Stop Camera';
                button.classList.add('btn-danger');
                button.classList.remove('btn-primary');
                
                // Start real eye detection
                this.startRealEyeDetection();
                
            } catch (error) {
                console.error('Camera access denied:', error);
                this.showNotification('Camera access denied. Please check permissions.', 'error');
            }
        } else {
            this.stopCamera();
        }
    }

    // Stop camera
    stopCamera() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
            
            const video = document.getElementById('cameraFeed');
            video.srcObject = null;
            
            const button = document.getElementById('toggleCamera');
            button.innerHTML = '<span class="btn-icon">📹</span> Start Camera';
            button.classList.remove('btn-danger');
            button.classList.add('btn-primary');
            
            // Stop real eye detection
            this.stopRealEyeDetection();
        }
    }

    // Setup eye detection canvas
    setupEyeDetection() {
        // Create hidden canvas for processing
        this.canvasElement = document.createElement('canvas');
        this.canvasElement.width = 640;
        this.canvasElement.height = 480;
        this.ctx = this.canvasElement.getContext('2d');
        
        // Wait for video to be ready
        this.videoElement.addEventListener('loadedmetadata', () => {
            this.baselineBrightness = this.calculateEyeBrightness();
            console.log('Eye detection ready - baseline brightness:', this.baselineBrightness);
        });
    }

    // Calculate brightness in eye region
    calculateEyeBrightness() {
        if (!this.videoElement || !this.ctx) return 128;
        
        try {
            // Draw video frame to canvas
            this.ctx.drawImage(this.videoElement, 0, 0, 640, 480);
            
            // Get image data from eye region (upper third of face)
            const imageData = this.ctx.getImageData(160, 120, 320, 120);
            const data = imageData.data;
            
            let totalBrightness = 0;
            let pixelCount = 0;
            
            // Calculate average brightness
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const brightness = (r + g + b) / 3;
                totalBrightness += brightness;
                pixelCount++;
            }
            
            return totalBrightness / pixelCount;
        } catch (error) {
            console.error('Error calculating brightness:', error);
            return 128;
        }
    }

    // Start real eye detection
    startRealEyeDetection() {
        this.eyeDetectionInterval = setInterval(() => {
            if (!this.videoElement || !this.videoElement.readyState === 4) {
                return;
            }
            
            const currentBrightness = this.calculateEyeBrightness();
            
            if (this.baselineBrightness === null) {
                this.baselineBrightness = currentBrightness;
                return;
            }
            
            // Calculate EAR based on brightness change
            const brightnessRatio = currentBrightness / this.baselineBrightness;
            
            // When eyes close, brightness decreases
            if (brightnessRatio < 0.85) {
                // Eyes likely closed
                this.earValue = 0.08 + (brightnessRatio - 0.7) * 0.2;
            } else if (brightnessRatio > 1.15) {
                // Eyes likely wide open
                this.earValue = 0.32 + (brightnessRatio - 1.15) * 0.1;
            } else {
                // Normal eye state
                this.earValue = 0.25 + (brightnessRatio - 1.0) * 0.15;
            }
            
            // Clamp to realistic range
            this.earValue = Math.max(0.08, Math.min(0.40, this.earValue));
            
            this.updateEARDisplay();
            this.checkDrowsiness();
            
        }, 200); // Check 5 times per second
    }

    // Stop real eye detection
    stopRealEyeDetection() {
        if (this.eyeDetectionInterval) {
            clearInterval(this.eyeDetectionInterval);
            this.eyeDetectionInterval = null;
        }
        
        // Reset baseline
        this.baselineBrightness = null;
    }

    // Stop EAR simulation
    stopEARSimulation() {
        if (this.earInterval) {
            clearInterval(this.earInterval);
            this.earInterval = null;
        }
    }

    // Start real face detection
    startRealFaceDetection() {
        if (!this.isFaceDetectionReady || !this.faceDetection) {
            console.log('Face detection not ready, using simulation');
            this.startEARSimulation();
            return;
        }

        this.faceDetectionInterval = setInterval(() => {
            try {
                const results = this.faceDetection.detectFaces();
                
                if (results.status === 'face_detected') {
                    this.earValue = results.earValue;
                    this.updateEARDisplay();
                    this.checkDrowsiness();
                } else if (results.status === 'no_face') {
                    // No face detected
                    this.earValue = 0.25;
                    this.updateEARDisplay();
                    this.alertStatus = 'normal';
                    this.updateAlertStatus('No Face', 'normal');
                } else if (results.status === 'error') {
                    console.error('Face detection error, falling back to simulation');
                    this.stopRealFaceDetection();
                    this.startEARSimulation();
                }
            } catch (error) {
                console.error('Real face detection error:', error);
                this.stopRealFaceDetection();
                this.startEARSimulation();
            }
        }, 200); // 5 FPS for real detection
    }

    // Stop real face detection
    stopRealFaceDetection() {
        if (this.faceDetectionInterval) {
            clearInterval(this.faceDetectionInterval);
            this.faceDetectionInterval = null;
        }
        
        // Cleanup face detection resources
        if (this.faceDetection) {
            this.faceDetection.cleanup();
        }
    }

    // Update EAR display
    updateEARDisplay() {
        const earValueElement = document.getElementById('earValue');
        if (earValueElement) {
            earValueElement.textContent = this.earValue.toFixed(2);
            
            // Update color based on value
            if (this.earValue < 0.20) {
                earValueElement.style.color = 'var(--neon-red)';
            } else if (this.earValue < 0.25) {
                earValueElement.style.color = 'var(--neon-yellow)';
            } else {
                earValueElement.style.color = 'var(--neon-green)';
            }
        }
    }

    // Check for drowsiness and trigger alerts
    checkDrowsiness() {
        const threshold = this.getSensitivityThreshold();
        
        if (this.earValue < threshold && this.settings.enableAlerts) {
            if (this.alertStatus === 'normal') {
                this.alertStatus = 'warning';
                this.drowsyFrameCount = 0;
                this.updateAlertStatus('Warning', 'warning');
            }
            
            // Count consecutive drowsy frames
            this.drowsyFrameCount = (this.drowsyFrameCount || 0) + 1;
            
            // Trigger alert after sustained drowsiness (10+ frames = ~1 second for manual testing)
            if (this.drowsyFrameCount >= 10) {
                if (!this.lastAlertTime || (Date.now() - this.lastAlertTime > 3000)) {
                    this.triggerAlert();
                    this.lastAlertTime = Date.now();
                }
            }
        } else {
            if (this.alertStatus !== 'normal') {
                this.alertStatus = 'normal';
                this.drowsyFrameCount = 0;
                this.updateAlertStatus('Monitoring', 'normal');
            }
        }
    }

    // Get sensitivity threshold
    getSensitivityThreshold() {
        switch (this.settings.sensitivity) {
            case 'low': return 0.12; // Lower threshold for manual testing
            case 'high': return 0.25; // Higher threshold for sensitivity
            default: return 0.15; // Medium threshold - easier to trigger
        }
    }

    // Update alert status display
    updateAlertStatus(text, status) {
        const alertStatus = document.getElementById('alertStatus');
        if (alertStatus) {
            const statusIndicator = alertStatus.querySelector('.status-indicator-monitoring');
            const statusText = alertStatus.querySelector('.status-text-monitoring');
            
            statusText.textContent = text;
            
            statusIndicator.classList.remove('normal', 'warning', 'alert');
            statusIndicator.classList.add(status);
            
            if (status === 'alert') {
                statusIndicator.style.background = 'var(--status-red)';
                statusIndicator.style.animation = 'blink 1s infinite';
            } else if (status === 'warning') {
                statusIndicator.style.background = 'var(--status-yellow)';
                statusIndicator.style.animation = 'pulse 2s infinite';
            } else {
                statusIndicator.style.background = 'var(--status-green)';
                statusIndicator.style.animation = 'pulse 2s infinite';
            }
        }
    }

    // Trigger drowsiness alert
    triggerAlert() {
        this.alertStatus = 'alert';
        this.updateAlertStatus('DROWSY!', 'alert');
        
        // Sound alert
        if (this.settings.soundAlerts) {
            this.playAlertSound();
        }
        
        // Vibration alert
        if (this.settings.vibrationAlerts && navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 200]);
        }
        
        // Visual alert
        this.showVisualAlert();
        
        // Log alert
        this.logAlert();
    }

    // Play alert sound
    playAlertSound() {
        // Create beep sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 1000;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
        
        // Play 3 beeps
        setTimeout(() => this.playAlertSound(), 600);
        setTimeout(() => this.playAlertSound(), 1200);
    }

    // Show visual alert
    showVisualAlert() {
        const cameraContainer = document.querySelector('.camera-container');
        if (cameraContainer) {
            cameraContainer.style.animation = 'blink 0.5s 3';
            setTimeout(() => {
                cameraContainer.style.animation = '';
            }, 1500);
        }
    }

    // Update system status
    updateSystemStatus(text, type) {
        const statusIndicator = document.getElementById('systemStatus');
        if (statusIndicator) {
            const statusDot = statusIndicator.querySelector('.status-dot');
            const statusText = statusIndicator.querySelector('.status-text');
            
            statusText.textContent = text;
            
            statusDot.classList.remove('normal', 'alert');
            statusDot.classList.add(type);
            
            if (type === 'alert') {
                statusDot.style.background = 'var(--status-red)';
            } else {
                statusDot.style.background = 'var(--status-green)';
            }
        }
    }

    // Session management
    startSession() {
        const session = {
            id: Date.now(),
            startTime: new Date(),
            alerts: 0,
            baselineEAR: this.earValue
        };
        
        this.currentSession = session;
    }

    endSession() {
        if (this.currentSession) {
            this.currentSession.endTime = new Date();
            this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;
            
            if (this.settings.saveHistory) {
                this.sessions.push(this.currentSession);
                this.saveSessions();
            }
            
            this.updateDashboardStats();
            this.currentSession = null;
        }
    }

    // Log alert during session
    logAlert() {
        if (this.currentSession) {
            this.currentSession.alerts++;
        }
    }

    // Save sessions to localStorage
    saveSessions() {
        if (this.settings.saveHistory) {
            localStorage.setItem('driverSafetySessions', JSON.stringify(this.sessions));
        }
    }

    // Load sessions from localStorage
    loadSessions() {
        const savedSessions = localStorage.getItem('driverSafetySessions');
        if (savedSessions) {
            this.sessions = JSON.parse(savedSessions);
        }
    }

    // Load and display history
    loadHistory() {
        this.loadSessions();
        this.updateHistoryDisplay();
        this.updateDashboardStats();
    }

    // Update history display
    updateHistoryDisplay() {
        const historyList = document.querySelector('.history-list');
        const summaryCards = document.querySelectorAll('.summary-card');
        
        if (this.sessions.length === 0) {
            historyList.innerHTML = `
                <div class="history-empty">
                    <span class="empty-icon">📊</span>
                    <p>No sessions recorded yet</p>
                    <small>Start monitoring to see your history</small>
                </div>
            `;
            
            summaryCards[0].querySelector('.summary-value').textContent = '0';
            summaryCards[1].querySelector('.summary-value').textContent = '0h';
            summaryCards[2].querySelector('.summary-value').textContent = '0';
        } else {
            // Calculate totals
            const totalSessions = this.sessions.length;
            const totalTime = this.sessions.reduce((sum, session) => sum + session.duration, 0);
            const totalAlerts = this.sessions.reduce((sum, session) => sum + session.alerts, 0);
            
            summaryCards[0].querySelector('.summary-value').textContent = totalSessions;
            summaryCards[1].querySelector('.summary-value').textContent = this.formatDuration(totalTime);
            summaryCards[2].querySelector('.summary-value').textContent = totalAlerts;
            
            // Display recent sessions
            const recentSessions = this.sessions.slice(-5).reverse();
            historyList.innerHTML = recentSessions.map(session => `
                <div class="session-item">
                    <div class="session-date">${new Date(session.startTime).toLocaleDateString()}</div>
                    <div class="session-details">
                        <span>Duration: ${this.formatDuration(session.duration)}</span>
                        <span>Alerts: ${session.alerts}</span>
                    </div>
                </div>
            `).join('');
        }
    }

    // Update dashboard statistics
    updateDashboardStats() {
        const today = new Date().toDateString();
        const todaySessions = this.sessions.filter(session => 
            new Date(session.startTime).toDateString() === today
        );
        
        const totalTodayTime = todaySessions.reduce((sum, session) => sum + session.duration, 0);
        const totalTodayAlerts = todaySessions.reduce((sum, session) => sum + session.alerts, 0);
        
        // Update dashboard stats
        const statCards = document.querySelectorAll('.stat-card');
        if (statCards.length >= 3) {
            statCards[0].querySelector('.stat-value').textContent = todaySessions.length;
            statCards[1].querySelector('.stat-value').textContent = this.formatDuration(totalTodayTime);
            statCards[2].querySelector('.stat-value').textContent = totalTodayAlerts;
        }
    }

    // Format duration for display
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m`;
        } else {
            return `${seconds}s`;
        }
    }

    // Profile functions
    calibrateBaseline() {
        if (this.isMonitoring) {
            // Take average of current EAR values
            const baseline = this.earValue;
            localStorage.setItem('baselineEAR', baseline.toString());
            document.getElementById('baselineEAR').textContent = baseline.toFixed(2);
            this.showNotification('Baseline calibrated successfully!', 'success');
        } else {
            this.showNotification('Please start monitoring first', 'warning');
        }
    }

    resetProfile() {
        if (confirm('Are you sure you want to reset all profile data?')) {
            localStorage.removeItem('baselineEAR');
            localStorage.removeItem('driverSafetySessions');
            this.sessions = [];
            this.updateDashboardStats();
            this.updateHistoryDisplay();
            document.getElementById('baselineEAR').textContent = '0.25';
            this.showNotification('Profile reset successfully', 'success');
        }
    }

    // Clear all data
    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            localStorage.clear();
            this.sessions = [];
            this.settings = {
                enableAlerts: true,
                soundAlerts: true,
                vibrationAlerts: false,
                sensitivity: 'medium',
                saveHistory: true
            };
            this.updateSettingsUI();
            this.updateDashboardStats();
            this.updateHistoryDisplay();
            this.showNotification('All data cleared successfully', 'success');
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Initialize face detection (removed - back to simple simulation)
    async initializeFaceDetection() {
        // Simple simulation approach - no complex models
        console.log('Using simple EAR simulation');
        return true;
    }

    // Update UI
    updateUI() {
        this.loadSessions();
        this.updateDashboardStats();
        
        // Load baseline EAR
        const baseline = localStorage.getItem('baselineEAR');
        if (baseline) {
            document.getElementById('baselineEAR').textContent = parseFloat(baseline).toFixed(2);
        }
        
        // Update profile stats
        const totalSessions = this.sessions.length;
        const avgSession = totalSessions > 0 ? 
            this.sessions.reduce((sum, s) => sum + s.duration, 0) / totalSessions : 0;
        
        document.getElementById('totalSessions').textContent = totalSessions;
        document.getElementById('avgSession').textContent = this.formatDuration(avgSession);
        
        // Start FPS counter
        this.startFPSCounter();
    }

    // Start FPS counter
    startFPSCounter() {
        let lastTime = performance.now();
        let frames = 0;
        
        const updateFPS = () => {
            frames++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round(frames * 1000 / (currentTime - lastTime));
                const fpsElement = document.getElementById('fpsCounter');
                if (fpsElement) {
                    fpsElement.textContent = `FPS: ${fps}`;
                }
                
                frames = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(updateFPS);
        };
        
        requestAnimationFrame(updateFPS);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new DriverSafetyApp();
    
    // Make app globally available for debugging
    window.driverSafetyApp = app;
});

// Add notification styles dynamically
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification.success {
        background: linear-gradient(135deg, var(--neon-green), var(--neon-blue));
    }
    
    .notification.warning {
        background: linear-gradient(135deg, var(--neon-yellow), var(--neon-red));
    }
    
    .notification.error {
        background: linear-gradient(135deg, var(--neon-red), var(--neon-purple));
    }
    
    .notification.info {
        background: linear-gradient(135deg, var(--neon-blue), var(--neon-purple));
    }
    
    .session-item {
        background: var(--bg-tertiary);
        border: 1px solid rgba(0, 255, 136, 0.1);
        border-radius: 12px;
        padding: 1rem;
        margin-bottom: 1rem;
    }
    
    .session-date {
        font-weight: 600;
        color: var(--neon-green);
        margin-bottom: 0.5rem;
    }
    
    .session-details {
        display: flex;
        gap: 1rem;
        color: var(--text-secondary);
        font-size: 0.9rem;
    }
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);
