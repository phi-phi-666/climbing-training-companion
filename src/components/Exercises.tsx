import { useState, useMemo } from 'react'
import {
  exerciseDatabase,
  categoryLabels,
  type ExerciseInfo
} from '../data/exerciseDescriptions'
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
  X
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

// Category colors
const categoryColors: Record<ExerciseInfo['category'], string> = {
  warmup: 'bg-orange-500',
  strength: 'bg-rose-500',
  mobility: 'bg-violet-500',
  climbing: 'bg-amber-500',
  cardio: 'bg-green-500',
  core: 'bg-blue-500',
  fingers: 'bg-pink-500'
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
  const [selectedCategory, setSelectedCategory] = useState<ExerciseInfo['category'] | null>(null)
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null)

  // Group exercises by category
  const exercisesByCategory = useMemo(() => {
    const grouped: Record<string, ExerciseInfo[]> = {}
    for (const category of categoryOrder) {
      grouped[category] = exerciseDatabase.filter(e => e.category === category)
    }
    return grouped
  }, [])

  // Filter exercises based on search and category
  const filteredExercises = useMemo(() => {
    let exercises = exerciseDatabase

    // Filter by category if selected
    if (selectedCategory) {
      exercises = exercises.filter(e => e.category === selectedCategory)
    }

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

    return exercises
  }, [searchQuery, selectedCategory])

  // Group filtered exercises by category for display
  const groupedFiltered = useMemo(() => {
    const grouped: Record<string, ExerciseInfo[]> = {}
    for (const exercise of filteredExercises) {
      if (!grouped[exercise.category]) {
        grouped[exercise.category] = []
      }
      grouped[exercise.category].push(exercise)
    }
    return grouped
  }, [filteredExercises])

  const toggleExercise = (name: string) => {
    setExpandedExercise(prev => prev === name ? null : name)
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory(null)
  }

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
            placeholder="Search exercises..."
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
      </div>

      {/* Category filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {categoryOrder.map((category) => {
          const Icon = categoryIcons[category]
          const isSelected = selectedCategory === category
          const count = exercisesByCategory[category]?.length || 0

          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(isSelected ? null : category)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                isSelected
                  ? `${categoryColors[category]} text-white`
                  : 'bg-void-100 text-zinc-400 hover:text-zinc-200 border border-violet-900/20'
              }`}
            >
              <Icon size={14} strokeWidth={1.5} />
              <span>{categoryLabels[category].en}</span>
              <span className="opacity-60">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Results count & clear */}
      {(searchQuery || selectedCategory) && (
        <div className="flex items-center justify-between px-1">
          <span className="text-zinc-500 text-sm">
            {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} found
          </span>
          <button
            onClick={clearFilters}
            className="text-rose-400 text-sm hover:text-rose-300"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Exercise list grouped by category */}
      {filteredExercises.length === 0 ? (
        <div className="card text-center py-12">
          <Search size={48} strokeWidth={1} className="mx-auto text-zinc-600 mb-4" />
          <p className="text-zinc-400">No exercises found</p>
          <p className="text-zinc-500 text-sm mt-2">Try a different search term</p>
        </div>
      ) : (
        <div className="space-y-4">
          {categoryOrder.map((category) => {
            const exercises = groupedFiltered[category]
            if (!exercises || exercises.length === 0) return null

            const Icon = categoryIcons[category]

            return (
              <div key={category} className="card">
                {/* Category header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-1.5 rounded-lg ${categoryColors[category]}`}>
                    <Icon size={14} strokeWidth={1.5} className="text-white" />
                  </div>
                  <h2 className="font-display text-sm tracking-wide text-zinc-300">
                    {categoryLabels[category].en.toUpperCase()}
                  </h2>
                  <span className="text-zinc-600 text-xs">
                    {categoryLabels[category].pl}
                  </span>
                  <span className="text-zinc-600 text-xs ml-auto">
                    {exercises.length}
                  </span>
                </div>

                {/* Exercises */}
                <div className="space-y-1">
                  {exercises.map((exercise) => {
                    const isExpanded = expandedExercise === exercise.name

                    return (
                      <div
                        key={exercise.name}
                        className="bg-void-100 rounded-xl overflow-hidden border border-violet-900/20"
                      >
                        <button
                          onClick={() => toggleExercise(exercise.name)}
                          className="w-full p-3 flex items-center justify-between text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-zinc-200">
                              {exercise.name}
                            </div>
                            <div className="text-xs text-zinc-500">
                              {exercise.namePl}
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp size={16} className="text-zinc-500 flex-shrink-0" />
                          ) : (
                            <ChevronDown size={16} className="text-zinc-500 flex-shrink-0" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="px-3 pb-3 border-t border-violet-900/20 pt-3">
                            <p className="text-sm text-zinc-400 leading-relaxed">
                              {exercise.description}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
