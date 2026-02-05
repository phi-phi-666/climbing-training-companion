export const muscleGroups = [
  'fingers',
  'forearms',
  'shoulders',
  'back',
  'core',
  'chest',
  'triceps',
  'legs',
  'mobility'
] as const

export type MuscleGroup = (typeof muscleGroups)[number]

export const exercisesByGroup: Record<MuscleGroup, string[]> = {
  fingers: [
    'Hangboard repeaters',
    'Hangboard max hangs',
    'Finger curls',
    'Rice bucket',
    'No-hang device',
    'Pinch block training',
    'Open hand hangs',
    'Half crimp hangs'
  ],
  forearms: [
    'Wrist curls',
    'Reverse wrist curls',
    'Pronation/supination',
    'Hammer curls',
    'Farmers carry',
    'Wrist roller'
  ],
  shoulders: [
    'Face pulls',
    'External rotation',
    'YTWs',
    'Shoulder dislocates',
    'Lateral raises',
    'Front raises',
    'Cuban press',
    'Band pull-aparts'
  ],
  back: [
    'Pull-ups',
    'Rows',
    'Lat pulldowns',
    'Scapular pull-ups',
    'Inverted rows',
    'One-arm rows',
    'Deadlifts',
    'Bent-over rows'
  ],
  core: [
    'Hanging leg raises',
    'Planks',
    'Dead bugs',
    'Pallof press',
    'Ab wheel',
    'L-sits',
    'Dragon flags',
    'Hollow body holds',
    'Russian twists',
    'Windshield wipers'
  ],
  chest: [
    'Push-ups',
    'Dips',
    'Bench press',
    'Chest flies',
    'Diamond push-ups',
    'Incline push-ups',
    'Cable crossovers',
    'Archer push-ups'
  ],
  triceps: [
    'Tricep dips',
    'Tricep pushdowns',
    'Overhead extension',
    'Close-grip bench press',
    'Skull crushers',
    'Diamond push-ups'
  ],
  legs: [
    'Squats',
    'Lunges',
    'Pistol squats',
    'Calf raises',
    'Romanian deadlifts',
    'Bulgarian split squats',
    'Box jumps',
    'Step-ups'
  ],
  mobility: [
    'Hip 90/90',
    'Shoulder stretches',
    'Thoracic rotation',
    'Wrist stretches',
    'Frog stretch',
    'Pigeon pose',
    'Cat-cow',
    'World\'s greatest stretch'
  ]
}

// Bouldering sub-types
export const boulderSubTypes = [
  { value: 'problems', label: 'Problems', emoji: '🪨' },
  { value: 'circuits', label: 'Circuits', emoji: '🔄' },
  { value: 'campus', label: 'Campus Board', emoji: '🪜' },
  { value: 'intervals', label: 'Intervals', emoji: '⏱️' }
] as const

export type BoulderSubType = (typeof boulderSubTypes)[number]['value']

export const sessionTypes = [
  { value: 'boulder', label: 'Bouldering', emoji: '🪨', hasSubTypes: true },
  { value: 'lead', label: 'Lead Climbing', emoji: '🧗', hasSubTypes: false },
  { value: 'hangboard', label: 'Hangboard', emoji: '🤏', hasSubTypes: false },
  { value: 'gym', label: 'Gym', emoji: '💪', hasSubTypes: false },
  { value: 'cardio', label: 'Cardio', emoji: '🏃', hasSubTypes: false },
  { value: 'hiit', label: 'HIIT', emoji: '🔥', hasSubTypes: false },
  { value: 'crossfit', label: 'CrossFit', emoji: '🏋️', hasSubTypes: false }
] as const

export type SessionType = (typeof sessionTypes)[number]['value']

export function getExercisesForGroups(groups: MuscleGroup[]): string[] {
  return groups.flatMap((group) => exercisesByGroup[group])
}

export function getMuscleGroupForExercise(
  exerciseName: string
): MuscleGroup | null {
  for (const [group, exercises] of Object.entries(exercisesByGroup)) {
    if (exercises.includes(exerciseName)) {
      return group as MuscleGroup
    }
  }
  return null
}
