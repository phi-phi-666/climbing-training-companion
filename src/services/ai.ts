import type { Session } from './db'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'anthropic/claude-haiku-4.5'

export interface AIContext {
  lastSessions: Session[]
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
      const subType = s.type === 'boulder' && s.boulderSubType ? ` (${s.boulderSubType})` : ''
      const exercises =
        s.exercises.length > 0
          ? ` - ${s.exercises.map((e) => e.name).join(', ')}`
          : ''
      return `- ${s.date}: ${s.type}${subType} (${s.durationMinutes}min)${exercises}`
    })
    .join('\n')
}

// Warmup exercise pools for variety
const warmupPools = {
  cardio: [
    'Jumping jacks', 'High knees', 'Butt kicks', 'Star jumps', 'Mountain climbers',
    'Burpees (light)', 'Jump rope', 'Jogging in place', 'Lateral shuffles', 'Skipping',
    'Arm circles while walking', 'Fast feet drills', 'Box step-ups', 'Jump squats (light)'
  ],
  upperBody: [
    'Arm circles', 'Shoulder rotations', 'Wrist circles', 'Band pull-aparts',
    'Scapular push-ups', 'Wall slides', 'Thread the needle', 'Cat-cow stretches',
    'Thoracic rotations', 'PVC pass-throughs', 'Prone Y raises', 'Cuban rotations',
    'Face pulls (light)', 'Chest openers'
  ],
  fingerPrep: [
    'Finger spreads and squeezes', 'Wrist flexor stretches', 'Wrist extensor stretches',
    'Finger tendon glides', 'Rubber band finger extensions', 'Piano fingers',
    'Prayer stretches', 'Reverse prayer stretches', 'Finger rolls on table',
    'Light grip squeezes', 'Finger tip touches', 'Finger walking on wall'
  ],
  core: [
    'Dead bugs', 'Bird dogs', 'Plank holds', 'Side plank dips', 'Hollow body rocks',
    'Mountain climbers (slow)', 'Leg raises (controlled)', 'Bicycle crunches (slow)',
    'Bear crawl holds', 'Pallof press holds', 'Ab wheel rollouts (partial)',
    'Hanging knee tucks', 'Russian twist (no weight)', 'Supermans'
  ],
  lowerBody: [
    'Hip circles', 'Leg swings (front-back)', 'Leg swings (side-side)', 'Deep squats',
    'Walking lunges', 'Cossack squats', 'Hip 90/90 transitions', 'Frog stretches',
    'Pigeon pose', 'Ankle circles', 'Calf raises', 'Glute bridges',
    'Fire hydrants', 'Donkey kicks', 'World\'s greatest stretch', 'Inchworms'
  ],
  climbingSpecific: [
    'Easy traverse (juggy)', 'Slab footwork drills', 'Quiet feet practice',
    'Open hand dead hangs (10 sec)', 'Light campus touches (no pull)',
    'Flag practice on easy holds', 'Smearing drills', 'Balance practice',
    'Easy dynos to jugs', 'Mantling on low ledge', 'Drop knee practice'
  ]
}

function getRandomFromArray<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

function buildWarmupPrompt(
  sessionType: string,
  context: AIContext,
  boulderSubType?: string,
  muscleGroups?: string[]
): string {
  // Generate unique random seed for variety
  const randomSeed = Date.now() % 1000

  // Pre-select random exercises for the AI to choose from (forces variety)
  const cardioSample = getRandomFromArray(warmupPools.cardio, 5)
  const upperSample = getRandomFromArray(warmupPools.upperBody, 5)
  const fingerSample = getRandomFromArray(warmupPools.fingerPrep, 4)
  const coreSample = getRandomFromArray(warmupPools.core, 5)
  const lowerSample = getRandomFromArray(warmupPools.lowerBody, 5)
  const climbingSample = getRandomFromArray(warmupPools.climbingSpecific, 4)

  const subTypeText = boulderSubType ? ` (${boulderSubType})` : ''
  const muscleGroupText = muscleGroups && muscleGroups.length > 0
    ? `\nTarget muscle groups for this session: ${muscleGroups.join(', ')}`
    : ''

  // Session-specific guidance
  let sessionGuidance = ''
  switch (sessionType) {
    case 'boulder':
      sessionGuidance = `This is a BOULDERING session${subTypeText}. Focus heavily on:
- Finger and forearm preparation (critical for crimps and holds)
- Core activation (essential for body tension)
- Hip mobility (for high steps and heel hooks)
- Power generation from legs`
      if (boulderSubType === 'campus') {
        sessionGuidance += '\n- Extra emphasis on finger strength prep and explosive movements'
      } else if (boulderSubType === 'circuits') {
        sessionGuidance += '\n- Include more cardio as circuits are endurance-focused'
      }
      break
    case 'lead':
      sessionGuidance = `This is a LEAD CLIMBING session. Focus on:
- Endurance-building cardio warmup
- Shoulder and rotator cuff activation
- Core for sustained body tension
- Mental preparation for longer climbs`
      break
    case 'hangboard':
      sessionGuidance = `This is a HANGBOARD session. Critical focus on:
- Extensive finger and forearm warmup (at least 5 minutes)
- Gradual progression from open hand to half-crimp
- Shoulder blade activation
- DO NOT rush finger warmup - injury risk is high`
      break
    case 'gym':
      sessionGuidance = `This is a GYM session (strength training). Focus on:
- General cardio to raise heart rate
- Dynamic stretching for all major muscle groups
- Core activation for stability
- ${muscleGroupText ? 'Pay special attention to warming up the target muscle groups' : 'Full body mobility'}`
      break
    case 'cardio':
      sessionGuidance = `This is a CARDIO session. Focus on:
- Gradual heart rate elevation
- Joint mobility (ankles, knees, hips)
- Light dynamic stretching
- Keep it brief, save energy for main workout`
      break
    case 'hiit':
      sessionGuidance = `This is a HIIT session. Focus on:
- Cardio to elevate heart rate
- Dynamic full-body movements
- Core activation for stability
- Prepare for explosive movements`
      break
    case 'crossfit':
      sessionGuidance = `This is a CROSSFIT session. Focus on:
- Thorough full-body warmup
- Shoulder and hip mobility
- Core and lower back preparation
- Prepare for varied, intense movements`
      break
    case 'mobility':
      sessionGuidance = `This is a MOBILITY session. Focus on:
- Gentle joint mobilization
- Progressive stretching from larger to smaller muscle groups
- Breath-focused movements
- This IS the workout, so no need to rush through warmup`
      break
    default:
      sessionGuidance = 'General athletic warmup'
  }

  return `Generate a unique climbing warmup routine. VARIATION SEED: ${randomSeed}

SESSION TYPE: ${sessionType}${subTypeText}
${muscleGroupText}

${sessionGuidance}

Recent activity (last 7 days):
${formatRecentSessions(context.lastSessions)}

Today is ${context.currentDay}.

EXERCISE POOLS TO SELECT FROM (pick from these to ensure variety):
Cardio options: ${cardioSample.join(', ')}
Upper body activation: ${upperSample.join(', ')}
Finger prep: ${fingerSample.join(', ')}
Core activation: ${coreSample.join(', ')}
Lower body/hip mobility: ${lowerSample.join(', ')}
Climbing-specific: ${climbingSample.join(', ')}

Requirements:
- 12-18 minutes total (structure depends on session type)
- Progress from general to specific
- For climbing sessions: MUST include substantial core and lower body work
- For ${sessionType}: Follow the session guidance above
- Select exercises from the pools above for variety
- Mix it up! Don't use the same exercises every time
- Consider what muscles need most prep for this specific session type

IMPORTANT: Return plain text only. No markdown formatting, no headers, no bold text, no asterisks. Just numbered lines like:
1. Exercise name (2 min)
2. Another exercise (3 min)

Be creative and specific. Don't be generic. Surprise me with the combination.
Return only the warmup routine, no preamble or explanation.`
}

export async function generateWarmup(
  sessionType: Session['type'],
  context: AIContext,
  boulderSubType?: string,
  muscleGroups?: string[]
): Promise<string> {
  const prompt = buildWarmupPrompt(sessionType, context, boulderSubType, muscleGroups)
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

  return `Generate a cooldown/stretching routine after a ${sessionType} session.
${muscleGroupsText}${exercisesText}

Recent activity (last 7 days):
${formatRecentSessions(context.lastSessions)}

Today is ${context.currentDay}.

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
  gym: number | null
  cardio: number | null
  hiit: number | null
  crossfit: number | null
  mobility: number | null
}

// Structured exercise with sets/reps for pre-populating log
export interface SuggestedExercise {
  name: string
  sets?: number
  reps?: string  // Can be "8-12" or "30 sec" etc.
}

export interface TodayOption {
  effort: 'high' | 'medium' | 'low'
  title: string
  description: string
  sessionType: Session['type']
  boulderSubType?: 'problems' | 'circuits' | 'campus' | 'intervals'
  cardioSubType?: 'bike' | 'elliptical' | 'run' | 'row'
  muscleGroups?: string[]
  exercises: SuggestedExercise[]
  durationMinutes: number
  recoveryNotes?: string  // For things like "finish with 15min foam rolling"
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

Session types (ONLY use these exact values for sessionType):
- "boulder" (with boulderSubType: "problems", "circuits", "campus", or "intervals")
- "lead"
- "hangboard"
- "gym" (with muscleGroups from: fingers, forearms, shoulders, back, core, chest, triceps, legs)
- "cardio" (with cardioSubType: "bike", "elliptical", "run", or "row")
- "hiit"
- "crossfit"
- "mobility"

Days since last session by type:
${daysSinceText}

Recent activity (last 7 days):
${formatRecentSessions(context.lastSessions)}

Suggest exactly 3 training options for today:
1. HIGH effort - for when feeling strong and well-recovered
2. MEDIUM effort - balanced training appropriate for the day
3. LOW effort - recovery focused, light activity

IMPORTANT RULES:
- Each option MUST map to exactly one sessionType from the list above
- Exercises must be CONCRETE and LOGGABLE (e.g., "Pull-ups" not "Upper body work")
- Include sets and reps for strength exercises (e.g., {"name": "Pull-ups", "sets": 3, "reps": "8-10"})
- For climbing sessions, exercises can be descriptive (e.g., {"name": "V3-V4 problems", "sets": 10})
- For cardio, just include duration in the exercise (e.g., {"name": "Running", "reps": "30 min"})
- If suggesting recovery activities (foam rolling, yoga, breathing), put them in recoveryNotes, not as the main session
- durationMinutes should be realistic (30-120 for most sessions)

Return as JSON with this exact structure:
{
  "options": [
    {
      "effort": "high",
      "title": "Short title (2-4 words)",
      "description": "One sentence explaining why this fits today",
      "sessionType": "boulder",
      "boulderSubType": "problems",
      "exercises": [
        {"name": "V4-V5 projects", "sets": 5},
        {"name": "V3 flash attempts", "sets": 8}
      ],
      "durationMinutes": 90,
      "recoveryNotes": "15 min foam rolling after"
    },
    {
      "effort": "medium",
      "sessionType": "gym",
      "muscleGroups": ["back", "core"],
      "title": "Pull Day",
      "description": "Strengthen pulling muscles for climbing",
      "exercises": [
        {"name": "Pull-ups", "sets": 4, "reps": "8-10"},
        {"name": "Rows", "sets": 3, "reps": "12"},
        {"name": "Hanging leg raises", "sets": 3, "reps": "10"}
      ],
      "durationMinutes": 45
    },
    {
      "effort": "low",
      "sessionType": "mobility",
      "title": "Active Recovery",
      "description": "Light movement to aid recovery",
      "exercises": [
        {"name": "Hip 90/90", "reps": "2 min each side"},
        {"name": "Shoulder stretches", "reps": "5 min"},
        {"name": "Thoracic rotation", "sets": 2, "reps": "10 each side"}
      ],
      "durationMinutes": 30,
      "recoveryNotes": "Consider 10 min breathing work before bed"
    }
  ]
}

IMPORTANT: No markdown in any text fields. Plain text only. sessionType MUST be one of the exact values listed above.`
}

function stripMarkdownCodeBlock(text: string): string {
  let cleaned = text.trim()
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7)
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3)
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3)
  }
  return cleaned.trim()
}

export async function generateTodayOptions(
  context: AIContext,
  daysSince: DaysSinceByType
): Promise<TodayOption[]> {
  const prompt = buildTodayOptionsPrompt(context, daysSince)
  const response = await callOpenRouter(prompt, { json: true })
  const cleanedResponse = stripMarkdownCodeBlock(response)

  try {
    const parsed = JSON.parse(cleanedResponse)
    if (!parsed.options || !Array.isArray(parsed.options)) {
      throw new Error('Invalid response structure: missing options array')
    }
    return parsed.options as TodayOption[]
  } catch (parseError) {
    console.error('Failed to parse response:', parseError, 'Response was:', response)
    throw new Error(`Failed to parse AI response: ${parseError}`)
  }
}

export function buildAIContext(
  lastSessions: Session[],
  _unused: null
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
    currentDay,
    scheduledClimbing: [
      'Monday: boulder',
      'Wednesday: boulder',
      'Saturday: lead'
    ]
  }
}
