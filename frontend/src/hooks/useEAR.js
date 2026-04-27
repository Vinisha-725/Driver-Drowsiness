import { useState, useEffect, useRef, useCallback } from 'react'

const API_BASE_URL = 'http://localhost:8080/api'

export const useEAR = () => {
  const [earValue, setEarValue] = useState(0.25)
  const [baselineEAR, setBaselineEAR] = useState(0.25)
  const [threshold, setThreshold] = useState(0.20) // Backend threshold
  const [isCalibrating, setIsCalibrating] = useState(false)
  const [fps, setFps] = useState(0)
  const [isDetecting, setIsDetecting] = useState(false)
  const [alertTriggered, setAlertTriggered] = useState(false)
  const [drowsyFrames, setDrowsyFrames] = useState(0)
  const [cameraFrame, setCameraFrame] = useState(null)
  
  const intervalRef = useRef(null)
  const frameIntervalRef = useRef(null)
  
  // API call helper
  const apiCall = useCallback(async (endpoint, options = {}) => {
    try {
      const url = `${API_BASE_URL}${endpoint}`
      console.log(`🔍 API Call: ${url}`)
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log(`✅ API Response:`, data)
      return data
    } catch (error) {
      console.error(`❌ API call error for ${endpoint}:`, error)
      return null
    }
  }, [])
  
  // Start camera
  const startCamera = useCallback(async () => {
    console.log('🎥 Starting camera via API...')
    const result = await apiCall('/start_camera', { method: 'POST' })
    
    if (result) {
      console.log('✅ Camera started:', result.status)
      setIsDetecting(true)
      
      // Start polling for EAR data
      intervalRef.current = setInterval(async () => {
        const earData = await apiCall('/get_ear')
        if (earData) {
          setEarValue(earData.ear)
          setFps(earData.fps)
          setAlertTriggered(earData.alert_triggered)
          setDrowsyFrames(earData.drowsy_frames)
          setIsDetecting(earData.is_detecting)
          console.log('📊 EAR Data:', earData)
        }
      }, 100) // 10 FPS polling for balanced performance
      
      // Start polling for camera frames
      frameIntervalRef.current = setInterval(async () => {
        const frameData = await apiCall('/get_frame')
        if (frameData && frameData.frame) {
          const frameUrl = `data:image/jpeg;base64,${frameData.frame}?t=${Date.now()}`
          setCameraFrame(frameUrl)
          console.log('📸 Frame received, size:', frameData.frame.length)
        } else if (frameData && frameData.error) {
          console.error('❌ Frame error:', frameData.error)
        }
      }, 66) // ~15 FPS for frames (stable performance)
    }
  }, [apiCall])
  
  // Stop camera
  const stopCamera = useCallback(async () => {
    console.log('🛑 Stopping camera via API...')
    
    // Clear intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current)
      frameIntervalRef.current = null
    }
    
    const result = await apiCall('/stop_camera', { method: 'POST' })
    
    if (result) {
      console.log('✅ Camera stopped:', result.status)
      setIsDetecting(false)
      setCameraFrame(null)
      setEarValue(0.25)
      setFps(0)
      setAlertTriggered(false)
      setDrowsyFrames(0)
    }
  }, [apiCall])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Ensure camera is stopped when hook unmounts
      stopCamera()
    }
  }, [stopCamera])
  
  // Start calibration
  const startCalibration = useCallback(async () => {
    console.log('🎯 Starting calibration...')
    setIsCalibrating(true)
    
    const result = await apiCall('/calibrate_baseline', { method: 'POST' })
    
    if (result) {
      setBaselineEAR(result.baseline)
      setThreshold(result.threshold)
      console.log('✅ Calibration complete:', result)
    }
    
    setIsCalibrating(false)
  }, [apiCall])
  
  // Get system status
  const getStatus = useCallback(async () => {
    return await apiCall('/status')
  }, [apiCall])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current)
      }
      // Stop camera when component unmounts
      stopCamera()
    }
  }, [stopCamera])
  
  return {
    // State
    earValue,
    baselineEAR,
    threshold,
    isCalibrating,
    fps,
    isDetecting,
    alertTriggered,
    drowsyFrames,
    cameraFrame,
    
    // Methods
    startCamera,
    stopCamera,
    startCalibration,
    getStatus,
    setThreshold: (value) => setThreshold(value),
  }
}
