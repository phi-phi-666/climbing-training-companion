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
  muscleGroups?: string[],
  durationMinutes: number = 10
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
- TOTAL DURATION: ${durationMinutes} minutes (this is critical - do not exceed)
- Progress from general to specific
- For climbing sessions: MUST include substantial core and lower body work
- For ${sessionType}: Follow the session guidance above
- Select exercises from the pools above for variety
- Mix it up! Don't use the same exercises every time
- Consider what muscles need most prep for this specific session type
- Each exercise duration should add up to approximately ${durationMinutes} minutes total

IMPORTANT: Return plain text only. No markdown formatting, no headers, no bold text, no asterisks. Just numbered lines like:
1. Exercise name (2 min)
2. Another exercise (1.5 min)

Be creative and specific. Don't be generic. Surprise me with the combination.
Return only the warmup routine, no preamble or explanation.`
}

export async function generateWarmup(
  sessionType: Session['type'],
  context: AIContext,
  boulderSubType?: string,
  muscleGroups?: string[],
  durationMinutes: number = 10
): Promise<string> {
  const prompt = buildWarmupPrompt(sessionType, context, boulderSubType, muscleGroups, durationMinutes)
  return callOpenRouter(prompt)
}

function buildCooldownPrompt(
  sessionType: string,
  context: AIContext,
  muscleGroups?: string[],
  exercises?: string[],
  boulderSubType?: string,
  durationMinutes: number = 10
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
- TOTAL DURATION: ${durationMinutes} minutes (this is critical - do not exceed)
- Focus on recovery and flexibility
- PRIORITIZE stretches for the specific muscle groups worked in this session
- Include both static stretches and gentle mobility work
- For climbing sessions, always include forearm and finger stretches
- Format as a simple numbered list with duration per item
- Keep descriptions concise (one line each)
- Each stretch duration should add up to approximately ${durationMinutes} minutes total

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
  boulderSubType?: string,
  durationMinutes: number = 10
): Promise<string> {
  const prompt = buildCooldownPrompt(sessionType, context, muscleGroups, exercises, boulderSubType, durationMinutes)
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
- Descriptions must ONLY reference sessions that actually appear in the "Recent activity" data above. Do NOT fabricate or assume any training history. If no recent sessions exist, base descriptions on the day of the week and general training principles instead.

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

// ============================================
// NEW: Climbing Session Generation
// ============================================

export interface ClimbingSessionPhase {
  name: string
  duration?: string
  details?: string
}

export interface ClimbingSession {
  type: 'boulder' | 'lead'
  subType?: 'problems' | 'circuits' | 'campus' | 'intervals'
  title: string
  description: string
  focus: string
  durationMinutes: number
  structure: ClimbingSessionPhase[]
  exercises?: SuggestedExercise[]
  tips?: string
  intensityLevel?: 'light' | 'moderate' | 'hard' | 'max'
  gradeRange?: string
}

// Session focus options for user selection
export const BOULDER_FOCUS_OPTIONS = [
  { value: 'power', label: 'Power', description: 'Limit moves, max strength' },
  { value: 'endurance', label: 'Endurance', description: '4x4s, circuits, volume' },
  { value: 'technique', label: 'Technique', description: 'Footwork, body position' },
  { value: 'project', label: 'Project', description: 'Work your project grade' },
  { value: 'volume', label: 'Volume', description: 'Many problems, flash level' },
  { value: 'weakness', label: 'Weakness', description: 'Slopers, crimps, or style' },
  { value: 'surprise', label: 'Surprise Me', description: 'AI picks the theme' }
] as const

export const LEAD_FOCUS_OPTIONS = [
  { value: 'endurance', label: 'Endurance', description: 'Laps, sustained climbing' },
  { value: 'redpoint', label: 'Redpoint', description: 'Project attempts' },
  { value: 'onsight', label: 'Onsight', description: 'New routes, route reading' },
  { value: 'mental', label: 'Mental', description: 'Fall practice, fear work' },
  { value: 'technique', label: 'Technique', description: 'Resting, clipping, pacing' },
  { value: 'volume', label: 'Volume', description: 'Many easy-moderate routes' },
  { value: 'surprise', label: 'Surprise Me', description: 'AI picks the theme' }
] as const

export type BoulderFocus = typeof BOULDER_FOCUS_OPTIONS[number]['value']
export type LeadFocus = typeof LEAD_FOCUS_OPTIONS[number]['value']

function buildClimbingSessionPrompt(
  type: 'boulder' | 'lead',
  context: AIContext,
  focus?: BoulderFocus | LeadFocus,
  intensity?: 'light' | 'moderate' | 'hard' | 'max'
): string {
  const boulderThemesByFocus: Record<string, string[]> = {
    power: ['Limit Bouldering (project level)', 'Campus Ladder Work', 'Max Hangs Between Problems'],
    endurance: ['Power Endurance (4x4s)', 'Interval Training (ON/OFF cycles)', 'Circuit Training'],
    technique: ['Technique Focus (footwork, body positioning)', 'Slab Practice (balance, friction)', 'Silent Feet Drills'],
    project: ['Project Session (redpoint burns)', 'Move Isolation', 'Link Training'],
    volume: ['Volume Session (flash level, high quantity)', 'Pyramid (up and down grades)', 'Flash Attempts'],
    weakness: ['Weakness Targeting (slopers/crimps/pinches)', 'Overhang Power (steep terrain)', 'Compression Training'],
    surprise: ['Power Endurance (4x4s)', 'Limit Bouldering', 'Technique Focus', 'Competition Simulation']
  }

  const leadThemesByFocus: Record<string, string[]> = {
    endurance: ['Endurance Laps (sub-max routes)', 'ARC Training', 'Volume Day'],
    redpoint: ['Redpoint Burns (project attempts)', 'Link Training (sections)', 'Rehearsal Climbs'],
    onsight: ['Onsight Practice (new routes)', 'Route Reading Focus', 'Flash Attempts'],
    mental: ['Mental Training (mock lead falls)', 'Exposure Therapy', 'Commitment Moves'],
    technique: ['Rest Position Practice (shaking out)', 'Clipping Practice', 'Pacing Work'],
    volume: ['Volume Day (many easy-moderate routes)', 'Mileage Session', 'Active Recovery Climbing'],
    surprise: ['Endurance Laps', 'Onsight Practice', 'Redpoint Burns', 'Technique Work']
  }

  const themeMap = type === 'boulder' ? boulderThemesByFocus : leadThemesByFocus
  const selectedFocus = focus || 'surprise'
  const themes = themeMap[selectedFocus] || themeMap['surprise']
  const randomThemes = themes.sort(() => Math.random() - 0.5).slice(0, 2)

  const intensityGuidance = intensity ? {
    light: 'Keep intensity LOW - focus on movement quality over difficulty. Stay 2-3 grades below max.',
    moderate: 'MODERATE intensity - mix of comfortable and challenging. Stay around flash level.',
    hard: 'HIGH intensity session - push toward limit. Expect to fall and try hard.',
    max: 'MAXIMUM effort - project-level attempts. Full rest between burns. Quality over quantity.'
  }[intensity] : ''

  return `Generate a detailed ${type === 'boulder' ? 'BOULDERING' : 'LEAD CLIMBING'} session plan.

Today is ${context.currentDay}.
${focus && focus !== 'surprise' ? `\nUser selected focus: ${focus.toUpperCase()}` : ''}
${intensityGuidance ? `\nIntensity: ${intensityGuidance}` : ''}

Recent activity (last 7 days):
${formatRecentSessions(context.lastSessions)}

Theme options to consider: ${randomThemes.join(', ')}

Requirements:
- Create a structured session with clear phases (warmup already done separately)
- Include specific details: grades, rest times, number of attempts
- Total duration: 60-120 minutes
- Be creative and specific - not generic advice
- Consider the recent training history for appropriate intensity
- ${type === 'boulder' ? 'For bouldering: specify problem types, styles, and intensity' : 'For lead: specify route grades, number of routes, and rest periods'}
- Make the session FUN and motivating, not just a list of instructions
- Include variety within the session

Return as JSON:
{
  "type": "${type}",
  ${type === 'boulder' ? '"subType": "problems" | "circuits" | "campus" | "intervals",' : ''}
  "title": "Catchy 2-4 word title",
  "description": "One sentence overview that gets the climber excited",
  "focus": "Main training goal",
  "durationMinutes": 90,
  "intensityLevel": "light" | "moderate" | "hard" | "max",
  "gradeRange": "e.g. V3-V5 or 5.10-5.11",
  "structure": [
    {
      "name": "Phase name",
      "duration": "20 min",
      "details": "Specific instructions: grades, rest, technique cues"
    }
  ],
  "tips": "One practical tip for crushing this session"
}

IMPORTANT: Return valid JSON only. No markdown, no code blocks.`
}

export async function generateClimbingSession(
  type: 'boulder' | 'lead',
  context: AIContext,
  focus?: BoulderFocus | LeadFocus,
  intensity?: 'light' | 'moderate' | 'hard' | 'max'
): Promise<ClimbingSession> {
  const prompt = buildClimbingSessionPrompt(type, context, focus, intensity)
  const response = await callOpenRouter(prompt, { json: true })
  const cleanedResponse = stripMarkdownCodeBlock(response)

  try {
    const parsed = JSON.parse(cleanedResponse)
    return parsed as ClimbingSession
  } catch (parseError) {
    console.error('Failed to parse climbing session:', parseError, 'Response:', response)
    throw new Error('Failed to generate climbing session')
  }
}

// ============================================
// NEW: Non-Climbing Day Options
// ============================================

function buildNonClimbingOptionsPrompt(
  location: 'home' | 'gym' | 'outdoor',
  allowedTypes: string[],
  context: AIContext
): string {
  const locationEquipment: Record<string, string> = {
    home: 'mat, dumbbells, resistance bands, hangboard, ab wheel',
    gym: 'full gym equipment (machines, free weights, cables, cardio equipment)',
    outdoor: 'bodyweight only, outdoor space'
  }

  return `Generate 3 workout options for today.

Location: ${location.toUpperCase()}
Available equipment: ${locationEquipment[location]}
Allowed session types: ${allowedTypes.join(', ')}

Today is ${context.currentDay}.

Recent activity (last 7 days):
${formatRecentSessions(context.lastSessions)}

CRITICAL RULES:
- sessionType MUST be one of: ${allowedTypes.join(', ')}
- DO NOT suggest boulder, lead, or any climbing activity
- Exercises must work with the available equipment
- Consider recovery needs based on recent sessions

Generate 3 options with varying intensity:
1. HIGH effort - challenging workout
2. MEDIUM effort - solid training
3. LOW effort - recovery/light activity

Return as JSON:
{
  "options": [
    {
      "effort": "high",
      "title": "2-4 word title",
      "description": "Why this fits today",
      "sessionType": "one of allowed types",
      "exercises": [
        {"name": "Exercise", "sets": 3, "reps": "10-12"}
      ],
      "durationMinutes": 45
    }
  ]
}

IMPORTANT: Return valid JSON only. No markdown.`
}

export async function generateNonClimbingOptions(
  location: 'home' | 'gym' | 'outdoor',
  allowedTypes: string[],
  context: AIContext
): Promise<TodayOption[]> {
  const prompt = buildNonClimbingOptionsPrompt(location, allowedTypes, context)
  const response = await callOpenRouter(prompt, { json: true })
  const cleanedResponse = stripMarkdownCodeBlock(response)

  try {
    const parsed = JSON.parse(cleanedResponse)
    if (!parsed.options || !Array.isArray(parsed.options)) {
      throw new Error('Invalid response structure')
    }
    return parsed.options as TodayOption[]
  } catch (parseError) {
    console.error('Failed to parse options:', parseError, 'Response:', response)
    throw new Error('Failed to generate workout options')
  }
}

// ============================================
// "I Need More" - Enhanced Supplementary Workout
// ============================================

export type WorkoutType = 'antagonist' | 'supplementary' | 'core'

export interface INeedMoreExercise {
  name: string
  sets?: number
  reps?: string
}

export interface INeedMoreResult {
  title: string
  description: string
  muscleGroups: string[]
  exercises: INeedMoreExercise[]
  notes?: string
}

// Exercise pools for "I Need More"
const iNeedMorePools = {
  antagonist: {
    // Pushing movements (climbing is pulling)
    push: [
      'Push-ups', 'Diamond push-ups', 'Pike push-ups', 'Dips',
      'Bench press', 'Incline press', 'Overhead press', 'Arnold press',
      'Chest flies', 'Cable crossover', 'Tricep dips', 'Close grip bench'
    ],
    shoulders: [
      'Face pulls', 'External rotations', 'Cuban rotations', 'Band pull-aparts',
      'Reverse flies', 'YTWs', 'Prone I-raises', 'Wall slides',
      'Shoulder dislocates', 'Front raises', 'Lateral raises'
    ],
    wrists: [
      'Reverse wrist curls', 'Wrist roller (extension)', 'Rice bucket extensions',
      'Finger extensor band work', 'Reverse grip curls'
    ]
  },
  supplementary: {
    // More pulling volume
    pull: [
      'Pull-ups', 'Chin-ups', 'Wide grip pull-ups', 'L-sit pull-ups',
      'Rows (barbell)', 'Rows (dumbbell)', 'Cable rows', 'Face pulls',
      'Lat pulldowns', 'Straight arm pulldowns', 'Inverted rows'
    ],
    grip: [
      'Dead hangs', 'Towel hangs', 'Fat grip hangs', 'Pinch blocks',
      'Farmer carries', 'Plate pinches', 'Gripper work'
    ],
    fingers: [
      'Half-crimp hangs', 'Open hand hangs', 'Pocket hangs (3 finger)',
      'Repeaters', 'Max hangs (moderate weight)'
    ]
  },
  core: {
    anterior: [
      'Hollow body holds', 'Dead bugs', 'Hanging leg raises', 'L-sits',
      'Ab wheel rollouts', 'Plank', 'Mountain climbers', 'Bicycle crunches',
      'V-ups', 'Toe touches', 'Flutter kicks', 'Dragon flags'
    ],
    obliques: [
      'Side plank', 'Russian twists', 'Windshield wipers', 'Pallof press',
      'Cable woodchops', 'Side crunches', 'Copenhagen plank'
    ],
    posterior: [
      'Supermans', 'Bird dogs', 'Back extensions', 'Reverse hypers',
      'Glute bridges', 'Hip thrusts', 'Good mornings'
    ]
  }
}

function buildINeedMorePrompt(
  sessionType: string,
  context: AIContext,
  workoutTypes: WorkoutType[],
  durationMinutes: number,
  boulderSubType?: string
): string {
  const subTypeText = boulderSubType ? ` (${boulderSubType})` : ''
  const isClimbingSession = ['boulder', 'lead', 'hangboard'].includes(sessionType)

  // Build workout focus descriptions
  const focusDescriptions: string[] = []
  const exercisePools: string[] = []

  if (workoutTypes.includes('antagonist')) {
    focusDescriptions.push('ANTAGONIST work (pushing movements to balance climbing/pulling)')
    exercisePools.push(
      `Pushing exercises: ${getRandomFromArray(iNeedMorePools.antagonist.push, 5).join(', ')}`,
      `Shoulder health: ${getRandomFromArray(iNeedMorePools.antagonist.shoulders, 4).join(', ')}`,
      `Wrist extensors: ${getRandomFromArray(iNeedMorePools.antagonist.wrists, 3).join(', ')}`
    )
  }

  if (workoutTypes.includes('supplementary')) {
    focusDescriptions.push('SUPPLEMENTARY volume (more pulling/grip work)')
    exercisePools.push(
      `Pulling exercises: ${getRandomFromArray(iNeedMorePools.supplementary.pull, 5).join(', ')}`,
      `Grip work: ${getRandomFromArray(iNeedMorePools.supplementary.grip, 4).join(', ')}`
    )
  }

  if (workoutTypes.includes('core')) {
    focusDescriptions.push('CORE training (stability and power transfer)')
    exercisePools.push(
      `Anterior core: ${getRandomFromArray(iNeedMorePools.core.anterior, 5).join(', ')}`,
      `Obliques: ${getRandomFromArray(iNeedMorePools.core.obliques, 3).join(', ')}`,
      `Posterior chain: ${getRandomFromArray(iNeedMorePools.core.posterior, 3).join(', ')}`
    )
  }

  // Special warning for supplementary after climbing
  const supplementaryWarning = workoutTypes.includes('supplementary') && isClimbingSession
    ? '\nWARNING: User selected supplementary pulling after a climbing session. Include lighter intensity and focus on technique/endurance rather than max strength to reduce injury risk.'
    : ''

  return `Generate a focused supplementary workout after a ${sessionType}${subTypeText} session.

The user wants: ${focusDescriptions.join(' + ')}
Duration: ${durationMinutes} minutes
${supplementaryWarning}

Recent activity (last 7 days):
${formatRecentSessions(context.lastSessions)}

Today is ${context.currentDay}.

EXERCISE POOLS TO SELECT FROM:
${exercisePools.join('\n')}

Requirements:
- Create a ${durationMinutes}-minute workout
- Select ${Math.floor(durationMinutes / 5)}-${Math.floor(durationMinutes / 3)} exercises (adjust for duration)
- Include sets and reps for each exercise
- For ${durationMinutes <= 15 ? 'short sessions: 2-4 exercises, keep rest minimal' : durationMinutes <= 30 ? 'medium sessions: 4-6 exercises, moderate rest' : 'longer sessions: 6-8 exercises, can include supersets'}
- If multiple workout types selected, balance time between them
- Title should be catchy and describe the focus (2-4 words)
- Description should explain the benefit in one sentence
- List which muscle groups are targeted

Return as JSON:
{
  "title": "Catchy 2-4 word title",
  "description": "One sentence explaining the focus and benefit",
  "muscleGroups": ["chest", "shoulders", "triceps"],
  "exercises": [
    {"name": "Push-ups", "sets": 3, "reps": "12-15"},
    {"name": "Face pulls", "sets": 3, "reps": "15-20"},
    {"name": "Hollow body holds", "sets": 3, "reps": "30 sec"}
  ],
  "notes": "Optional coaching tip or reminder"
}

IMPORTANT: Return valid JSON only. No markdown, no code blocks.`
}

export async function generateINeedMore(
  sessionType: Session['type'],
  context: AIContext,
  workoutTypes: WorkoutType[],
  durationMinutes: number,
  boulderSubType?: string
): Promise<INeedMoreResult> {
  const prompt = buildINeedMorePrompt(sessionType, context, workoutTypes, durationMinutes, boulderSubType)
  const response = await callOpenRouter(prompt, { json: true })
  const cleanedResponse = stripMarkdownCodeBlock(response)

  try {
    const parsed = JSON.parse(cleanedResponse)
    return parsed as INeedMoreResult
  } catch (parseError) {
    console.error('Failed to parse I Need More result:', parseError, 'Response:', response)
    throw new Error('Failed to generate workout')
  }
}
