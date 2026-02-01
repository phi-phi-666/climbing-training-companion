import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addMeal, useTodayNutrition } from '../hooks/useNutrition'
import { calculateMealPoints } from '../services/nutrition'

export default function LogMeal() {
  const navigate = useNavigate()
  const todayNutrition = useTodayNutrition()
  const [description, setDescription] = useState('')
  const [proteinGrams, setProteinGrams] = useState(20)
  const [isVegan, setIsVegan] = useState(false)
  const [saving, setSaving] = useState(false)

  const previewPoints = calculateMealPoints({
    id: '',
    description,
    proteinGrams,
    isVegan,
    timestamp: 0
  })

  const handleSave = async () => {
    if (saving || !description.trim()) return
    setSaving(true)

    await addMeal({
      description: description.trim(),
      proteinGrams,
      isVegan
    })

    navigate('/')
  }

  const quickProtein = [10, 20, 30, 40, 50]

  return (
    <div className="space-y-6">
      <header className="py-4">
        <h1 className="text-2xl font-bold">Log Meal</h1>
        {todayNutrition && (
          <p className="text-gray-400 text-sm mt-1">
            Today: {todayNutrition.proteinTotal}g protein · {todayNutrition.veganPoints} points
          </p>
        )}
      </header>

      <section className="card">
        <h2 className="text-lg font-semibold mb-3">What did you eat?</h2>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Tofu stir-fry with rice"
          className="input"
        />
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold mb-3">Protein (grams)</h2>
        <div className="flex gap-2 mb-4">
          {quickProtein.map((amount) => (
            <button
              key={amount}
              onClick={() => setProteinGrams(amount)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                proteinGrams === amount
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {amount}g
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="80"
            step="5"
            value={proteinGrams}
            onChange={(e) => setProteinGrams(Number(e.target.value))}
            className="flex-1"
          />
          <span className="font-mono text-xl w-16 text-right">{proteinGrams}g</span>
        </div>
      </section>

      <section className="card">
        <button
          onClick={() => setIsVegan(!isVegan)}
          className={`w-full p-4 rounded-lg flex items-center justify-between transition-colors ${
            isVegan
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300'
          }`}
        >
          <span className="text-lg">
            <span className="mr-2">🌱</span>
            Vegan meal
          </span>
          <span className="text-2xl">{isVegan ? '✓' : ''}</span>
        </button>
      </section>

      <section className="card bg-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Points for this meal</span>
          <span className="text-2xl font-bold text-green-400">+{previewPoints}</span>
        </div>
        <div className="text-xs text-gray-400 mt-2">
          {proteinGrams >= 30 && <span className="mr-2">🏆 High protein</span>}
          {isVegan && <span className="mr-2">🌱 Vegan bonus</span>}
          {isVegan && proteinGrams >= 30 && <span>⭐ Combo bonus</span>}
        </div>
      </section>

      <button
        onClick={handleSave}
        disabled={saving || !description.trim()}
        className="btn-primary w-full text-lg disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Log Meal'}
      </button>
    </div>
  )
}
