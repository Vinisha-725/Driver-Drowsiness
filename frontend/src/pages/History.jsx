import { useState, useEffect } from 'react'
import SessionManager from '../utils/SessionManager'



const History = () => {

  const [sessions, setSessions] = useState([])

  const [statistics, setStatistics] = useState({

    totalSessions: 0,

    totalDuration: 0,

    totalAlerts: 0,

    averageDuration: 0,

    averageAlerts: 0,

    todaySessions: 0,

    todayDuration: 0,

    todayAlerts: 0

  })

  const [sortBy, setSortBy] = useState('date') // date, duration, alerts

  const [filter, setFilter] = useState('all') // all, today, week, month

  

  const sessionManager = new SessionManager()

  

  // Load sessions and statistics on mount

  useEffect(() => {

    loadData()

  }, [filter, sortBy])

  

  const loadData = () => {

    const allSessions = sessionManager.getSessions()

    const stats = sessionManager.getStatistics()

    

    // Apply filter

    let filteredSessions = allSessions

    const now = new Date()

    

    if (filter === 'today') {

      const today = now.toDateString()

      filteredSessions = allSessions.filter(session => 

        new Date(session.date).toDateString() === today

      )

    } else if (filter === 'week') {

      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      filteredSessions = allSessions.filter(session => 

        new Date(session.date) >= weekAgo

      )

    } else if (filter === 'month') {

      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      filteredSessions = allSessions.filter(session => 

        new Date(session.date) >= monthAgo

      )

    }

    

    // Apply sort

    filteredSessions.sort((a, b) => {

      switch (sortBy) {

        case 'duration':

          return b.duration - a.duration

        case 'alerts':

          return b.alerts - a.alerts

        case 'date':

        default:

          return new Date(b.date) - new Date(a.date)

      }

    })

    

    setSessions(filteredSessions)

    setStatistics(stats)

  }

  

  const formatDuration = (seconds) => {

    if (seconds < 60) return `${seconds}s`

    const mins = Math.floor(seconds / 60)

    const secs = seconds % 60

    if (mins < 60) return `${mins}m ${secs}s`

    const hours = Math.floor(mins / 60)

    const remainingMins = mins % 60

    return `${hours}h ${remainingMins}m`

  }

  

  const formatDate = (dateString) => {

    const date = new Date(dateString)

    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  }

  

  const clearHistory = () => {

    if (confirm('Are you sure you want to clear all session history? This action cannot be undone.')) {

      sessionManager.clearSessions()

      loadData()

    }

  }

  

  const exportData = () => {

    const dataStr = JSON.stringify(sessions, null, 2)

    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)

    

    const exportFileDefaultName = `driver-safety-history-${new Date().toISOString().split('T')[0]}.json`

    

    const linkElement = document.createElement('a')

    linkElement.setAttribute('href', dataUri)

    linkElement.setAttribute('download', exportFileDefaultName)

    linkElement.click()

  }

  

  return (
    <div className="min-h-screen bg-dark-bg text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Session History</h1>
          <p className="text-gray-400">View your monitoring sessions and statistics</p>
        </div>

      

      {/* Statistics Cards */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        <div className="glass-card p-6 text-center">

          <div className="text-3xl font-bold text-neon-green mb-2">

            {statistics.totalSessions}

          </div>

          <p className="text-gray-400">Total Sessions</p>

        </div>

        

        <div className="glass-card p-6 text-center">

          <div className="text-3xl font-bold text-neon-green mb-2">

            {formatDuration(statistics.totalDuration)}

          </div>

          <p className="text-gray-400">Total Duration</p>

        </div>

        

        <div className="glass-card p-6 text-center">

          <div className="text-3xl font-bold text-neon-green mb-2">

            {statistics.totalAlerts}

          </div>

          <p className="text-gray-400">Total Alerts</p>

        </div>

        

        <div className="glass-card p-6 text-center">

          <div className="text-3xl font-bold text-neon-green mb-2">

            {formatDuration(statistics.averageDuration)}

          </div>

          <p className="text-gray-400">Average Duration</p>

        </div>

      </div>

      

      {/* Filters and Controls */}

      <div className="glass-card p-6">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">

          {/* Filter */}

          <div className="flex items-center space-x-4">

            <span className="text-white font-semibold">Filter:</span>

            <div className="flex space-x-2">

              {['all', 'today', 'week', 'month'].map((filterOption) => (

                <button

                  key={filterOption}

                  onClick={() => setFilter(filterOption)}

                  className={`px-4 py-2 rounded-lg transition-all ${

                    filter === filterOption

                      ? 'bg-neon-green text-dark-bg'

                      : 'bg-dark-card text-gray-400 hover:text-white'

                  }`}

                >

                  {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}

                </button>

              ))}

            </div>

          </div>

          

          {/* Sort */}

          <div className="flex items-center space-x-4">

            <span className="text-white font-semibold">Sort by:</span>

            <div className="flex space-x-2">

              {['date', 'duration', 'alerts'].map((sortOption) => (

                <button

                  key={sortOption}

                  onClick={() => setSortBy(sortOption)}

                  className={`px-4 py-2 rounded-lg transition-all ${

                    sortBy === sortOption

                      ? 'bg-neon-green text-dark-bg'

                      : 'bg-dark-card text-gray-400 hover:text-white'

                  }`}

                >

                  {sortOption.charAt(0).toUpperCase() + sortOption.slice(1)}

                </button>

              ))}

            </div>

          </div>

          

          {/* Actions */}

          <div className="flex space-x-2">

            <button

              onClick={exportData}

              className="btn-secondary"

              disabled={sessions.length === 0}

            >

              Export

            </button>

            <button

              onClick={clearHistory}

              className="btn-danger"

              disabled={sessions.length === 0}

            >

              🗑️ Clear

            </button>

          </div>

        </div>

      </div>

      

      {/* Sessions List */}

      {sessions.length > 0 ? (

        <div className="glass-card p-6">

          <h2 className="text-xl font-bold text-white mb-6">

            Sessions ({sessions.length})

          </h2>

          

          <div className="space-y-4">

            {sessions.map((session, index) => (

              <div

                key={session.date}

                className="bg-dark-card/50 border border-dark-border rounded-lg p-4 hover:border-neon-green/50 transition-all"

              >

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">

                  <div className="mb-4 lg:mb-0">

                    <div className="text-white font-semibold mb-2">

                      {formatDate(session.date)}

                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">

                      <div className="flex items-center space-x-2">

                        <span className="text-gray-400">Duration:</span>

                        <span className="text-white">{formatDuration(session.duration)}</span>

                      </div>

                      <div className="flex items-center space-x-2">

                        <span className="text-gray-400">Alerts:</span>

                        <span className={`font-semibold ${session.alerts > 0 ? 'text-neon-red' : 'text-neon-green'}`}>

                          {session.alerts}

                        </span>

                      </div>

                      <div className="flex items-center space-x-2">

                        <span className="text-gray-400">Avg EAR:</span>

                        <span className="text-white">{(session.avgEAR || 0.25).toFixed(3)}</span>

                      </div>

                      {session.drowsyFrames !== undefined && (

                        <div className="flex items-center space-x-2">

                          <span className="text-gray-400">Drowsy Frames:</span>

                          <span className="text-white">{session.drowsyFrames}</span>

                        </div>

                      )}

                    </div>

                  </div>

                  

                  <div className="flex items-center space-x-2">

                    {session.alerts === 0 ? (

                      <div className="px-3 py-1 bg-neon-green/20 text-neon-green rounded-full text-sm font-semibold">

                        Clean

                      </div>

                    ) : session.alerts <= 5 ? (

                      <div className="px-3 py-1 bg-neon-yellow/20 text-neon-yellow rounded-full text-sm font-semibold">

                        Moderate

                      </div>

                    ) : (

                      <div className="px-3 py-1 bg-neon-red/20 text-neon-red rounded-full text-sm font-semibold">

                        High Alerts

                      </div>

                    )}

                  </div>

                </div>

              </div>

            ))}

          </div>

        </div>

      ) : (

        <div className="glass-card p-12 text-center">

          <div className="text-6xl mb-4">📊</div>

          <h3 className="text-xl font-bold text-white mb-2">No Sessions Found</h3>

          <p className="text-gray-400 mb-6">

            {filter === 'all' 

              ? "You haven't started any monitoring sessions yet."

              : `No sessions found for the selected filter: ${filter}`

            }

          </p>

          <a

            href="/monitoring"

            className="btn-primary inline-flex items-center space-x-2"

          >

            <span>▶️</span>

            <span>Start Monitoring</span>

          </a>

        </div>

      )}

    </div>
    </div>
  )

}



export default History

