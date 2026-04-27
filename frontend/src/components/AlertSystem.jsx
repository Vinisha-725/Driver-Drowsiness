import { useState, useEffect, useRef, useCallback } from 'react'

const AlertSystem = ({ 
  earValue, 
  threshold, 
  isDetecting, 
  soundEnabled = true, 
  vibrationEnabled = false,
  onAlertTriggered 
}) => {
  const [alertStatus, setAlertStatus] = useState('idle') // idle, warning, alert
  const [alertCount, setAlertCount] = useState(0)
  const [drowsyFrameCount, setDrowsyFrameCount] = useState(0)
  
  const audioContextRef = useRef(null)
  const warningBeepIntervalRef = useRef(null)
  const lastAlertTimeRef = useRef(0)
  
  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    
    return () => {
      if (warningBeepIntervalRef.current) {
        clearInterval(warningBeepIntervalRef.current)
      }
    }
  }, [])
  
  // Play beep sound
  const playBeep = useCallback((frequency, duration) => {
    if (!soundEnabled || !audioContextRef.current) return
    
    try {
      const oscillator = audioContextRef.current.createOscillator()
      const gainNode = audioContextRef.current.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)
      
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime)
      
      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration / 1000)
      
      oscillator.start(audioContextRef.current.currentTime)
      oscillator.stop(audioContextRef.current.currentTime + duration / 1000)
    } catch (error) {
      console.error('Error playing beep:', error)
    }
  }, [soundEnabled])
  
  // Play loud alert sound
  const playLoudAlert = useCallback(() => {
    if (!soundEnabled || !audioContextRef.current) return
    
    try {
      const oscillator = audioContextRef.current.createOscillator()
      const gainNode = audioContextRef.current.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)
      
      oscillator.type = 'square'
      oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContextRef.current.currentTime + 0.5)
      
      gainNode.gain.setValueAtTime(0.5, audioContextRef.current.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 1)
      
      oscillator.start(audioContextRef.current.currentTime)
      oscillator.stop(audioContextRef.current.currentTime + 1)
    } catch (error) {
      console.error('Error playing loud alert:', error)
    }
  }, [soundEnabled])
  
  // Start warning beeps
  const startWarningBeeps = useCallback(() => {
    if (warningBeepIntervalRef.current) {
      clearInterval(warningBeepIntervalRef.current)
    }
    
    warningBeepIntervalRef.current = setInterval(() => {
      playBeep(600, 100)
    }, 1000)
  }, [playBeep])
  
  // Stop warning beeps
  const stopWarningBeeps = useCallback(() => {
    if (warningBeepIntervalRef.current) {
      clearInterval(warningBeepIntervalRef.current)
      warningBeepIntervalRef.current = null
    }
  }, [])
  
  // Trigger vibration
  const triggerVibration = useCallback(() => {
    if (vibrationEnabled && navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200])
    }
  }, [vibrationEnabled])
  
  // Check drowsiness and trigger alerts
  useEffect(() => {
    if (!isDetecting || earValue === null) {
      setAlertStatus('idle')
      setDrowsyFrameCount(0)
      stopWarningBeeps()
      return
    }
    
    const now = Date.now()
    
    if (earValue < threshold) {
      // Below threshold - warning
      if (alertStatus === 'idle') {
        setAlertStatus('warning')
        setDrowsyFrameCount(0)
        startWarningBeeps()
      }
      
      setDrowsyFrameCount(prev => prev + 1)
      
      // Very low EAR - continuous loud alert
      if (earValue < threshold * 0.6) { // 60% of threshold
        // Continuous alert - keep beeping until EAR is normal
        if (alertStatus !== 'alert') {
          setAlertStatus('alert')
          stopWarningBeeps()
        }
        
        // Play loud alert every 1 second while EAR is low
        if (now - lastAlertTimeRef.current > 1000) {
          playLoudAlert()
          triggerVibration()
          setAlertCount(prev => prev + 1)
          lastAlertTimeRef.current = now
          
          if (onAlertTriggered) {
            onAlertTriggered()
          }
        }
      }
    } else {
      // Above threshold - normal
      if (alertStatus !== 'idle') {
        setAlertStatus('idle')
        setDrowsyFrameCount(0)
        stopWarningBeeps()
      }
    }
  }, [earValue, threshold, isDetecting, alertStatus, startWarningBeeps, stopWarningBeeps, playLoudAlert, triggerVibration, onAlertTriggered])
  
  // Get status color and text
  const getStatusInfo = () => {
    switch (alertStatus) {
      case 'warning':
        return { color: 'text-neon-yellow', bgColor: 'bg-neon-yellow/20', borderColor: 'border-neon-yellow', text: 'WARNING' }
      case 'alert':
        return { color: 'text-neon-red', bgColor: 'bg-neon-red/20', borderColor: 'border-neon-red', text: '🚨 DROWSY! 🚨' }
      default:
        return { color: 'text-neon-purple', bgColor: 'bg-neon-purple/20', borderColor: 'border-neon-purple', text: 'MONITORING' }
    }
  }
  
  const statusInfo = getStatusInfo()
  
  return (
    <div className="flex items-center space-x-4">
      {/* Alert Counter */}
      <div className="glass-card px-4 py-2 flex items-center space-x-2">
        <span className="text-sm text-gray-400">Alerts:</span>
        <span className="text-lg font-bold text-white">{alertCount}</span>
      </div>
      
      {/* Status Indicator */}
      <div className={`glass-card px-6 py-3 border-2 ${statusInfo.borderColor} ${statusInfo.bgColor}`}>
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${statusInfo.color} animate-pulse`} />
          <span className={`font-bold ${statusInfo.color}`}>{statusInfo.text}</span>
        </div>
      </div>
      
      {/* Drowsy Frame Counter */}
      {drowsyFrameCount > 0 && (
        <div className="glass-card px-4 py-2">
          <span className="text-sm text-gray-400">Frames: {drowsyFrameCount}</span>
        </div>
      )}
    </div>
  )
}

export default AlertSystem
