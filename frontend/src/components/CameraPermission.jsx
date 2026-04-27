import { useState } from 'react'

const CameraPermission = ({ onPermissionGranted, onPermissionDenied }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const requestPermission = async () => {
    setIsLoading(true)
    setError('')

    try {
      // Request camera permission using getUserMedia
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 320 },
          height: { ideal: 240 }
        } 
      })
      
      // Stop the stream immediately (we just wanted permission)
      stream.getTracks().forEach(track => track.stop())
      
      // Permission granted
      onPermissionGranted()
    } catch (err) {
      console.error('Camera permission error:', err)
      setError('Camera permission denied or not available')
      onPermissionDenied(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-card p-8 max-w-md mx-4">
        <div className="text-center">
          {/* Camera Icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-neon-green/20 rounded-full flex items-center justify-center border-2 border-neon-green">
            <svg className="w-10 h-10 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-4">Camera Permission Required</h2>

          {/* Description */}
          <p className="text-gray-400 mb-6">
            The Driver Safety System needs access to your camera to monitor for drowsiness in real-time.
            Your camera feed is processed locally and never leaves your device.
          </p>

          {/* Privacy Notice */}
          <div className="bg-dark-card/50 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-semibold text-white mb-2">Privacy Notice:</h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Camera feed is processed locally on your device</li>
              <li>• No video data is sent to external servers</li>
              <li>• Camera is only active during monitoring sessions</li>
              <li>• You can revoke permission at any time</li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={requestPermission}
              disabled={isLoading}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Requesting Permission...
                </span>
              ) : (
                'Allow Camera Access'
              )}
            </button>
            
            <button
              onClick={onPermissionDenied}
              disabled={isLoading}
              className="btn-secondary flex-1 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-gray-500 mt-4">
            If you accidentally denied permission, you'll need to refresh the page and try again.
          </p>
        </div>
      </div>
    </div>
  )
}

export default CameraPermission
