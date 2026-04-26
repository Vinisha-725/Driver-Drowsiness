class SessionManager {
  constructor() {
    this.storageKey = 'driverSafetySessions'
    this.settingsKey = 'driverSafetySettings'
  }
  
  // Get all sessions from localStorage
  getSessions() {
    try {
      const sessions = localStorage.getItem(this.storageKey)
      return sessions ? JSON.parse(sessions) : []
    } catch (error) {
      console.error('Error getting sessions:', error)
      return []
    }
  }
  
  // Save a session to localStorage
  saveSession(sessionData) {
    try {
      const sessions = this.getSessions()
      sessions.push(sessionData)
      localStorage.setItem(this.storageKey, JSON.stringify(sessions))
      return true
    } catch (error) {
      console.error('Error saving session:', error)
      return false
    }
  }
  
  // Get sessions for today
  getTodaySessions() {
    const sessions = this.getSessions()
    const today = new Date().toDateString()
    return sessions.filter(session => 
      new Date(session.date).toDateString() === today
    )
  }
  
  // Get session statistics
  getStatistics() {
    const sessions = this.getSessions()
    
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalDuration: 0,
        totalAlerts: 0,
        averageDuration: 0,
        averageAlerts: 0,
        todaySessions: 0,
        todayDuration: 0,
        todayAlerts: 0
      }
    }
    
    const totalDuration = sessions.reduce((sum, session) => sum + session.duration, 0)
    const totalAlerts = sessions.reduce((sum, session) => sum + session.alerts, 0)
    
    const todaySessions = this.getTodaySessions()
    const todayDuration = todaySessions.reduce((sum, session) => sum + session.duration, 0)
    const todayAlerts = todaySessions.reduce((sum, session) => sum + session.alerts, 0)
    
    return {
      totalSessions: sessions.length,
      totalDuration,
      totalAlerts,
      averageDuration: Math.round(totalDuration / sessions.length),
      averageAlerts: Math.round(totalAlerts / sessions.length),
      todaySessions: todaySessions.length,
      todayDuration,
      todayAlerts
    }
  }
  
  // Clear all sessions
  clearSessions() {
    try {
      localStorage.removeItem(this.storageKey)
      return true
    } catch (error) {
      console.error('Error clearing sessions:', error)
      return false
    }
  }
  
  // Get user settings
  getSettings() {
    try {
      const settings = localStorage.getItem(this.settingsKey)
      return settings ? JSON.parse(settings) : {
        soundEnabled: true,
        vibrationEnabled: false,
        sensitivity: 'medium',
        saveHistory: true,
        userName: 'Driver'
      }
    } catch (error) {
      console.error('Error getting settings:', error)
      return {
        soundEnabled: true,
        vibrationEnabled: false,
        sensitivity: 'medium',
        saveHistory: true,
        userName: 'Driver'
      }
    }
  }
  
  // Save user settings
  saveSettings(settings) {
    try {
      localStorage.setItem(this.settingsKey, JSON.stringify(settings))
      return true
    } catch (error) {
      console.error('Error saving settings:', error)
      return false
    }
  }
  
  // Get baseline EAR
  getBaselineEAR() {
    try {
      const baseline = localStorage.getItem('driverBaselineEAR')
      return baseline ? parseFloat(baseline) : 0.25
    } catch (error) {
      console.error('Error getting baseline EAR:', error)
      return 0.25
    }
  }
  
  // Save baseline EAR
  saveBaselineEAR(baseline) {
    try {
      localStorage.setItem('driverBaselineEAR', baseline.toString())
      return true
    } catch (error) {
      console.error('Error saving baseline EAR:', error)
      return false
    }
  }
}

export default SessionManager
