import { useState, useEffect, useRef } from 'react'
import SessionManager from '../utils/SessionManager'

const Profile = () => {
  const [userName, setUserName] = useState('')
  const [baselineEAR, setBaselineEAR] = useState(0.25)
  const [isCalibrating, setIsCalibrating] = useState(false)
  const [calibrationProgress, setCalibrationProgress] = useState(0)
  const [statistics, setStatistics] = useState({
    totalSessions: 0,
    averageDuration: 0,
    totalAlerts: 0,
    averageAlerts: 0
  })
  
  const sessionManager = new SessionManager()
  const calibrationDataRef = useRef([])
  const calibrationIntervalRef = useRef(null)
  
  // Load user data on mount
  useEffect(() => {
    const settings = sessionManager.getSettings()
    setUserName(settings.userName)
    
    const savedBaseline = sessionManager.getBaselineEAR()
    setBaselineEAR(savedBaseline)
    
    const stats = sessionManager.getStatistics()
    setStatistics({
      totalSessions: stats.totalSessions,
      averageDuration: stats.averageDuration,
      totalAlerts: stats.totalAlerts,
      averageAlerts: stats.averageAlerts
    })
  }, [])
  
  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }
  
  const startCalibration = () => {
    setIsCalibrating(true)
    setCalibrationProgress(0)
    calibrationDataRef.current = []
    
    // Simulate calibration (in real app, this would use actual camera data)
    let progress = 0
    calibrationIntervalRef.current = setInterval(() => {
      progress += 2
      setCalibrationProgress(progress)
      
      // Simulate collecting EAR values
      if (progress % 10 === 0) {
        const simulatedEAR = 0.25 + (Math.random() - 0.5) * 0.05
        calibrationDataRef.current.push(simulatedEAR)
      }
      
      if (progress >= 100) {
        clearInterval(calibrationIntervalRef.current)
        
        if (calibrationDataRef.current.length > 0) {
          const newBaseline = calibrationDataRef.current.reduce((a, b) => a + b, 0) / calibrationDataRef.current.length
          setBaselineEAR(newBaseline)
          sessionManager.saveBaselineEAR(newBaseline)
        }
        
        setIsCalibrating(false)
        setCalibrationProgress(0)
        calibrationDataRef.current = []
      }
    }, 60) // 6 seconds total
  }
  
  const resetProfile = () => {
    if (confirm('Are you sure you want to reset your profile? This will clear all your data.')) {
      sessionManager.clearSessions()
      sessionManager.saveBaselineEAR(0.25)
      setBaselineEAR(0.25)
      setStatistics({
        totalSessions: 0,
        averageDuration: 0,
        totalAlerts: 0,
        averageAlerts: 0
      })
    }
  }
  
  const saveUserName = () => {
    const settings = sessionManager.getSettings()
    settings.userName = userName
    sessionManager.saveSettings(settings)
  }
  
  return (
    <div className="min-h-screen bg-dark-bg text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Driver Profile</h1>
        <p className="text-gray-400">Manage your profile and calibration settings</p>
      </div>
      
      {/* Profile Card */}
      <div className="glass-card p-8">
        <div className="flex items-center space-x-6 mb-8">
          <div className="w-20 h-20 bg-neon-green/20 rounded-full flex items-center justify-center border-2 border-neon-green">
            <span className="text-3xl">👤</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{userName}</h2>
            <p className="text-gray-400">Driver ID: DRV-{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
          </div>
        </div>
        
        {/* User Name Input */}
        <div className="mb-8">
          <label className="block text-white font-semibold mb-2">User Name</label>
          <div className="flex space-x-4">
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="flex-1 bg-dark-card border border-dark-border rounded-lg px-4 py-2 text-white focus:border-neon-green focus:outline-none"
              placeholder="Enter your name"
            />
            <button
              onClick={saveUserName}
              className="btn-primary"
            >
              Save Name
            </button>
          </div>
        </div>
        
        {/* Baseline EAR */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Baseline EAR</h3>
            <div className="text-2xl font-bold text-neon-green">
              {baselineEAR.toFixed(3)}
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>0.15</span>
              <span>Normal Range: 0.20 - 0.35</span>
              <span>0.40</span>
            </div>
            <div className="w-full bg-dark-border rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-neon-green transition-all duration-300"
                style={{ width: `${(baselineEAR / 0.4) * 100}%` }}
              />
            </div>
          </div>
          
          <button
            onClick={startCalibration}
            disabled={isCalibrating}
            className="btn-secondary w-full disabled:opacity-50"
          >
            <span className="flex items-center justify-center space-x-2">
              <span>🎯</span>
              <span>{isCalibrating ? 'Calibrating...' : 'Calibrate Baseline'}</span>
            </span>
          </button>
          
          {isCalibrating && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Calibration Progress</span>
                <span>{calibrationProgress}%</span>
              </div>
              <div className="w-full bg-dark-border rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-neon-yellow transition-all duration-300"
                  style={{ width: `${calibrationProgress}%` }}
                />
              </div>
              <p className="text-sm text-neon-yellow mt-2">
                Keep your eyes open and look straight ahead...
              </p>
            </div>
          )}
        </div>
        
        {/* Statistics */}
        <div className="border-t border-dark-border pt-8">
          <h3 className="text-lg font-bold text-white mb-6">Your Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-neon-green mb-1">
                {statistics.totalSessions}
              </div>
              <p className="text-sm text-gray-400">Total Sessions</p>
            </div>
            
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-neon-green mb-1">
                {formatDuration(statistics.averageDuration)}
              </div>
              <p className="text-sm text-gray-400">Avg Duration</p>
            </div>
            
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-neon-green mb-1">
                {statistics.totalAlerts}
              </div>
              <p className="text-sm text-gray-400">Total Alerts</p>
            </div>
            
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-neon-green mb-1">
                {statistics.averageAlerts}
              </div>
              <p className="text-sm text-gray-400">Avg Alerts</p>
            </div>
          </div>
        </div>
        
        {/* Reset Button */}
        <div className="border-t border-dark-border pt-8">
          <button
            onClick={resetProfile}
            className="btn-danger"
          >
            <span className="flex items-center space-x-2">
              <span>🔄</span>
              <span>Reset Profile</span>
            </span>
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}

export default Profile
