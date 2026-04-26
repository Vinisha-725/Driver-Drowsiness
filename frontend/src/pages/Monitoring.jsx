import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEAR } from '../hooks/useEAR'
import AlertSystem from '../components/AlertSystem'
import CameraFeed from '../components/CameraFeed'
import EARDisplay from '../components/EARDisplay'
import SessionManager from '../utils/SessionManager'

const Monitoring = () => {
  const navigate = useNavigate()
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [sessionStartTime, setSessionStartTime] = useState(null)
  const [sessionData, setSessionData] = useState({
    alerts: 0,
    earValues: [],
    drowsyFrames: 0
  })
  
  const sessionManager = new SessionManager()
  const timerIntervalRef = useRef(null)
  const sessionTimerRef = useRef(0)
  
  const {
    earValue,
    baselineEAR,
    threshold,
    isCalibrating,
    fps,
    isDetecting,
    alertTriggered,
    drowsyFrames,
    cameraFrame,
    startCamera,
    stopCamera,
    startCalibration
  } = useEAR()
  
  const settings = sessionManager.getSettings()
  
  // Load baseline on mount
  useEffect(() => {
    const savedBaseline = sessionManager.getBaselineEAR()
    if (savedBaseline !== baselineEAR) {
      // Update baseline in useEAR hook if needed
    }
  }, [])
  
  // Handle session timer
  useEffect(() => {
    if (isMonitoring && sessionStartTime) {
      timerIntervalRef.current = setInterval(() => {
        sessionTimerRef.current = Math.floor((Date.now() - sessionStartTime) / 1000)
      }, 1000)
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
      sessionTimerRef.current = 0
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [isMonitoring, sessionStartTime])
  
  // Track EAR values during session
  useEffect(() => {
    if (isMonitoring && earValue !== null) {
      setSessionData(prev => ({
        ...prev,
        earValues: [...prev.earValues, earValue],
        drowsyFrames: earValue < threshold ? prev.drowsyFrames + 1 : prev.drowsyFrames
      }))
    }
  }, [earValue, isMonitoring, threshold])
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  const startMonitoring = async () => {
    try {
      await startCamera()
      setIsMonitoring(true)
      setSessionStartTime(Date.now())
      setSessionData({
        alerts: 0,
        earValues: [],
        drowsyFrames: 0
      })
    } catch (error) {
      console.error('Error starting monitoring:', error)
    }
  }
  
  const stopMonitoring = () => {
    stopCamera()
    setIsMonitoring(false)
    
    // Save session if it had duration
    if (sessionTimerRef.current > 0) {
      const avgEAR = sessionData.earValues.length > 0 
        ? sessionData.earValues.reduce((a, b) => a + b, 0) / sessionData.earValues.length 
        : 0.25
      
      const sessionDataToSave = {
        date: new Date().toISOString(),
        duration: sessionTimerRef.current,
        alerts: sessionData.alerts,
        avgEAR: avgEAR,
        drowsyFrames: sessionData.drowsyFrames,
        baselineEAR: baselineEAR
      }
      
      sessionManager.saveSession(sessionDataToSave)
    }
    
    navigate('/')
  }
  
  const handleAlertTriggered = () => {
    setSessionData(prev => ({
      ...prev,
      alerts: prev.alerts + 1
    }))
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Monitoring</h1>
          <p className="text-gray-400">Real-time drowsiness detection</p>
        </div>
        
        {isMonitoring && (
          <div className="glass-card px-6 py-3">
            <div className="text-2xl font-mono text-neon-green">
              {formatTime(sessionTimerRef.current)}
            </div>
          </div>
        )}
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Feed */}
        <div className="lg:col-span-2">
          <CameraFeed 
            cameraFrame={cameraFrame}
            isDetecting={isDetecting}
            fps={fps}
          />
          
          {/* Controls */}
          <div className="glass-card p-6 mt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-neon-green animate-pulse' : 'bg-gray-500'}`} />
                  <span className="text-white">
                    {isMonitoring ? 'Monitoring Active' : 'Camera Ready'}
                  </span>
                </div>
                
                {isDetecting && (
                  <div className="text-sm text-neon-green">
                    Face Detected
                  </div>
                )}
              </div>
              
              <div className="flex space-x-4">
                {!isMonitoring ? (
                  <button 
                    onClick={startMonitoring}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <span>▶️</span>
                    <span>Start Monitoring</span>
                  </button>
                ) : (
                  <button 
                    onClick={stopMonitoring}
                    className="btn-danger flex items-center space-x-2"
                  >
                    <span>⏹️</span>
                    <span>Stop Monitoring</span>
                  </button>
                )}
                
                {!isMonitoring && (
                  <button 
                    onClick={startCalibration}
                    disabled={isCalibrating}
                    className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
                  >
                    <span>🎯</span>
                    <span>{isCalibrating ? 'Calibrating...' : 'Calibrate'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Side Panel */}
        <div className="space-y-6">
          {/* EAR Display */}
          <EARDisplay 
            earValue={earValue}
            threshold={threshold}
            baselineEAR={baselineEAR}
          />
          
          {/* Alert System */}
          <AlertSystem 
            earValue={earValue}
            threshold={threshold}
            isDetecting={isDetecting}
            soundEnabled={settings.soundEnabled}
            vibrationEnabled={settings.vibrationEnabled}
            onAlertTriggered={handleAlertTriggered}
          />
          
          {/* Session Stats */}
          {isMonitoring && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-4">Session Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Alerts:</span>
                  <span className="text-white font-bold">{sessionData.alerts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Drowsy Frames:</span>
                  <span className="text-white font-bold">{sessionData.drowsyFrames}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">EAR Samples:</span>
                  <span className="text-white font-bold">{sessionData.earValues.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Baseline:</span>
                  <span className="text-white font-bold">{baselineEAR.toFixed(3)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Calibration Notice */}
      {isCalibrating && (
        <div className="glass-card p-4 border-2 border-neon-yellow bg-neon-yellow/10">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-neon-yellow rounded-full animate-pulse" />
            <span className="text-neon-yellow font-semibold">
              Calibrating baseline... Keep your eyes open and look straight ahead.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default Monitoring
