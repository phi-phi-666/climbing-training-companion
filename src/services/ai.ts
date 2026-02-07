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
  exercises?: string[],
  boulderSubType?: string
): string {
  const muscleGroupsText = muscleGroups && muscleGroups.length > 0
    ? `\nMuscle groups worked this session: ${muscleGroups.join(', ')}`
    : ''

  const exercisesText = exercises && exercises.length > 0
    ? `\nExercises performed: ${exercises.join(', ')}`
    : ''

  const subTypeText = boulderSubType ? ` (${boulderSubType})` : ''

  // Session-specific guidance for cooldown
  let sessionGuidance = ''
  if (sessionType === 'boulder' && boulderSubType) {
    switch (boulderSubType) {
      case 'campus':
        sessionGuidance = '\nThis was a CAMPUS BOARD session - very finger-intensive. Prioritize extensive finger/forearm stretches and shoulder recovery.'
        break
      case 'circuits':
        sessionGuidance = '\nThis was a CIRCUITS session - endurance focused with high volume. Focus on full body recovery and light cardio cooldown.'
        break
      case 'problems':
        sessionGuidance = '\nThis was a PROBLEMS session - power and technique focused. Include hip and shoulder mobility, plus finger care.'
        break
      case 'intervals':
        sessionGuidance = '\nThis was an INTERVALS session - mixed intensity climbing. Balance between power recovery and endurance work.'
        break
    }
  }

  return `Generate a cooldown/stretching routine after a ${sessionType}${subTypeText} session.
${muscleGroupsText}${exercisesText}${sessionGuidance}

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
  exercises?: string[],
  boulderSubType?: string
): Promise<string> {
  const prompt = buildCooldownPrompt(sessionType, context, muscleGroups, exercises, boulderSubType)
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

// Supplementary/antagonist exercises for "I Need More"
function buildSupplementaryPrompt(
  sessionType: string,
  context: AIContext,
  boulderSubType?: string
): string {
  const subTypeText = boulderSubType ? ` (${boulderSubType})` : ''

  // Session-specific antagonist focus
  let antagonistFocus = ''
  switch (sessionType) {
    case 'boulder':
    case 'lead':
    case 'hangboard':
      antagonistFocus = `After climbing, focus on ANTAGONIST muscles:
- PUSHING movements (climbing is all pulling)
- Chest: push-ups, dips, chest flies
- Shoulders: overhead press, front raises, pike push-ups
- Triceps: dips, tricep extensions
- Wrist extensors: reverse wrist curls
- External rotators: band rotations, face pulls`
      break
    case 'gym':
    case 'crossfit':
    case 'hiit':
      antagonistFocus = `After strength training, add SUPPLEMENTARY work:
- Core stability if not covered
- Mobility work for worked muscles
- Light antagonist work for balance`
      break
    default:
      antagonistFocus = `Add complementary exercises:
- Core work
- Upper body if lower body was focus (and vice versa)
- Mobility and stability work`
  }

  return `Generate a SHORT supplementary workout after a ${sessionType}${subTypeText} session.

The user has energy left and wants to do MORE, but smart training.

${antagonistFocus}

Recent activity (last 7 days):
${formatRecentSessions(context.lastSessions)}

Today is ${context.currentDay}.

Requirements:
- 10-20 minutes MAX (this is bonus work, not a new session)
- 3-5 exercises only
- Focus on ANTAGONIST or COMPLEMENTARY movements
- Include sets and reps
- Keep it simple and effective
- For climbing sessions: PRIORITIZE pushing movements and external rotation

IMPORTANT: Return plain text only. No markdown formatting, no headers, no bold text, no asterisks. Just numbered lines like:
1. Exercise name - 3×12 (brief note if needed)
2. Another exercise - 3×10

Return only the exercises, no preamble or explanation.`
}

export async function generateSupplementary(
  sessionType: Session['type'],
  context: AIContext,
  boulderSubType?: string
): Promise<string> {
  const prompt = buildSupplementaryPrompt(sessionType, context, boulderSubType)
  return callOpenRouter(prompt)
}

// Structured exercise with sets/reps for pre-populating log
export interface SuggestedExercise {
  name: string
  sets?: number
  reps?: string  // Can be "8-12" or "30 sec" etc.
}

export interface TodayOption {
  effort: 'high' | 'medium' | 'low' | 'rest'  // 'rest' for rest day suggestions
  title: string
  description: string
  sessionType: Session['type'] | 'rest'  // 'rest' is a special type for rest days
  boulderSubType?: 'problems' | 'circuits' | 'campus' | 'intervals'
  cardioSubType?: 'bike' | 'elliptical' | 'run' | 'row'
  muscleGroups?: string[]
  exercises: SuggestedExercise[]
  durationMinutes: number
  recoveryNotes?: string  // For things like "finish with 15min foam rolling"
  isRestDay?: boolean  // Flag for rest day suggestions
}

function buildTodayOptionsPrompt(context: AIContext, daysSince: DaysSinceByType): string {
  const daysSinceText = Object.entries(daysSince)
    .map(([type, days]) => `- ${type}: ${days === null ? 'never' : days === 0 ? 'today' : `${days} days ago`}`)
    .join('\n')

  // Calculate training load for rest day logic
  const recentSessions = context.lastSessions
  const sessionsLast3Days = recentSessions.filter(s => {
    const sessionDate = new Date(s.date)
    const today = new Date()
    const diffDays = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 3
  })
  const consecutiveTrainingDays = sessionsLast3Days.length
  const hasHighIntensityRecently = sessionsLast3Days.some(s =>
    s.type === 'boulder' || s.type === 'hangboard' || s.type === 'hiit' || s.type === 'crossfit'
  )

  // Determine if rest day should be suggested
  const shouldSuggestRest = consecutiveTrainingDays >= 3 || (consecutiveTrainingDays >= 2 && hasHighIntensityRecently)

  const restDayInstruction = shouldSuggestRest ? `
REST DAY CONSIDERATION:
You've trained ${consecutiveTrainingDays} days in the last 3 days${hasHighIntensityRecently ? ' including high-intensity sessions' : ''}.
Your body likely needs recovery. For ONE of your 3 options (replace the LOW effort option), suggest a REST DAY instead:
- Use "effort": "rest" and "sessionType": "rest" and "isRestDay": true
- Title should be calming (e.g., "Complete Rest", "Recovery Day", "Take It Easy")
- Description should acknowledge the training load and suggest rest
- exercises array can include gentle activities: walk, sauna, bath, massage, stretching, sleep, reading
- Keep durationMinutes low (0-30)
- Be encouraging, not preachy - rest is part of training!

Example rest day option:
{
  "effort": "rest",
  "title": "Recovery Day",
  "description": "You've pushed hard - let your body adapt and grow stronger",
  "sessionType": "rest",
  "isRestDay": true,
  "exercises": [
    {"name": "Leisurely walk", "reps": "20-30 min"},
    {"name": "Sauna or hot bath", "reps": "15-20 min"}
  ],
  "durationMinutes": 0,
  "recoveryNotes": "Focus on sleep, hydration, and nutrition today"
}
` : ''

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
- "rest" (ONLY when rest day is appropriate - see below)

Days since last session by type:
${daysSinceText}

Recent activity (last 7 days):
${formatRecentSessions(context.lastSessions)}
${restDayInstruction}
Suggest exactly 3 training options for today:
1. HIGH effort - for when feeling strong and well-recovered
2. MEDIUM effort - balanced training appropriate for the day
3. LOW effort - recovery focused, light activity ${shouldSuggestRest ? '(OR a rest day if warranted)' : ''}

IMPORTANT RULES:
- Each option MUST map to exactly one sessionType from the list above
- Exercises must be CONCRETE and LOGGABLE (e.g., "Pull-ups" not "Upper body work")
- Include sets and reps for strength exercises (e.g., {"name": "Pull-ups", "sets": 3, "reps": "8-10"})
- For climbing sessions, exercises can be descriptive (e.g., {"name": "V3-V4 problems", "sets": 10})
- For cardio, just include duration in the exercise (e.g., {"name": "Running", "reps": "30 min"})
- If suggesting recovery activities (foam rolling, yoga, breathing), put them in recoveryNotes, not as the main session
- durationMinutes should be realistic (30-120 for most sessions, 0 for rest days)

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
