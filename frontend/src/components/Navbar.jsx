import { Link, useLocation } from 'react-router-dom'

const Navbar = () => {
  const location = useLocation()
  
  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/monitoring', label: 'Monitor' },
    { path: '/profile', label: 'Profile' },
    { path: '/settings', label: 'Settings' },
    { path: '/history', label: 'History' },
  ]

  return (
    <nav className="glass-card sticky top-0 z-50 mb-8">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🚗</div>
            <h1 className="text-xl font-bold text-neon-purple">Driver Safety</h1>
          </div>
          
          <div className="flex space-x-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 ${
                  location.pathname === item.path
                    ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/50'
                    : 'text-gray-400 hover:text-white hover:bg-dark-card/50'
                }`}
              >
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.label.charAt(0)}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
