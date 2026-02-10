import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  isClimbingDay,
  getClimbingTypeForDay,
  addScheduleOverride,
  removeScheduleOverride,
  getScheduleConfig,
  SESSION_TYPES_BY_LOCATION,
  canDoHangboard,
  type Location,
  type ClimbingType
} from '../services/schedule'
import {
  generateClimbingSession,
  generateNonClimbingOptions,
  buildAIContext,
  BOULDER_FOCUS_OPTIONS,
  LEAD_FOCUS_OPTIONS,
  type ClimbingSession,
  type TodayOption,
  type BoulderFocus,
  type LeadFocus
} from '../services/ai'
import { useSessionHistory, useLastClimbingSession } from '../hooks/useSessionHistory'
import { sessionTypes } from '../data/exercises'
import {
  Mountain,
  Dumbbell,
  Hand,
  Flame,
  Footprints,
  Zap,
  StretchHorizontal,
  RefreshCw,
  Play,
  X,
  Sparkles,
  Home as HomeIcon,
  Building2,
  TreePine,
  Calendar,
  CalendarX,
  Coffee,
  ChevronRight,
  type LucideIcon
} from 'lucide-react'

// Icon mapping for session types
const sessionIcons: Record<string, LucideIcon> = {
  boulder: Mountain,
  lead: Mountain,
  hangboard: Hand,
  gym: Dumbbell,
  cardio: Footprints,
  hiit: Flame,
  crossfit: Zap,
  mobility: StretchHorizontal,
  core: Dumbbell,
  rest: Coffee
}

const locationIcons: Record<Location, LucideIcon> = {
  home: HomeIcon,
  gym: Building2,
  outdoor: TreePine
}

const locationLabels: Record<Location, string> = {
  home: 'Home',
  gym: 'Gym',
  outdoor: 'Outdoor'
}

interface SmartScheduleProps {
  hasSessionToday: boolean
}

const STORAGE_KEY = 'alpha_smart_schedule_state'

type ViewState =
  | { type: 'initial' }
  | { type: 'climbing_picker' }
  | { type: 'climbing_focus'; climbingType: ClimbingType }
  | { type: 'climbing_session'; climbingType: ClimbingType; focus?: BoulderFocus | LeadFocus; session: ClimbingSession | null; loading: boolean }
  | { type: 'location_picker' }
  | { type: 'workout_options'; location: Location; options: TodayOption[] | null; loading: boolean; selectedIndex?: number }
  | { type: 'override_menu' }

export default function SmartSchedule({ hasSessionToday }: SmartScheduleProps) {
  const navigate = useNavigate()
  const lastSessions = useSessionHistory(7)
  const lastClimbingSession = useLastClimbingSession()

  const today = new Date()
  const isClimbing = isClimbingDay(today)
  const suggestedClimbingType = getClimbingTypeForDay(today)
  const config = getScheduleConfig()
  const todayStr = today.toISOString().split('T')[0]
  const hasOverride = config.overrides.some(o => o.date === todayStr)

  // Check 24h hangboard rule
  const hangboardAllowed = canDoHangboard(lastClimbingSession?.date ? new Date(lastClimbingSession.date) : null)

  const [viewState, setViewState] = useState<ViewState>(() => {
    // Try to restore from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed._storedDate === todayStr) {
          delete parsed._storedDate
          return parsed
        }
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // Ignore
    }
    return { type: 'initial' }
  })

  const [error, setError] = useState<string | null>(null)

  // Persist state
  useEffect(() => {
    if (viewState.type !== 'initial') {
      const toStore = { ...viewState, _storedDate: todayStr }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [viewState, todayStr])

  const handleClimbingTypeSelect = (type: ClimbingType) => {
    // Go to focus picker instead of directly generating
    setViewState({ type: 'climbing_focus', climbingType: type })
    setError(null)
  }

  const handleFocusSelect = async (focus: BoulderFocus | LeadFocus, climbingType: ClimbingType) => {
    setViewState({ type: 'climbing_session', climbingType, focus, session: null, loading: true })
    setError(null)

    try {
      const context = buildAIContext(lastSessions, null)
      const session = await generateClimbingSession(climbingType, context, focus)
      setViewState({ type: 'climbing_session', climbingType, focus, session, loading: false })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate session')
      setViewState({ type: 'climbing_session', climbingType, focus, session: null, loading: false })
    }
  }

  const handleLocationSelect = async (location: Location) => {
    setViewState({ type: 'workout_options', location, options: null, loading: true })
    setError(null)

    try {
      // Filter session types by location and hangboard rule
      let allowedTypes = SESSION_TYPES_BY_LOCATION[location]
      if (!hangboardAllowed) {
        allowedTypes = allowedTypes.filter(t => t !== 'hangboard')
      }

      const context = buildAIContext(lastSessions, null)
      const options = await generateNonClimbingOptions(location, allowedTypes, context)
      setViewState({ type: 'workout_options', location, options, loading: false })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate options')
      setViewState({ type: 'workout_options', location, options: null, loading: false })
    }
  }

  const handleSelectOption = (index: number) => {
    if (viewState.type === 'workout_options' && viewState.options) {
      setViewState({
        ...viewState,
        selectedIndex: viewState.selectedIndex === index ? undefined : index
      })
    }
  }

  const handleStartTraining = (option: TodayOption) => {
    navigate('/log', {
      state: {
        prefill: option
      }
    })
  }

  const handleStartClimbing = (session: ClimbingSession) => {
    navigate('/log', {
      state: {
        prefill: {
          sessionType: session.type,
          boulderSubType: session.type === 'boulder' ? session.subType : undefined,
          title: session.title,
          description: session.description,
          durationMinutes: session.durationMinutes,
          exercises: session.exercises || []
        }
      }
    })
  }

  const handleSkipClimbing = () => {
    addScheduleOverride(todayStr, { skipClimbing: true })
    setViewState({ type: 'location_picker' })
  }

  const handleForceClimbing = (type: ClimbingType) => {
    addScheduleOverride(todayStr, { forceClimbing: type })
    setViewState({ type: 'initial' })
  }

  const handleClearOverride = () => {
    removeScheduleOverride(todayStr)
    setViewState({ type: 'initial' })
  }

  const handleReset = () => {
    setViewState({ type: 'initial' })
    setError(null)
  }

  // Already trained today
  if (hasSessionToday && viewState.type === 'initial') {
    return (
      <div className="card">
        <div className="bg-accent-900/20 border border-accent-700/30 rounded-xl p-5 text-center">
          <span className="text-3xl mb-2 block">✓</span>
          <p className="text-accent-400 font-semibold">Already trained today</p>
          <p className="text-zinc-500 text-sm mt-1">Rest up for tomorrow</p>
        </div>
      </div>
    )
  }

  // Initial state - show main button
  if (viewState.type === 'initial') {
    return (
      <div className="card space-y-3">
        <button
          onClick={() => {
            if (isClimbing) {
              setViewState({ type: 'climbing_picker' })
            } else {
              setViewState({ type: 'location_picker' })
            }
          }}
          className="w-full btn-primary-glow flex items-center justify-center gap-3 py-4"
        >
          <Sparkles size={20} strokeWidth={1.5} />
          <span className="font-semibold tracking-wide">
            {isClimbing ? "What Now?" : "What's Next?"}
          </span>
        </button>

        {/* Schedule indicator */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">
            {isClimbing ? (
              <>
                <Mountain size={12} className="inline mr-1" />
                {suggestedClimbingType === 'boulder' ? 'Boulder' : 'Lead'} day
              </>
            ) : (
              <>
                <Calendar size={12} className="inline mr-1" />
                Non-climbing day
              </>
            )}
            {hasOverride && <span className="text-amber-400 ml-1">(modified)</span>}
          </span>
          <button
            onClick={() => setViewState({ type: 'override_menu' })}
            className="text-zinc-600 hover:text-zinc-400"
          >
            Change
          </button>
        </div>
      </div>
    )
  }

  // Override menu
  if (viewState.type === 'override_menu') {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg tracking-wide">CHANGE TODAY</h2>
          <button onClick={handleReset} className="text-zinc-500 hover:text-zinc-300">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2">
          {isClimbing ? (
            <>
              <button
                onClick={handleSkipClimbing}
                className="w-full p-3 bg-void-100 hover:bg-void-50 rounded-xl flex items-center gap-3 text-left border border-violet-900/20"
              >
                <CalendarX size={20} className="text-amber-400" />
                <div>
                  <div className="font-medium text-sm">Skip climbing today</div>
                  <div className="text-xs text-zinc-500">Do something else instead</div>
                </div>
              </button>
              {suggestedClimbingType === 'lead' && (
                <button
                  onClick={() => handleForceClimbing('boulder')}
                  className="w-full p-3 bg-void-100 hover:bg-void-50 rounded-xl flex items-center gap-3 text-left border border-violet-900/20"
                >
                  <Mountain size={20} className="text-rose-400" />
                  <div>
                    <div className="font-medium text-sm">Boulder instead of lead</div>
                    <div className="text-xs text-zinc-500">Switch climbing type</div>
                  </div>
                </button>
              )}
              {suggestedClimbingType === 'boulder' && (
                <button
                  onClick={() => handleForceClimbing('lead')}
                  className="w-full p-3 bg-void-100 hover:bg-void-50 rounded-xl flex items-center gap-3 text-left border border-violet-900/20"
                >
                  <Mountain size={20} className="text-violet-400" />
                  <div>
                    <div className="font-medium text-sm">Lead instead of boulder</div>
                    <div className="text-xs text-zinc-500">Switch climbing type</div>
                  </div>
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => handleForceClimbing('boulder')}
                className="w-full p-3 bg-void-100 hover:bg-void-50 rounded-xl flex items-center gap-3 text-left border border-violet-900/20"
              >
                <Mountain size={20} className="text-rose-400" />
                <div>
                  <div className="font-medium text-sm">Add bouldering today</div>
                  <div className="text-xs text-zinc-500">Override schedule</div>
                </div>
              </button>
              <button
                onClick={() => handleForceClimbing('lead')}
                className="w-full p-3 bg-void-100 hover:bg-void-50 rounded-xl flex items-center gap-3 text-left border border-violet-900/20"
              >
                <Mountain size={20} className="text-violet-400" />
                <div>
                  <div className="font-medium text-sm">Add lead climbing today</div>
                  <div className="text-xs text-zinc-500">Override schedule</div>
                </div>
              </button>
            </>
          )}

          {hasOverride && (
            <button
              onClick={handleClearOverride}
              className="w-full p-3 bg-amber-900/20 hover:bg-amber-900/30 rounded-xl flex items-center gap-3 text-left border border-amber-700/30"
            >
              <RefreshCw size={20} className="text-amber-400" />
              <div>
                <div className="font-medium text-sm text-amber-300">Reset to normal schedule</div>
                <div className="text-xs text-amber-400/60">Remove today's override</div>
              </div>
            </button>
          )}
        </div>
      </div>
    )
  }

  // Climbing type picker
  if (viewState.type === 'climbing_picker') {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg tracking-wide">WHAT NOW?</h2>
          <button onClick={handleReset} className="text-zinc-500 hover:text-zinc-300">
            <X size={18} />
          </button>
        </div>

        <p className="text-zinc-400 text-sm mb-4">What are you climbing today?</p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleClimbingTypeSelect('boulder')}
            className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all border ${
              suggestedClimbingType === 'boulder'
                ? 'bg-rose-600 hover:bg-rose-500 border-rose-500'
                : 'bg-void-100 hover:bg-void-50 border-violet-900/20'
            }`}
          >
            <Mountain size={28} strokeWidth={1.5} />
            <span className="font-semibold">Bouldering</span>
            {suggestedClimbingType === 'boulder' && (
              <span className="text-[10px] uppercase tracking-wider opacity-70">Suggested</span>
            )}
          </button>

          <button
            onClick={() => handleClimbingTypeSelect('lead')}
            className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all border ${
              suggestedClimbingType === 'lead'
                ? 'bg-violet-600 hover:bg-violet-500 border-violet-500'
                : 'bg-void-100 hover:bg-void-50 border-violet-900/20'
            }`}
          >
            <Mountain size={28} strokeWidth={1.5} />
            <span className="font-semibold">Lead</span>
            {suggestedClimbingType === 'lead' && (
              <span className="text-[10px] uppercase tracking-wider opacity-70">Suggested</span>
            )}
          </button>
        </div>

        <button
          onClick={handleSkipClimbing}
          className="w-full mt-3 text-sm text-zinc-500 hover:text-zinc-300"
        >
          Not climbing today? Do something else →
        </button>
      </div>
    )
  }

  // Focus picker (after selecting climbing type)
  if (viewState.type === 'climbing_focus') {
    const { climbingType } = viewState
    const focusOptions = climbingType === 'boulder' ? BOULDER_FOCUS_OPTIONS : LEAD_FOCUS_OPTIONS
    const accentColor = climbingType === 'boulder' ? 'rose' : 'violet'

    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg tracking-wide">
            {climbingType === 'boulder' ? 'BOULDER' : 'LEAD'} FOCUS
          </h2>
          <button onClick={handleReset} className="text-zinc-500 hover:text-zinc-300">
            <X size={18} />
          </button>
        </div>

        <p className="text-zinc-400 text-sm mb-4">What do you want to work on?</p>

        <div className="grid grid-cols-2 gap-2">
          {focusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleFocusSelect(option.value, climbingType)}
              className={`p-3 rounded-xl text-left transition-all border ${
                option.value === 'surprise'
                  ? `bg-gradient-to-br from-${accentColor}-600/30 to-${accentColor}-700/30 border-${accentColor}-500/50 hover:from-${accentColor}-600/40 hover:to-${accentColor}-700/40`
                  : 'bg-void-100 hover:bg-void-50 border-violet-900/20'
              }`}
            >
              <div className={`font-semibold text-sm ${option.value === 'surprise' ? `text-${accentColor}-300` : ''}`}>
                {option.label}
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">{option.description}</div>
            </button>
          ))}
        </div>

        <button
          onClick={() => setViewState({ type: 'climbing_picker' })}
          className="w-full mt-3 text-sm text-zinc-500 hover:text-zinc-300"
        >
          ← Back to climbing type
        </button>
      </div>
    )
  }

  // Climbing session view
  if (viewState.type === 'climbing_session') {
    const { climbingType, focus, session, loading } = viewState

    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg tracking-wide">
            {climbingType === 'boulder' ? 'BOULDERING' : 'LEAD'} SESSION
          </h2>
          <button onClick={handleReset} className="text-zinc-500 hover:text-zinc-300">
            <X size={18} />
          </button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-zinc-500 text-sm">Generating session ideas...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-4 mb-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {session && !loading && (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl ${
              climbingType === 'boulder'
                ? 'bg-gradient-to-br from-rose-600 to-rose-700'
                : 'bg-gradient-to-br from-violet-600 to-violet-700'
            }`}>
              <div className="flex items-start gap-3">
                <div className="bg-black/20 p-2 rounded-lg">
                  <Mountain size={24} strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{session.title}</span>
                    {session.intensityLevel && (
                      <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        session.intensityLevel === 'max' ? 'bg-red-500/30' :
                        session.intensityLevel === 'hard' ? 'bg-orange-500/30' :
                        session.intensityLevel === 'moderate' ? 'bg-yellow-500/30' :
                        'bg-green-500/30'
                      }`}>
                        {session.intensityLevel}
                      </span>
                    )}
                  </div>
                  <p className="text-sm opacity-90 mb-2">{session.description}</p>
                  <div className="text-xs opacity-70 flex flex-wrap gap-x-2">
                    <span>{session.durationMinutes} min</span>
                    <span>•</span>
                    <span>{session.focus}</span>
                    {session.gradeRange && (
                      <>
                        <span>•</span>
                        <span>{session.gradeRange}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {session.structure && session.structure.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/10">
                  <div className="text-[10px] uppercase tracking-wider font-medium opacity-60 mb-2">
                    Session Structure
                  </div>
                  <div className="space-y-2">
                    {session.structure.map((phase, i) => (
                      <div key={i} className="text-sm flex items-start gap-2">
                        <span className="bg-black/20 px-1.5 py-0.5 rounded text-[10px] font-medium">
                          {i + 1}
                        </span>
                        <div>
                          <span className="font-medium">{phase.name}</span>
                          {phase.duration && (
                            <span className="opacity-70"> • {phase.duration}</span>
                          )}
                          {phase.details && (
                            <p className="text-xs opacity-70 mt-0.5">{phase.details}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {session.tips && (
                <div className="mt-3 pt-3 border-t border-white/10 text-sm opacity-70 italic">
                  💡 {session.tips}
                </div>
              )}
            </div>

            <button
              onClick={() => handleStartClimbing(session)}
              className="w-full btn-primary flex items-center justify-center gap-2 py-4"
            >
              <Play size={18} strokeWidth={2} />
              <span className="font-semibold tracking-wide">Start Session</span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => focus && handleFocusSelect(focus, climbingType)}
                className="flex-1 btn-secondary flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                <span>Regenerate</span>
              </button>
              <button
                onClick={() => setViewState({ type: 'climbing_focus', climbingType })}
                className="flex-1 btn-secondary flex items-center justify-center gap-2"
              >
                <span>Change Focus</span>
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Location picker (non-climbing day)
  if (viewState.type === 'location_picker') {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg tracking-wide">WHERE?</h2>
          <button onClick={handleReset} className="text-zinc-500 hover:text-zinc-300">
            <X size={18} />
          </button>
        </div>

        <p className="text-zinc-400 text-sm mb-4">Where are you training today?</p>

        <div className="space-y-2">
          {(['home', 'gym', 'outdoor'] as Location[]).map((location) => {
            const Icon = locationIcons[location]
            const allowedTypes = SESSION_TYPES_BY_LOCATION[location]
              .filter(t => t !== 'hangboard' || hangboardAllowed)

            return (
              <button
                key={location}
                onClick={() => handleLocationSelect(location)}
                className="w-full p-4 bg-void-100 hover:bg-void-50 rounded-xl flex items-center justify-between text-left border border-violet-900/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-rose-500/20 p-2 rounded-lg group-hover:bg-rose-500/30 transition-colors">
                    <Icon size={22} className="text-rose-400" />
                  </div>
                  <div>
                    <div className="font-semibold">{locationLabels[location]}</div>
                    <div className="text-xs text-zinc-500">
                      {allowedTypes.map(t => {
                        const st = sessionTypes.find(s => s.value === t)
                        return st?.label || t
                      }).join(', ')}
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} className="text-zinc-600 group-hover:text-zinc-400" />
              </button>
            )
          })}
        </div>

        {!hangboardAllowed && (
          <div className="mt-3 bg-amber-900/20 border border-amber-700/30 rounded-lg px-3 py-2 text-xs text-amber-400">
            ⚠️ Hangboard blocked (climbed within 24h)
          </div>
        )}
      </div>
    )
  }

  // Workout options (non-climbing day, location selected)
  if (viewState.type === 'workout_options') {
    const { location, options, loading, selectedIndex } = viewState
    const Icon = locationIcons[location]

    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon size={18} className="text-rose-400" />
            <h2 className="font-display text-lg tracking-wide">
              {locationLabels[location].toUpperCase()} OPTIONS
            </h2>
          </div>
          <button onClick={handleReset} className="text-zinc-500 hover:text-zinc-300">
            <X size={18} />
          </button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-zinc-500 text-sm">Finding workouts...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-4 mb-3">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => handleLocationSelect(location)}
              className="mt-2 text-red-300 text-sm underline"
            >
              Try again
            </button>
          </div>
        )}

        {options && !loading && (
          <div className="space-y-2">
            {options.map((option, index) => {
              const SessionIcon = sessionIcons[option.sessionType] || Dumbbell
              const isSelected = selectedIndex === index

              const effortColors: Record<string, string> = {
                high: 'from-rose-600 to-rose-700',
                medium: 'from-amber-600 to-amber-700',
                low: 'from-accent-600 to-accent-700'
              }

              const effortHoverColors: Record<string, string> = {
                high: 'hover:from-rose-500 hover:to-rose-600',
                medium: 'hover:from-amber-500 hover:to-amber-600',
                low: 'hover:from-accent-500 hover:to-accent-600'
              }

              return (
                <div key={index} className="space-y-2">
                  <button
                    onClick={() => handleSelectOption(index)}
                    className={`w-full p-4 rounded-xl bg-gradient-to-r ${effortColors[option.effort] || effortColors.medium} ${!isSelected ? effortHoverColors[option.effort] || effortHoverColors.medium : ''} transition-all text-left shadow-lg ${!isSelected ? 'hover:scale-[1.01] active:scale-[0.99]' : 'ring-2 ring-white/30'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-black/20 p-2 rounded-lg">
                        <SessionIcon size={20} strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{option.title}</span>
                          <span className="text-[10px] uppercase tracking-wider opacity-75 bg-black/20 px-2 py-0.5 rounded">
                            {option.effort}
                          </span>
                        </div>
                        <p className="text-sm opacity-90">{option.description}</p>
                        <div className="text-xs opacity-70 mt-1">
                          {sessionTypes.find(t => t.value === option.sessionType)?.label} • {option.durationMinutes} min
                        </div>
                      </div>
                    </div>

                    {/* Expanded content for selected option */}
                    {isSelected && option.exercises && option.exercises.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-white/10">
                        <div className="text-[10px] uppercase tracking-wider font-medium opacity-60 mb-2">
                          Exercises
                        </div>
                        <div className="space-y-1">
                          {option.exercises.map((ex, i) => (
                            <div key={i} className="text-sm flex justify-between">
                              <span className="opacity-90">{ex.name}</span>
                              <span className="opacity-60 text-xs">
                                {ex.sets && `${ex.sets}×`}{ex.reps || ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </button>

                  {/* Start button for selected option */}
                  {isSelected && (
                    <button
                      onClick={() => handleStartTraining(option)}
                      className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                    >
                      <Play size={18} strokeWidth={2} />
                      <span className="font-semibold tracking-wide">Start Training</span>
                    </button>
                  )}
                </div>
              )
            })}

            <button
              onClick={() => handleLocationSelect(location)}
              className="w-full btn-secondary flex items-center justify-center gap-2 mt-2"
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setViewState({ type: 'location_picker' })}
              className="w-full text-sm text-zinc-500 hover:text-zinc-300"
            >
              ← Different location
            </button>
          </div>
        )}
      </div>
    )
  }

  return null
}
