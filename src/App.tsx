import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import LogSession from './components/LogSession'
import History from './components/History'
import { Home, Plus, Calendar } from 'lucide-react'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-stone-950 text-stone-100 pb-24">
        <main className="max-w-lg mx-auto p-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/log" element={<LogSession />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 bg-stone-900/95 backdrop-blur-lg border-t border-stone-800">
          <div className="max-w-lg mx-auto flex justify-around">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex flex-col items-center py-3 px-6 text-sm font-medium transition-colors ${
                  isActive ? 'text-rose-400' : 'text-stone-500 hover:text-stone-300'
                }`
              }
            >
              <Home size={24} strokeWidth={1.5} className="mb-1" />
              <span>Home</span>
            </NavLink>
            <NavLink
              to="/log"
              className={({ isActive }) =>
                `flex flex-col items-center py-3 px-6 text-sm font-medium transition-colors ${
                  isActive ? 'text-rose-400' : 'text-stone-500 hover:text-stone-300'
                }`
              }
            >
              <Plus size={24} strokeWidth={1.5} className="mb-1" />
              <span>Log</span>
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) =>
                `flex flex-col items-center py-3 px-6 text-sm font-medium transition-colors ${
                  isActive ? 'text-rose-400' : 'text-stone-500 hover:text-stone-300'
                }`
              }
            >
              <Calendar size={24} strokeWidth={1.5} className="mb-1" />
              <span>History</span>
            </NavLink>
          </div>
        </nav>
      </div>
    </BrowserRouter>
  )
}

export default App
