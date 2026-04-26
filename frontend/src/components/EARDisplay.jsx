const EARDisplay = ({ earValue, threshold, baselineEAR }) => {
  const getEARColor = () => {
    if (earValue < threshold * 0.6) return 'text-neon-red'
    if (earValue < threshold) return 'text-neon-yellow'
    return 'text-neon-green'
  }
  
  const getEARStatus = () => {
    if (earValue < threshold * 0.6) return 'DROWSY'
    if (earValue < threshold) return 'WARNING'
    return 'NORMAL'
  }
  
  const getProgressColor = () => {
    if (earValue < threshold * 0.6) return 'bg-neon-red'
    if (earValue < threshold) return 'bg-neon-yellow'
    return 'bg-neon-green'
  }
  
  const progressPercentage = Math.min((earValue / 0.4) * 100, 100)
  
  return (
    <div className="glass-card p-6">
      <div className="space-y-4">
        {/* Title */}
        <div className="text-center">
          <h3 className="text-lg font-bold text-white mb-2">Eye Aspect Ratio</h3>
          <div className="text-3xl font-bold mb-2">
            <span className={getEARColor()}>
              {earValue.toFixed(3)}
            </span>
          </div>
          <div className={`text-sm font-semibold ${getEARColor()}`}>
            {getEARStatus()}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-400">
            <span>0.0</span>
            <span>Threshold: {threshold.toFixed(3)}</span>
            <span>0.4</span>
          </div>
          <div className="w-full bg-dark-border rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        
        {/* Baseline Info */}
        {baselineEAR && (
          <div className="text-center text-sm text-gray-400">
            Baseline: {baselineEAR.toFixed(3)}
          </div>
        )}
        
        {/* Visual Indicator */}
        <div className="flex justify-center">
          <div className={`w-16 h-16 rounded-full border-4 ${getEARColor().replace('text', 'border')} flex items-center justify-center`}>
            <div className={`w-8 h-8 rounded-full ${getEARColor().replace('text', 'bg')} animate-pulse`} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default EARDisplay
