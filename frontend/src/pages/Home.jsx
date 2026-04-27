import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import SessionManager from '../utils/SessionManager'

const Home = () => {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [sessionTimer, setSessionTimer] = useState(0)
  const [stats, setStats] = useState({
    totalSessions: 0,
    todaySessions: 0,
    totalAlerts: 0,
    todayDuration: 0
  })
  
  const sessionManager = new SessionManager()
  const timerIntervalRef = useRef(null)
  const sessionStartTimeRef = useRef(null)
  
  // Load statistics on mount
  useEffect(() => {
    const statistics = sessionManager.getStatistics()
    setStats({
      totalSessions: statistics.totalSessions,
      todaySessions: statistics.todaySessions,
      totalAlerts: statistics.totalAlerts,
      todayDuration: statistics.todayDuration
    })
  }, [])
  
  // Handle session timer
  useEffect(() => {
    if (isMonitoring) {
      sessionStartTimeRef.current = Date.now()
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000)
        setSessionTimer(elapsed)
      }, 1000)
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
      setSessionTimer(0)
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [isMonitoring])
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }
  
  const startMonitoring = () => {
    setIsMonitoring(true)
  }
  
  const stopMonitoring = () => {
    setIsMonitoring(false)
    
    // Save session if it had duration
    if (sessionTimer > 0) {
      const sessionData = {
        date: new Date().toISOString(),
        duration: sessionTimer,
        alerts: 0, // This would be tracked during actual monitoring
        avgEAR: 0.25 // This would be calculated during actual monitoring
      }
      
      sessionManager.saveSession(sessionData)
      
      // Refresh stats
      const statistics = sessionManager.getStatistics()
      setStats({
        totalSessions: statistics.totalSessions,
        todaySessions: statistics.todaySessions,
        totalAlerts: statistics.totalAlerts,
        todayDuration: statistics.todayDuration
      })
    }
  }
  
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-neon-green mb-4">
          Driver Safety System
        </h1>
        <p className="text-gray-400 text-lg">
          Real-time drowsiness detection for safer driving
        </p>
      </div>
      
      {/* Monitoring Status */}
      <div className="glass-card p-8 text-center">
        <div className="mb-6">
          <div className={`inline-flex items-center space-x-3 px-6 py-3 rounded-full ${
            isMonitoring 
              ? 'bg-neon-green/20 text-neon-green border border-neon-green' 
              : 'bg-gray-800/50 text-gray-400 border border-gray-700'
          }`}>
            <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-neon-green animate-pulse' : 'bg-gray-500'}`} />
            <span className="font-semibold">
              {isMonitoring ? 'Monitoring Active' : 'System Idle'}
            </span>
          </div>
        </div>
        
        {isMonitoring && (
          <div className="mb-6">
            <div className="text-3xl font-mono text-neon-green mb-2">
              {formatTime(sessionTimer)}
            </div>
            <p className="text-sm text-gray-400">Session Duration</p>
          </div>
        )}
        
        <div className="flex justify-center space-x-4">
          {!isMonitoring ? (
            <Link to="/monitoring">
              <button 
                onClick={startMonitoring}
                className="btn-primary text-lg px-8 py-4 flex items-center space-x-3"
              >
                <span>▶️</span>
                <span>Start Monitoring</span>
              </button>
            </Link>
          ) : (
            <button 
              onClick={stopMonitoring}
              className="btn-danger text-lg px-8 py-4 flex items-center space-x-3"
            >
              <span>⏹️</span>
              <span>Stop Monitoring</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 text-center">
          <div className="text-3xl font-bold text-neon-green mb-2">
            {stats.todaySessions}
          </div>
          <p className="text-gray-400">Sessions Today</p>
        </div>
        
        <div className="glass-card p-6 text-center">
          <div className="text-3xl font-bold text-neon-green mb-2">
            {formatDuration(stats.todayDuration)}
          </div>
          <p className="text-gray-400">Today's Duration</p>
        </div>
        
        <div className="glass-card p-6 text-center">
          <div className="text-3xl font-bold text-neon-green mb-2">
            {stats.totalSessions}
          </div>
          <p className="text-gray-400">Total Sessions</p>
        </div>
        
        <div className="glass-card p-6 text-center">
          <div className="text-3xl font-bold text-neon-green mb-2">
            {stats.totalAlerts}
          </div>
          <p className="text-gray-400">Total Alerts</p>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/profile">
          <div className="glass-card p-6 hover:bg-dark-card/80 transition-all duration-300 cursor-pointer group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">👤</div>
            <h3 className="text-xl font-bold text-white mb-2">Profile</h3>
            <p className="text-gray-400">Manage your driver profile and baseline settings</p>
          </div>
        </Link>
        
        <Link to="/settings">
          <div className="glass-card p-6 hover:bg-dark-card/80 transition-all duration-300 cursor-pointer group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">⚙️</div>
            <h3 className="text-xl font-bold text-white mb-2">Settings</h3>
            <p className="text-gray-400">Configure alerts, sensitivity, and preferences</p>
          </div>
        </Link>
        
        <Link to="/history">
          <div className="glass-card p-6 hover:bg-dark-card/80 transition-all duration-300 cursor-pointer group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📊</div>
            <h3 className="text-xl font-bold text-white mb-2">History</h3>
            <p className="text-gray-400">View your monitoring history and statistics</p>
          </div>
        </Link>
      </div>
    </div>
  )
}

export default Home
