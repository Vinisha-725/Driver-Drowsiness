const CameraFeed = ({ isDetecting, fps, cameraFrame }) => {
  return (
    <div className="relative glass-card p-4">
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
        {/* Camera Frame from Backend */}
        {cameraFrame ? (
          <img
            src={cameraFrame}
            alt="Camera Feed"
            className="absolute inset-0 w-full h-full object-cover"
            onLoad={() => console.log('✅ Camera frame loaded successfully')}
            onError={(e) => console.error('❌ Camera frame failed to load:', e)}
            key={Date.now()} // Force re-render on each frame
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 border-2 border-gray-600 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 bg-gray-600 rounded-full"></div>
              </div>
              <p className="text-gray-400">
                {isDetecting ? 'Waiting for camera feed...' : 'Click "Start Camera" to begin'}
              </p>
              {isDetecting && (
                <p className="text-gray-500 text-sm mt-2">Backend is processing frames...</p>
              )}
            </div>
          </div>
        )}
        
        {/* Status Overlay */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <div className="glass-card px-3 py-2">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isDetecting ? 'bg-neon-green animate-pulse' : 'bg-gray-500'}`} />
              <span className="text-sm text-white">
                {isDetecting ? 'Backend Processing' : 'Backend Idle'}
              </span>
            </div>
          </div>
          
          {fps > 0 && (
            <div className="glass-card px-3 py-2">
              <span className="text-sm text-white">FPS: {Math.round(fps)}</span>
            </div>
          )}
        </div>
        
        {/* Center Crosshair */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 border-2 border-neon-green/30 rounded-full">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-neon-green/30 -translate-y-1/2" />
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-neon-green/30 -translate-x-1/2" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CameraFeed
