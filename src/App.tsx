import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import LogSession from './components/LogSession'
import History from './components/History'
import Exercises from './components/Exercises'
import Settings from './components/Settings'
import { ToastProvider } from './components/ui/Toast'
import ErrorBoundary from './components/ui/ErrorBoundary'
import { Home, Plus, Calendar, BookOpen, Settings as SettingsIcon } from 'lucide-react'

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-void text-zinc-100 pb-24">
            <main className="max-w-lg mx-auto p-4">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/log" element={<LogSession />} />
                <Route path="/exercises" element={<Exercises />} />
                <Route path="/history" element={<History />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>

        <nav className="fixed bottom-0 left-0 right-0 bg-void-100/95 backdrop-blur-xl border-t border-violet-900/30">
          <div className="max-w-lg mx-auto flex justify-around">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex flex-col items-center py-3 px-4 text-sm font-medium transition-all ${
                  isActive
                    ? 'text-rose-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`
              }
            >
              <Home size={22} strokeWidth={1.5} className="mb-1" />
              <span className="text-xs tracking-wide">Home</span>
            </NavLink>
            <NavLink
              to="/log"
              className={({ isActive }) =>
                `flex flex-col items-center py-3 px-4 text-sm font-medium transition-all ${
                  isActive
                    ? 'text-rose-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`
              }
            >
              <Plus size={22} strokeWidth={1.5} className="mb-1" />
              <span className="text-xs tracking-wide">Log</span>
            </NavLink>
            <NavLink
              to="/exercises"
              className={({ isActive }) =>
                `flex flex-col items-center py-3 px-4 text-sm font-medium transition-all ${
                  isActive
                    ? 'text-rose-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`
              }
            >
              <BookOpen size={22} strokeWidth={1.5} className="mb-1" />
              <span className="text-xs tracking-wide">Exercises</span>
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) =>
                `flex flex-col items-center py-3 px-4 text-sm font-medium transition-all ${
                  isActive
                    ? 'text-rose-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`
              }
            >
              <Calendar size={22} strokeWidth={1.5} className="mb-1" />
              <span className="text-xs tracking-wide">History</span>
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex flex-col items-center py-3 px-4 text-sm font-medium transition-all ${
                  isActive
                    ? 'text-rose-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`
              }
            >
              <SettingsIcon size={22} strokeWidth={1.5} className="mb-1" />
              <span className="text-xs tracking-wide">Settings</span>
            </NavLink>
          </div>
          </nav>
        </div>
      </BrowserRouter>
    </ToastProvider>
  </ErrorBoundary>
  )
}

export default App
