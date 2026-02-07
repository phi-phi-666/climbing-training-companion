import { useState, useMemo } from 'react'
import {
  exerciseDatabase,
  categoryLabels,
  type ExerciseInfo
} from '../data/exerciseDescriptions'
import Accordion from './ui/Accordion'
import {
  Search,
  Flame,
  Dumbbell,
  StretchHorizontal,
  Mountain,
  Footprints,
  Target,
  Hand,
  ChevronDown,
  ChevronUp,
  X,
  Youtube
} from 'lucide-react'

// Icons for each category
const categoryIcons: Record<ExerciseInfo['category'], typeof Flame> = {
  warmup: Flame,
  strength: Dumbbell,
  mobility: StretchHorizontal,
  climbing: Mountain,
  cardio: Footprints,
  core: Target,
  fingers: Hand
}

// Category colors for badges
const categoryBadgeColors: Record<ExerciseInfo['category'], string> = {
  warmup: 'bg-orange-500/20 text-orange-400',
  strength: 'bg-rose-500/20 text-rose-400',
  mobility: 'bg-violet-500/20 text-violet-400',
  climbing: 'bg-amber-500/20 text-amber-400',
  cardio: 'bg-green-500/20 text-green-400',
  core: 'bg-blue-500/20 text-blue-400',
  fingers: 'bg-pink-500/20 text-pink-400'
}

// Order of categories
const categoryOrder: ExerciseInfo['category'][] = [
  'climbing',
  'fingers',
  'strength',
  'core',
  'mobility',
  'warmup',
  'cardio'
]

export default function Exercises() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null)

  // Group exercises by category
  const exercisesByCategory = useMemo(() => {
    const grouped: Record<string, ExerciseInfo[]> = {}
    for (const category of categoryOrder) {
      grouped[category] = exerciseDatabase.filter(e => e.category === category)
    }
    return grouped
  }, [])

  // Filter exercises based on search
  const filteredByCategory = useMemo(() => {
    const grouped: Record<string, ExerciseInfo[]> = {}

    for (const category of categoryOrder) {
      let exercises = exercisesByCategory[category] || []

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        exercises = exercises.filter(
          e =>
            e.name.toLowerCase().includes(query) ||
            e.namePl.toLowerCase().includes(query) ||
            e.description.toLowerCase().includes(query)
        )
      }

      if (exercises.length > 0) {
        grouped[category] = exercises
      }
    }

    return grouped
  }, [searchQuery, exercisesByCategory])

  // Total filtered count
  const totalFiltered = useMemo(() => {
    return Object.values(filteredByCategory).reduce((sum, arr) => sum + arr.length, 0)
  }, [filteredByCategory])

  const toggleExercise = (name: string) => {
    setExpandedExercise(prev => prev === name ? null : name)
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

  const hasResults = Object.keys(filteredByCategory).length > 0

  return (
    <div className="space-y-3 pt-2">
      {/* Search bar */}
      <div className="card py-3">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exercises (EN/PL)..."
            className="input pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Search results count */}
        {searchQuery && (
          <div className="mt-2 text-xs text-zinc-500">
            {totalFiltered} result{totalFiltered !== 1 ? 's' : ''} for "{searchQuery}"
          </div>
        )}
      </div>

      {/* No results */}
      {!hasResults && (
        <div className="card text-center py-12">
          <Search size={48} strokeWidth={1} className="mx-auto text-zinc-600 mb-4" />
          <p className="text-zinc-400">No exercises found</p>
          <p className="text-zinc-500 text-sm mt-2">Try a different search term</p>
        </div>
      )}

      {/* Categories as accordions */}
      {categoryOrder.map((category) => {
        const exercises = filteredByCategory[category]
        if (!exercises || exercises.length === 0) return null

        const Icon = categoryIcons[category]
        const totalInCategory = exercisesByCategory[category]?.length || 0
        const isFiltered = searchQuery.trim() !== ''

        return (
          <Accordion
            key={category}
            title={categoryLabels[category].en.toUpperCase()}
            icon={<Icon size={16} />}
            badge={isFiltered ? exercises.length : totalInCategory}
            defaultOpen={isFiltered} // Auto-expand when searching
          >
            <div className="space-y-1.5">
              {/* Polish category name */}
              <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">
                {categoryLabels[category].pl}
              </div>

              {exercises.map((exercise) => {
                const isExpanded = expandedExercise === exercise.name

                return (
                  <div
                    key={exercise.name}
                    className="bg-void-50 rounded-xl overflow-hidden border border-violet-900/10"
                  >
                    <button
                      onClick={() => toggleExercise(exercise.name)}
                      className="w-full p-3 flex items-center justify-between text-left hover:bg-void-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-zinc-200">
                          {exercise.name}
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          {exercise.namePl}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${categoryBadgeColors[category]}`}>
                          {categoryLabels[category].en}
                        </span>
                        {isExpanded ? (
                          <ChevronUp size={16} className="text-zinc-500 flex-shrink-0" />
                        ) : (
                          <ChevronDown size={16} className="text-zinc-500 flex-shrink-0" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-3 border-t border-violet-900/10 pt-3 bg-void-100/50">
                        <p className="text-sm text-zinc-400 leading-relaxed mb-3">
                          {exercise.description}
                        </p>
                        <a
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.name + ' exercise tutorial')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Youtube size={14} />
                          <span>Watch tutorial</span>
                        </a>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Accordion>
        )
      })}
    </div>
  )
}
