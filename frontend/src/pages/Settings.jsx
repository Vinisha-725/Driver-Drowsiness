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
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6 animate-fadeInUp">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-2">Settings</h1>
        <p className="text-gray-400 text-lg">Configure your drowsiness detection preferences</p>
      </div>
      
      {/* Alert Preferences */}
      <div className="card-professional p-6">
        <h2 className="text-xl font-bold text-white mb-6">Alert Preferences</h2>
        
        <div className="space-y-6">
          {/* Sound Alerts */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">Sound Alerts</h3>
              <p className="text-gray-400 text-sm">Enable audio alerts for drowsiness detection</p>
            </div>
            <div
              onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
              className={`toggle-switch ${settings.soundEnabled ? 'active' : ''}`}
            />
          </div>
          
          {/* Vibration Alerts */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">Vibration Alerts</h3>
              <p className="text-gray-400 text-sm">Enable vibration alerts on mobile devices</p>
            </div>
            <div
              onClick={() => updateSetting('vibrationEnabled', !settings.vibrationEnabled)}
              className={`toggle-switch ${settings.vibrationEnabled ? 'active' : ''}`}
            />
          </div>
        </div>
      </div>
      
      {/* Sensitivity Settings */}
      <div className="card-professional p-6">
        <h2 className="text-xl font-bold text-white mb-6">Detection Sensitivity</h2>
        
        <div className="space-y-4">
          {sensitivityOptions.map((option) => (
            <div
              key={option.value}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                settings.sensitivity === option.value
                  ? 'border-blue-400 bg-blue-400/10'
                  : 'border-gray-600 hover:border-gray-500'
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
                      ? 'border-blue-400'
                      : 'border-gray-600'
                  }`}
                >
                  {settings.sensitivity === option.value && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Data & Privacy */}
      <div className="card-professional p-6">
        <h2 className="text-xl font-bold text-white mb-6">Data & Privacy</h2>
        
        <div className="space-y-6">
          {/* Save History */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">Save Session History</h3>
              <p className="text-gray-400 text-sm">Store monitoring sessions locally on your device</p>
            </div>
            <div
              onClick={() => updateSetting('saveHistory', !settings.saveHistory)}
              className={`toggle-switch ${settings.saveHistory ? 'active' : ''}`}
            />
          </div>
          
          {/* Clear Data */}
          <div className="border-t border-gray-700 pt-6">
            <button
              onClick={clearAllData}
              className="btn-danger"
            >
              <span className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
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
      <div className="card-professional p-6">
        <h2 className="text-xl font-bold text-white mb-4">About</h2>
        <div className="space-y-3 text-gray-400">
          <p><strong>Driver Safety System</strong> v1.0.0</p>
          <p>Real-time drowsiness detection using advanced computer vision technology.</p>
          <p className="text-sm">
            This application uses MediaPipe Face Mesh for accurate eye tracking and runs entirely in your browser. 
            No data is sent to external servers - everything stays private on your device.
          </p>
          <div className="pt-4 border-t border-gray-700">
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
