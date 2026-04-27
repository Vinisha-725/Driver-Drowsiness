import { useState, useEffect } from 'react'
import SessionManager from '../utils/SessionManager'

const Settings = () => {
  const [settings, setSettings] = useState({
    soundEnabled: true,
    vibrationEnabled: false,
    sensitivity: 'medium',
    saveHistory: true,
    userName: 'Driver',
    // Add new setting here
    newSetting: 'defaultValue'
  })
  
  const sessionManager = new SessionManager()
  
  // Load settings on mount
  useEffect(() => {
    const loadedSettings = sessionManager.getSettings()
    setSettings(loadedSettings)
  }, [])
  
  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    sessionManager.saveSettings(newSettings)
  }
  
  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This will delete all your session history and settings.')) {
      sessionManager.clearSessions()
      sessionManager.saveSettings({
        soundEnabled: true,
        vibrationEnabled: false,
        sensitivity: 'medium',
        saveHistory: true,
        userName: 'Driver'
      })
      setSettings({
        soundEnabled: true,
        vibrationEnabled: false,
        sensitivity: 'medium',
        saveHistory: true,
        userName: 'Driver'
      })
    }
  }
  
  const sensitivityOptions = [
    { value: 'low', label: 'Low', description: 'Less sensitive, fewer false alerts' },
    { value: 'medium', label: 'Medium', description: 'Balanced sensitivity' },
    { value: 'high', label: 'High', description: 'More sensitive, earlier warnings' }
  ]
  
  return (
    <div className="min-h-screen bg-dark-bg text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Configure your drowsiness detection preferences</p>
      </div>
      
      {/* Alert Preferences */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-6">Alert Preferences</h2>
        
        <div className="space-y-6">
          {/* Sound Alerts */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">Sound Alerts</h3>
              <p className="text-gray-400 text-sm">Enable audio alerts for drowsiness detection</p>
            </div>
            <button
              onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.soundEnabled ? 'bg-neon-green' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          {/* Vibration Alerts */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">Vibration Alerts</h3>
              <p className="text-gray-400 text-sm">Enable vibration alerts on mobile devices</p>
            </div>
            <button
              onClick={() => updateSetting('vibrationEnabled', !settings.vibrationEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.vibrationEnabled ? 'bg-neon-green' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.vibrationEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
      
      {/* Sensitivity Settings */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-6">Detection Sensitivity</h2>
        
        <div className="space-y-4">
          {sensitivityOptions.map((option) => (
            <div
              key={option.value}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                settings.sensitivity === option.value
                  ? 'border-neon-green bg-neon-green/10'
                  : 'border-dark-border hover:border-gray-600'
              }`}
              onClick={() => updateSetting('sensitivity', option.value)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold">{option.label}</h3>
                  <p className="text-gray-400 text-sm">{option.description}</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    settings.sensitivity === option.value
                      ? 'border-neon-green'
                      : 'border-gray-600'
                  }`}
                >
                  {settings.sensitivity === option.value && (
                    <div className="w-2 h-2 bg-neon-green rounded-full" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Data & Privacy */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-6">Data & Privacy</h2>
        
        <div className="space-y-6">
          {/* Save History */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">Save Session History</h3>
              <p className="text-gray-400 text-sm">Store monitoring sessions locally on your device</p>
            </div>
            <button
              onClick={() => updateSetting('saveHistory', !settings.saveHistory)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.saveHistory ? 'bg-neon-green' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.saveHistory ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          {/* Clear Data */}
          <div className="border-t border-dark-border pt-6">
            <button
              onClick={clearAllData}
              className="btn-danger"
            >
              <span className="flex items-center space-x-2">
                <span>🗑️</span>
                <span>Clear All Data</span>
              </span>
            </button>
            <p className="text-gray-400 text-sm mt-2">
              This will permanently delete all your session history and reset settings to default.
            </p>
          </div>
        </div>
      </div>
      
      {/* About */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-4">About</h2>
        <div className="space-y-3 text-gray-400">
          <p><strong>Driver Safety System</strong> v1.0.0</p>
          <p>Real-time drowsiness detection using advanced computer vision technology.</p>
          <p className="text-sm">
            This application uses MediaPipe Face Mesh for accurate eye tracking and runs entirely in your browser. 
            No data is sent to external servers - everything stays private on your device.
          </p>
          <div className="pt-4 border-t border-dark-border">
            <p className="text-sm"><strong>Features:</strong></p>
            <ul className="text-sm list-disc list-inside space-y-1 mt-2">
              <li>Real-time eye aspect ratio monitoring</li>
              <li>Multi-level alert system (sound & vibration)</li>
              <li>Session history and statistics</li>
              <li>Baseline calibration for personalized detection</li>
              <li>Privacy-focused local processing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

export default Settings
