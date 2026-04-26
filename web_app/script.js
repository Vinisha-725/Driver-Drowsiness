// Driver Safety App - JavaScript Functionality

// Global variables
class DriverSafetyApp {
    constructor() {
        // Camera and detection
        this.cameraStream = null;
        this.videoElement = null;
        this.canvasElement = null;
        this.ctx = null;
        
        // MediaPipe
        this.faceMesh = null;
        this.camera = null;
        
        // Drowsiness detection
        this.earValue = 0.25;
        this.alertStatus = 'normal';
        this.drowsyFrameCount = 0;
        this.lastAlertTime = 0;
        
        // Settings
        this.settings = {
            enableAlerts: true,
            alertSound: true,
            alertVibration: true,
            sensitivity: 'default',
            autoStart: false
        };
        
        // Session data
        this.sessionData = {
            startTime: null,
            alertsTriggered: 0,
            totalDrowsyTime: 0,
            averageEAR: 0.25
        };
        
        // MediaPipe detection state
        this.isDetecting = false;
        this.detectionInterval = null;
        
        this.init();
    }

    init() {
        this.loadSettings();
        this.bindEvents();
        this.checkFirstVisit();
        this.setupMediaPipe();
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
        
        // End session tracking (this will also stop the timer)
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
        const canvas = document.getElementById('overlayCanvas');
        
        console.log('🎥 Toggle camera called');
        
        if (!this.cameraStream) {
            try {
                console.log('📹 Setting up MediaPipe camera...');
                
                // Setup MediaPipe camera
                this.camera = new Camera(video, {
                    onFrame: async () => {
                        await this.faceMesh.send({image: video});
                    },
                    width: 640,
                    height: 480
                });
                
                // Get browser camera stream
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        facingMode: 'user'
                    } 
                });
                
                console.log('✅ Got camera stream');
                
                // Setup video and canvas
                video.srcObject = stream;
                video.style.display = 'block';
                video.style.background = 'transparent';
                video.style.border = '2px solid #00ff00';
                
                canvas.style.display = 'block';
                this.ctx = canvas.getContext('2d');
                
                // Video event listeners
                video.onloadedmetadata = () => {
                    console.log('📹 Video loaded, starting MediaPipe...');
                    video.play();
                    this.camera.start();
                };
                
                video.onplay = () => {
                    console.log('▶️ Camera and MediaPipe started!');
                    video.style.border = '2px solid #00ff00';
                    this.isDetecting = true;
                };
                
                video.onerror = (e) => {
                    console.error('❌ Video error:', e);
                    video.style.border = '2px solid #ff0000';
                };
                
                this.cameraStream = stream;
                
                button.innerHTML = '<span class="btn-icon">📹</span> Stop Camera';
                button.classList.add('btn-danger');
                button.classList.remove('btn-primary');
                
                this.showNotification('Camera started with MediaPipe detection!', 'success');
                
            } catch (error) {
                console.error('❌ Camera failed:', error);
                
                if (error.name === 'NotAllowedError') {
                    this.showNotification('❌ Camera permission denied. Please allow camera access.', 'error');
                } else if (error.name === 'NotFoundError') {
                    this.showNotification('❌ No camera found. Please check your camera.', 'error');
                } else {
                    this.showNotification('❌ Camera failed. Please check permissions.', 'error');
                }
            }
        } else {
            this.stopCamera();
        }
    }

    // Stop camera
    async stopCamera() {
        if (this.cameraStream) {
            console.log('🛑 Stopping camera and MediaPipe...');
            
            // Stop MediaPipe camera
            if (this.camera) {
                this.camera.stop();
                this.camera = null;
            }
            
            // Stop browser camera stream
            if (this.cameraStream.getTracks) {
                this.cameraStream.getTracks().forEach(track => track.stop());
            }
            
            this.cameraStream = null;
            this.isDetecting = false;
            
            const video = document.getElementById('cameraFeed');
            video.srcObject = null;
            video.style.display = 'none';
            video.style.border = 'none';
            
            const canvas = document.getElementById('overlayCanvas');
            canvas.style.display = 'none';
            
            const button = document.getElementById('toggleCamera');
            button.innerHTML = '<span class="btn-icon">📹</span> Start Camera';
            button.classList.remove('btn-danger');
            button.classList.add('btn-primary');
            
            this.showNotification('Camera and MediaPipe stopped', 'info');
        }
    }

    // Setup MediaPipe Face Mesh
    setupMediaPipe() {
        this.faceMesh = new FaceMesh({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            }
        });

        this.faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        this.faceMesh.onResults((results) => this.onMediaPipeResults(results));
    }

    // Start MediaPipe camera
    startMediaPipeCamera() {
        this.camera = new Camera(this.videoElement, {
            onFrame: async () => {
                await this.faceMesh.send({ image: this.videoElement });
            },
            width: 640,
            height: 480
        });
        
        this.camera.start();
        console.log('MediaPipe Face Mesh started');
    }

    // Handle MediaPipe results
    onMediaPipeResults(results) {
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            // No face detected
            this.earValue = 0.25;
            this.updateEARDisplay();
            return;
        }

        const landmarks = results.multiFaceLandmarks[0];
        
        // Calculate EAR using MediaPipe facial landmarks
        const leftEAR = this.calculateEARFromLandmarks(landmarks, this.getLeftEyeIndices());
        const rightEAR = this.calculateEARFromLandmarks(landmarks, this.getRightEyeIndices());
        
        // Average EAR from both eyes
        this.earValue = (leftEAR + rightEAR) / 2;
        
        // Add small variation for realism
        const variation = (Math.random() - 0.5) * 0.01;
        this.earValue = Math.max(0.08, Math.min(0.40, this.earValue + variation));
        
        this.updateEARDisplay();
        this.checkDrowsiness();
    }

    // Get left eye landmark indices for MediaPipe
    getLeftEyeIndices() {
        // MediaPipe left eye landmarks (approximate)
        return [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
    }

    // Get right eye landmark indices for MediaPipe
    getRightEyeIndices() {
        // MediaPipe right eye landmarks (approximate)
        return [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
    }

    // Calculate EAR from MediaPipe landmarks
    calculateEARFromLandmarks(landmarks, eyeIndices) {
        if (!landmarks || eyeIndices.length < 6) return 0.25;

        // Get key eye points for EAR calculation
        // Using simplified 6-point EAR calculation
        const eyePoints = [
            landmarks[eyeIndices[0]],  // Left corner
            landmarks[eyeIndices[1]],  // Top left
            landmarks[eyeIndices[2]],  // Top right
            landmarks[eyeIndices[3]],  // Right corner
            landmarks[eyeIndices[4]],  // Bottom right
            landmarks[eyeIndices[5]]   // Bottom left
        ];

        // Calculate distances
        const A = this.distance(eyePoints[1], eyePoints[5]); // Top-left to bottom-left
        const B = this.distance(eyePoints[2], eyePoints[4]); // Top-right to bottom-right
        const C = this.distance(eyePoints[0], eyePoints[3]); // Left corner to right corner

        const ear = (A + B) / (2.0 * C);
        
        return Math.max(0.08, Math.min(0.40, ear));
    }

    // Calculate distance between two landmarks
    distance(point1, point2) {
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Stop MediaPipe camera
    stopMediaPipeCamera() {
        if (this.camera) {
            this.camera.stop();
            this.camera = null;
        }
        
        if (this.faceMesh) {
            this.faceMesh.close();
            this.faceMesh = null;
        }
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
        const threshold = this.getSensitivityThreshold(); // 0.2
        
        if (this.earValue < threshold && this.settings.enableAlerts) {
            // Below 0.2 = WARNING with beeping sounds
            if (this.alertStatus === 'normal') {
                this.alertStatus = 'warning';
                this.drowsyFrameCount = 0;
                this.updateAlertStatus('WARNING - Eyes Closing!', 'warning');
                this.startWarningBeeps();
            }
            
            // Count consecutive drowsy frames
            this.drowsyFrameCount = (this.drowsyFrameCount || 0) + 1;
            
            // Eyes completely closed (very low EAR) = LOUD ALERT
            if (this.earValue < 0.1) {
                if (this.alertStatus !== 'alert') {
                    this.triggerAlert();
                }
            }
        } else {
            if (this.alertStatus !== 'normal') {
                this.alertStatus = 'normal';
                this.drowsyFrameCount = 0;
                this.updateAlertStatus('Monitoring', 'normal');
                this.stopWarningBeeps();
            }
        }
    }

    // Get sensitivity threshold
    getSensitivityThreshold() {
        return 0.2; // Fixed threshold as requested - below 0.2 = warning
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

    // Start warning beeps (below 0.2)
    startWarningBeeps() {
        this.stopWarningBeeps(); // Clear any existing beeps
        this.warningBeepInterval = setInterval(() => {
            if (this.settings.alertSound && this.alertStatus === 'warning') {
                this.playBeep(800, 200); // 800Hz for 200ms
            }
        }, 1000); // Beep every second
    }
    
    // Stop warning beeps
    stopWarningBeeps() {
        if (this.warningBeepInterval) {
            clearInterval(this.warningBeepInterval);
            this.warningBeepInterval = null;
        }
    }
    
    // Play beep sound
    playBeep(frequency, duration) {
        try {
            // Use Web Audio API for beep
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration / 1000);
        } catch (error) {
            console.log('Audio not supported:', error);
        }
    }
    
    // Trigger drowsiness alert (eyes completely closed)
    triggerAlert() {
        this.alertStatus = 'alert';
        this.updateAlertStatus('🚨 DROWSINESS ALERT! WAKE UP! 🚨', 'alert');
        this.stopWarningBeeps(); // Stop warning beeps
        
        // Play loud alert sound
        if (this.settings.alertSound) {
            this.playLoudAlert();
        }
        
        // Vibration if supported
        if (this.settings.alertVibration && navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 200]); // Strong vibration pattern
        }
        
        // Increment alert count EVERY TIME alert triggers
        this.sessionData.alertsTriggered++;
        console.log(`🚨 Alert triggered! Total alerts: ${this.sessionData.alertsTriggered}`);
        
        // Update alert display immediately
        this.updateAlertDisplay();
    }
    
    // Update alert display in real-time
    updateAlertDisplay() {
        // Find alert counter element if it exists, or create one
        let alertCounter = document.getElementById('alertCounter');
        if (!alertCounter) {
            // Create alert counter if it doesn't exist
            alertCounter = document.createElement('div');
            alertCounter.id = 'alertCounter';
            alertCounter.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(255, 0, 0, 0.8);
                color: white;
                padding: 8px 15px;
                border-radius: 20px;
                font-weight: bold;
                z-index: 1000;
                font-size: 14px;
            `;
            document.body.appendChild(alertCounter);
        }
        
        // Update the alert count
        alertCounter.textContent = `Alerts: ${this.sessionData.alertsTriggered}`;
        
        // Show a brief flash when alert triggers
        alertCounter.style.animation = 'none';
        setTimeout(() => {
            alertCounter.style.animation = 'flash 0.5s';
        }, 10);
    }
    
    // Play loud alert sound
    playLoudAlert() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Create a more alarming sound pattern
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1500, audioContext.currentTime + 0.1);
            oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.2);
            
            oscillator.type = 'square'; // Harsher sound for alert
            
            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime); // Louder
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 1);
            
            // Repeat the alert
            setTimeout(() => {
                if (this.alertStatus === 'alert') {
                    this.playLoudAlert();
                }
            }, 1500);
        } catch (error) {
            console.log('Audio not supported:', error);
        }
    }

    // Session management functions
    startSession() {
        this.sessionData.startTime = Date.now();
        this.sessionData.alertsTriggered = 0;
        this.sessionData.totalDrowsyTime = 0;
        this.sessionData.averageEAR = 0.25;
        this.sessionData.earValues = []; // Track EAR values for averaging
        this.sessionData.drowsyFrames = 0; // Track drowsy frames
        console.log('📊 Session started');
        
        // Start real-time timer
        this.startSessionTimer();
    }
    
    // Start real-time session timer
    startSessionTimer() {
        // Clear any existing timer
        if (this.sessionTimerInterval) {
            clearInterval(this.sessionTimerInterval);
        }
        
        // Update timer every second
        this.sessionTimerInterval = setInterval(() => {
            this.updateSessionTimer();
        }, 1000);
        
        // Initial update
        this.updateSessionTimer();
    }
    
    // Update session timer display
    updateSessionTimer() {
        if (!this.sessionData || !this.sessionData.startTime) {
            return;
        }
        
        const currentDuration = Date.now() - this.sessionData.startTime;
        const seconds = Math.floor(currentDuration / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        // Find or create timer display element
        let timerElement = document.getElementById('sessionTimer');
        if (!timerElement) {
            // Create timer element if it doesn't exist
            timerElement = document.createElement('div');
            timerElement.id = 'sessionTimer';
            timerElement.style.cssText = `
                position: fixed;
                top: 50px;
                right: 10px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px 15px;
                border-radius: 20px;
                font-weight: bold;
                z-index: 1000;
                font-size: 14px;
                font-family: monospace;
            `;
            document.body.appendChild(timerElement);
        }
        
        // Update timer display
        timerElement.textContent = `Time: ${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        
        console.log(`⏱️ Session time: ${minutes}:${remainingSeconds.toString().padStart(2, '0')}`);
    }
    
    // Stop session timer
    stopSessionTimer() {
        if (this.sessionTimerInterval) {
            clearInterval(this.sessionTimerInterval);
            this.sessionTimerInterval = null;
        }
        
        // Remove timer element
        const timerElement = document.getElementById('sessionTimer');
        if (timerElement) {
            timerElement.remove();
        }
    }

    endSession() {
        console.log('🔍 endSession() called');
        console.log('🔍 Session data:', this.sessionData);
        
        // Stop the real-time timer
        this.stopSessionTimer();
        
        if (this.sessionData && this.sessionData.startTime) {
            const duration = Date.now() - this.sessionData.startTime;
            
            // Calculate final average EAR
            if (this.sessionData.earValues && this.sessionData.earValues.length > 0) {
                this.sessionData.averageEAR = this.sessionData.earValues.reduce((a, b) => a + b, 0) / this.sessionData.earValues.length;
            }
            
            console.log(`📊 Session ended: ${Math.round(duration / 1000)}s, ${this.sessionData.alertsTriggered} alerts, avg EAR: ${this.sessionData.averageEAR.toFixed(3)}`);
            
            this.saveSessionData(duration);
            
            // Show session summary with accurate time
            const minutes = Math.floor(duration / 60000);
            const seconds = Math.floor((duration % 60000) / 1000);
            this.showNotification(`Session complete: ${minutes}:${seconds.toString().padStart(2, '0')}, ${this.sessionData.alertsTriggered} alerts`, 'info');
        } else {
            console.log('❌ No session data found - session not started properly');
            // Force create a session if none exists
            this.sessionData = {
                startTime: Date.now() - 5000, // Assume 5 seconds ago
                alertsTriggered: 0,
                totalDrowsyTime: 0,
                averageEAR: 0.25,
                earValues: [],
                drowsyFrames: 0
            };
            this.endSession(); // Retry with forced session
        }
    }

    saveSessionData(duration) {
        console.log('🔍 saveSessionData() called with duration:', duration);
        
        const sessions = JSON.parse(localStorage.getItem('driverSafetySessions') || '[]');
        console.log('🔍 Existing sessions:', sessions.length);
        
        const sessionData = {
            date: new Date().toISOString(),
            duration: Math.round(duration / 1000),
            alertsTriggered: this.sessionData.alertsTriggered || 0,
            averageEAR: this.sessionData.averageEAR || 0.25,
            drowsyFrames: this.sessionData.drowsyFrames || 0,
            totalDrowsyTime: this.sessionData.totalDrowsyTime || 0
        };
        
        console.log('🔍 New session data:', sessionData);
        
        sessions.push(sessionData);
        localStorage.setItem('driverSafetySessions', JSON.stringify(sessions));
        
        console.log('🔍 Sessions saved to localStorage. Total sessions:', sessions.length);
        
        // Update UI with latest session
        this.updateSessionDisplay(sessionData);
        
        // Reset session data for next session
        this.sessionData = {
            startTime: null,
            alertsTriggered: 0,
            totalDrowsyTime: 0,
            averageEAR: 0.25,
            earValues: [],
            drowsyFrames: 0
        };
    }
    
    // Update session display
    updateSessionDisplay(sessionData) {
        console.log('🔍 updateSessionDisplay() called');
        
        // Update total sessions count
        const totalSessionsElement = document.getElementById('totalSessions');
        if (totalSessionsElement) {
            const sessions = JSON.parse(localStorage.getItem('driverSafetySessions') || '[]');
            totalSessionsElement.textContent = sessions.length;
            console.log('🔍 Updated total sessions:', sessions.length);
        } else {
            console.log('❌ totalSessions element not found');
        }
        
        // Update average session duration
        const avgSessionElement = document.getElementById('avgSession');
        if (avgSessionElement) {
            const sessions = JSON.parse(localStorage.getItem('driverSafetySessions') || '[]');
            if (sessions.length > 0) {
                const avgDuration = sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length;
                const avgMinutes = Math.round(avgDuration / 60);
                avgSessionElement.textContent = `${avgMinutes} min`;
                console.log('🔍 Updated avg session:', avgMinutes, 'min');
            }
        } else {
            console.log('❌ avgSession element not found');
        }
        
        // Update sessions today
        const todaySessionsElement = document.querySelector('.stat-value');
        if (todaySessionsElement) {
            const sessions = JSON.parse(localStorage.getItem('driverSafetySessions') || '[]');
            const today = new Date().toDateString();
            const todayCount = sessions.filter(s => new Date(s.date).toDateString() === today).length;
            todaySessionsElement.textContent = todayCount;
            console.log('🔍 Updated sessions today:', todayCount);
        } else {
            console.log('❌ stat-value element not found');
        }
        
        // Update history screen
        this.updateHistoryDisplay();
    }
    
    // Update history display
    updateHistoryDisplay() {
        const sessions = JSON.parse(localStorage.getItem('driverSafetySessions') || '[]');
        const historyList = document.querySelector('.history-list');
        const historyEmpty = document.querySelector('.history-empty');
        
        if (sessions.length > 0 && historyList) {
            // Clear empty state
            if (historyEmpty) {
                historyEmpty.style.display = 'none';
            }
            
            // Update summary cards
            const totalSessionsElement = document.querySelector('.summary-value');
            if (totalSessionsElement) {
                totalSessionsElement.textContent = sessions.length;
            }
            
            // Create session list items
            let historyHTML = '';
            sessions.slice(-10).reverse().forEach(session => {
                const date = new Date(session.date);
                const time = date.toLocaleTimeString();
                const duration = Math.floor(session.duration / 60);
                const alerts = session.alertsTriggered;
                
                historyHTML += `
                    <div class="history-item">
                        <div class="history-info">
                            <div class="history-time">${time}</div>
                            <div class="history-details">
                                <span>${duration} min</span>
                                <span class="history-alerts">${alerts} alerts</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            // Remove existing items and add new ones
            const existingItems = historyList.querySelectorAll('.history-item');
            existingItems.forEach(item => item.remove());
            
            if (historyHTML) {
                historyList.insertAdjacentHTML('afterbegin', historyHTML);
            }
        }
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

    // Initialize app when DOM is loaded
    initializeApp() {
        // Load existing sessions
        this.loadSessions();
        
        // Update dashboard stats
        this.updateDashboardStats();
    }
    
    // Load sessions from localStorage
    loadSessions() {
        const saved = localStorage.getItem('driverSafetySessions');
        if (saved) {
            this.sessions = JSON.parse(saved);
        } else {
            this.sessions = [];
        }
    }
    
    // Update dashboard statistics
    updateDashboardStats() {
        // Update total sessions
        const totalSessionsElement = document.getElementById('totalSessions');
        if (totalSessionsElement) {
            totalSessionsElement.textContent = this.sessions.length;
        }
        
        // Update average session duration
        const avgSessionElement = document.getElementById('avgSession');
        if (avgSessionElement && this.sessions.length > 0) {
            const avgDuration = this.sessions.reduce((sum, s) => sum + s.duration, 0) / this.sessions.length;
            const avgMinutes = Math.round(avgDuration / 60);
            avgSessionElement.textContent = `${avgMinutes} min`;
        }
        
        // Update sessions today
        const todaySessionsElement = document.querySelector('.stat-value');
        if (todaySessionsElement) {
            const today = new Date().toDateString();
            const todayCount = this.sessions.filter(s => new Date(s.date).toDateString() === today).length;
            todaySessionsElement.textContent = todayCount;
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

    // Setup MediaPipe Face Mesh
    setupMediaPipe() {
        console.log('🔧 Setting up MediaPipe Face Mesh...');
        
        this.faceMesh = new FaceMesh({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            }
        });
        
        this.faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.3, // Lowered for better detection
            minTrackingConfidence: 0.3  // Lowered for better tracking
        });
        
        this.faceMesh.onResults((results) => this.onMediaPipeResults(results));
        
        console.log('✅ MediaPipe Face Mesh ready');
        this.showNotification('MediaPipe ready - Click Start Camera to begin', 'info');
    }
    
    // Handle MediaPipe results
    onMediaPipeResults(results) {
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            this.earValue = 0.25;
            this.updateEARDisplay();
            this.alertStatus = 'normal';
            this.updateAlertStatus('No Face', 'normal');
            return;
        }
        
        const faceLandmarks = results.multiFaceLandmarks[0];
        const ear = this.calculateEARFromLandmarks(faceLandmarks);
        
        if (ear !== null) {
            this.earValue = ear;
            this.updateEARDisplay();
            
            // Track EAR values for session data
            if (this.sessionData.earValues) {
                this.sessionData.earValues.push(ear);
                
                // Track drowsy frames
                if (ear < 0.2) {
                    this.sessionData.drowsyFrames++;
                }
            }
            
            this.checkDrowsiness();
        }
    }
    
    // Calculate EAR from MediaPipe landmarks
    calculateEARFromLandmarks(landmarks) {
        try {
            // Eye landmark indices (same as vision_module.py)
            const LEFT_EYE = [33, 160, 158, 133, 153, 144];
            const RIGHT_EYE = [362, 385, 387, 263, 373, 380];
            
            // Validate landmarks
            if (!landmarks || landmarks.length === 0) {
                console.log('❌ No landmarks provided');
                return 0.25;
            }
            
            // Get eye points with validation
            const leftEye = LEFT_EYE.map(i => {
                const point = landmarks[i];
                if (!point || point.x === undefined || point.y === undefined) {
                    console.log('❌ Invalid landmark point:', i, point);
                    return { x: 0, y: 0 };
                }
                return { x: point.x, y: point.y };
            });
            
            const rightEye = RIGHT_EYE.map(i => {
                const point = landmarks[i];
                if (!point || point.x === undefined || point.y === undefined) {
                    console.log('❌ Invalid landmark point:', i, point);
                    return { x: 0, y: 0 };
                }
                return { x: point.x, y: point.y };
            });
            
            // Calculate EAR for both eyes
            const leftEAR = this.calculateEAR(leftEye);
            const rightEAR = this.calculateEAR(rightEye);
            
            // Validate EAR values
            if (isNaN(leftEAR) || isNaN(rightEAR) || !isFinite(leftEAR) || !isFinite(rightEAR)) {
                console.log('❌ Invalid EAR values:', leftEAR, rightEAR);
                return 0.25;
            }
            
            const ear = (leftEAR + rightEAR) / 2.0;
            
            // Validate final EAR
            if (isNaN(ear) || !isFinite(ear)) {
                console.log('❌ Invalid final EAR:', ear);
                return 0.25;
            }
            
            // Add smoothing to reduce jitter
            if (this.earHistory === undefined) {
                this.earHistory = [];
            }
            
            this.earHistory.push(ear);
            if (this.earHistory.length > 5) {
                this.earHistory.shift();
            }
            
            const smoothEar = this.earHistory.reduce((a, b) => a + b, 0) / this.earHistory.length;
            
            console.log(`👁️ EAR: ${smoothEar.toFixed(3)} (L: ${leftEAR.toFixed(3)}, R: ${rightEAR.toFixed(3)})`);
            
            return smoothEar;
        } catch (error) {
            console.log('❌ Error in calculateEARFromLandmarks:', error);
            return 0.25;
        }
    }
    
    // Calculate Eye Aspect Ratio
    calculateEAR(eye) {
        try {
            // Validate eye points
            if (!eye || eye.length !== 6) {
                console.log('❌ Invalid eye points:', eye);
                return 0.25;
            }
            
            // Calculate distances with more precision
            const A = this.distance(eye[1], eye[5]);
            const B = this.distance(eye[2], eye[4]);
            const C = this.distance(eye[0], eye[3]);
            
            // Prevent division by zero and invalid values
            if (C === 0 || isNaN(C) || !isFinite(C)) {
                console.log('❌ Invalid eye distance C:', C);
                return 0.25;
            }
            
            if (isNaN(A) || isNaN(B) || !isFinite(A) || !isFinite(B)) {
                console.log('❌ Invalid eye distances A:', A, 'B:', B);
                return 0.25;
            }
            
            const ear = (A + B) / (2.0 * C);
            
            // Check for NaN or infinite results
            if (isNaN(ear) || !isFinite(ear)) {
                console.log('❌ Invalid EAR calculation:', ear);
                return 0.25;
            }
            
            // Clamp to reasonable range
            const clampedEar = Math.max(0.05, Math.min(0.4, ear));
            
            return clampedEar;
        } catch (error) {
            console.log('❌ Error in calculateEAR:', error);
            return 0.25;
        }
    }
    
    // Calculate distance between two points
    distance(p1, p2) {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    }

    // Start polling for eye data
    startPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        this.pollingInterval = setInterval(async () => {
            if (this.pythonBackendConnected) {
                try {
                    const response = await fetch(`${this.backendUrl}/api/eye-data`);
                    if (response.ok) {
                        const data = await response.json();
                        this.handleBackendData(data);
                    } else {
                        console.error('Backend response error:', response.status);
                        this.pythonBackendConnected = false;
                        this.stopPolling();
                    }
                } catch (error) {
                    console.error('Polling error:', error);
                    this.pythonBackendConnected = false;
                    this.stopPolling();
                }
            }
        }, 100); // Poll every 100ms for real-time updates
    }
    
    // Stop polling
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }
    
    // Handle data from Python backend
    handleBackendData(data) {
        if (data.type === 'eye_data') {
            if (data.face_detected) {
                this.earValue = data.ear;
                this.updateEARDisplay();
                this.checkDrowsiness();
            } else {
                this.earValue = 0.25;
                this.updateEARDisplay();
                this.alertStatus = 'normal';
                this.updateAlertStatus('No Face', 'normal');
            }
        }
    }
    
    // Send command to Python backend
    async sendBackendCommand(command) {
        try {
            const response = await fetch(`${this.backendUrl}/api/camera/${command}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('Command result:', result);
                return result;
            } else {
                console.error('Command failed:', response.status);
                return null;
            }
        } catch (error) {
            console.error('Command error:', error);
            return null;
        }
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
    // Global app instance
    const app = new DriverSafetyApp();
    
    // Make app globally available for debugging
    window.driverSafetyApp = app;
    
    // Initialize session tracking
    app.initializeApp();
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
