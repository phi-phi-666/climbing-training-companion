import type { Session } from './db'
import type { DailyNutrition } from './db'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'anthropic/claude-haiku-4.5'

export interface AIContext {
  lastSessions: Session[]
  todayNutrition: DailyNutrition | null
  currentDay: string
  scheduledClimbing: string[]
}

interface OpenRouterResponse {
  choices: {
    message: {
      content: string
    }
  }[]
}

async function callOpenRouter(
  prompt: string,
  options: { json?: boolean } = {}
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY

  if (!apiKey || apiKey === 'your_key_here') {
    throw new Error('OpenRouter API key not configured')
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Climbing Training Companion'
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      ...(options.json && { response_format: { type: 'json_object' } })
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`)
  }

  const data: OpenRouterResponse = await response.json()
  return data.choices[0]?.message?.content ?? ''
}

function formatRecentSessions(sessions: Session[]): string {
  if (sessions.length === 0) return 'No recent sessions'

  return sessions
    .map((s) => {
      const exercises =
        s.exercises.length > 0
          ? ` - ${s.exercises.map((e) => e.name).join(', ')}`
          : ''
      return `- ${s.date}: ${s.type} (${s.durationMinutes}min)${exercises}`
    })
    .join('\n')
}

function buildWarmupPrompt(sessionType: string, context: AIContext): string {
  return `Generate a climbing warmup routine for a ${sessionType} session.

Recent activity (last 7 days):
${formatRecentSessions(context.lastSessions)}

Today is ${context.currentDay}.
Climbing schedule: ${context.scheduledClimbing.join(', ')}

Requirements:
- 10-15 minutes total
- Progress from general to specific
- Include finger/shoulder prep for climbing
- Consider recovery needs based on recent sessions
- Format as a simple numbered list with duration per item
- Keep descriptions concise (one line each)

IMPORTANT: Return plain text only. No markdown formatting, no headers, no bold text, no asterisks, no special characters. Just simple numbered lines like:
1. Exercise name (2 min)
2. Another exercise (3 min)

Return only the warmup routine, no preamble or explanation.`
}

export async function generateWarmup(
  sessionType: Session['type'],
  context: AIContext
): Promise<string> {
  const prompt = buildWarmupPrompt(sessionType, context)
  return callOpenRouter(prompt)
}

function buildCooldownPrompt(
  sessionType: string,
  context: AIContext,
  muscleGroups?: string[],
  exercises?: string[]
): string {
  const muscleGroupsText = muscleGroups && muscleGroups.length > 0
    ? `\nMuscle groups worked this session: ${muscleGroups.join(', ')}`
    : ''

  const exercisesText = exercises && exercises.length > 0
    ? `\nExercises performed: ${exercises.join(', ')}`
    : ''

  return `Generate a cooldown/stretching routine after a ${sessionType} climbing session.
${muscleGroupsText}${exercisesText}

Recent activity (last 7 days):
${formatRecentSessions(context.lastSessions)}

Today is ${context.currentDay}.
Climbing schedule: ${context.scheduledClimbing.join(', ')}

Requirements:
- 10-15 minutes total
- Focus on recovery and flexibility
- PRIORITIZE stretches for the specific muscle groups worked in this session
- Include both static stretches and gentle mobility work
- For climbing sessions, always include forearm and finger stretches
- Format as a simple numbered list with duration per item
- Keep descriptions concise (one line each)

IMPORTANT: Return plain text only. No markdown formatting, no headers, no bold text, no asterisks, no special characters. Just simple numbered lines like:
1. Stretch name (30 sec each side)
2. Another stretch (1 min)

Return only the cooldown routine, no preamble or explanation.`
}

export async function generateCooldown(
  sessionType: Session['type'],
  context: AIContext,
  muscleGroups?: string[],
  exercises?: string[]
): Promise<string> {
  const prompt = buildCooldownPrompt(sessionType, context, muscleGroups, exercises)
  return callOpenRouter(prompt)
}

export interface DaysSinceByType {
  boulder: number | null
  lead: number | null
  hangboard: number | null
  supplementary: number | null
}

export interface TodayOption {
  effort: 'high' | 'medium' | 'low'
  title: string
  description: string
  exercises: string[]
}

function buildTodayOptionsPrompt(context: AIContext, daysSince: DaysSinceByType): string {
  const daysSinceText = Object.entries(daysSince)
    .map(([type, days]) => `- ${type}: ${days === null ? 'never' : days === 0 ? 'today' : `${days} days ago`}`)
    .join('\n')

  return `Today is ${context.currentDay}.

Fixed climbing schedule:
- Monday: Bouldering
- Wednesday: Bouldering
- Saturday: Lead climbing

Days since last session by type:
${daysSinceText}

Recent activity (last 7 days):
${formatRecentSessions(context.lastSessions)}

Suggest exactly 3 training options for today:
1. HIGH effort - for when feeling strong and well-recovered
2. MEDIUM effort - balanced training appropriate for the day
3. LOW effort - recovery focused, light activity

For each option:
- Consider if today is a scheduled climbing day
- Factor in recovery needs based on days since last sessions
- On rest days, suggest supplementary or recovery work
- Be specific about what to do

Return as JSON with this exact structure:
{
  "options": [
    {
      "effort": "high",
      "title": "Short title (2-4 words)",
      "description": "One sentence explaining why this fits today",
      "exercises": ["Exercise 1", "Exercise 2", "Exercise 3"]
    },
    {
      "effort": "medium",
      "title": "Short title",
      "description": "One sentence explanation",
      "exercises": ["Exercise 1", "Exercise 2"]
    },
    {
      "effort": "low",
      "title": "Short title",
      "description": "One sentence explanation",
      "exercises": ["Exercise 1", "Exercise 2"]
    }
  ]
}

IMPORTANT: No markdown in any text fields. Plain text only.`
}

export async function generateTodayOptions(
  context: AIContext,
  daysSince: DaysSinceByType
): Promise<TodayOption[]> {
  const prompt = buildTodayOptionsPrompt(context, daysSince)
  const response = await callOpenRouter(prompt, { json: true })
  const parsed = JSON.parse(response)
  return parsed.options as TodayOption[]
}

function buildProteinPrompt(context: AIContext): string {
  return `Based on this climbing activity:

Recent sessions:
${formatRecentSessions(context.lastSessions)}

Today is ${context.currentDay}.
Climbing schedule: ${context.scheduledClimbing.join(', ')}

Calculate a protein target for today and suggest high-protein vegan meal ideas.

Return as JSON:
{
  "targetGrams": number,
  "reasoning": "brief explanation",
  "mealIdeas": ["idea1", "idea2", "idea3"]
}`
}

export async function generateProteinTarget(context: AIContext): Promise<{
  targetGrams: number
  reasoning: string
  mealIdeas: string[]
}> {
  const prompt = buildProteinPrompt(context)
  const response = await callOpenRouter(prompt, { json: true })
  return JSON.parse(response)
}

export function buildAIContext(
  lastSessions: Session[],
  todayNutrition: DailyNutrition | null
): AIContext {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ]
  const currentDay = days[new Date().getDay()]

  return {
    lastSessions,
    todayNutrition,
    currentDay,
    scheduledClimbing: [
      'Monday: boulder',
      'Wednesday: boulder',
      'Saturday: lead'
    ]
  }
}
