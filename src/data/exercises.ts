export const muscleGroups = [
  'fingers',
  'forearms',
  'shoulders',
  'back',
  'core',
  'chest',
  'triceps',
  'legs'
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
  ]
}

// CrossFit-specific exercises by muscle group
export const crossfitExercisesByGroup: Record<MuscleGroup, string[]> = {
  fingers: [
    'Barbell grip holds',
    'Farmers carry',
    'Rope climbs'
  ],
  forearms: [
    'Wrist curls',
    'Farmers carry',
    'Dead hangs'
  ],
  shoulders: [
    'Thrusters',
    'Push press',
    'Push jerk',
    'Split jerk',
    'Handstand push-ups',
    'Overhead squat',
    'Snatch',
    'Shoulder to overhead'
  ],
  back: [
    'Pull-ups',
    'Chest-to-bar pull-ups',
    'Muscle-ups',
    'Ring rows',
    'Deadlifts',
    'Power cleans',
    'Hang cleans',
    'Snatch'
  ],
  core: [
    'Toes-to-bar',
    'Knees-to-elbows',
    'GHD sit-ups',
    'L-sits',
    'Hollow rocks',
    'V-ups',
    'Ab mat sit-ups',
    'Plank holds'
  ],
  chest: [
    'Push-ups',
    'Ring dips',
    'Bench press',
    'Ring push-ups',
    'Hand-release push-ups',
    'Muscle-ups'
  ],
  triceps: [
    'Ring dips',
    'Push-ups',
    'Handstand push-ups',
    'Close-grip bench press',
    'Tricep pushdowns'
  ],
  legs: [
    'Back squats',
    'Front squats',
    'Overhead squats',
    'Thrusters',
    'Wall balls',
    'Box jumps',
    'Lunges',
    'Pistol squats',
    'Power cleans',
    'Clean and jerk',
    'Double-unders',
    'Assault bike'
  ]
}

// Bouldering sub-types
export const boulderSubTypes = [
  { value: 'problems', label: 'Problems' },
  { value: 'circuits', label: 'Circuits' },
  { value: 'campus', label: 'Campus Board' },
  { value: 'intervals', label: 'Intervals' }
] as const

export type BoulderSubType = (typeof boulderSubTypes)[number]['value']

// Cardio sub-types
export const cardioSubTypes = [
  { value: 'bike', label: 'Cycling' },
  { value: 'elliptical', label: 'Elliptical' },
  { value: 'run', label: 'Running' },
  { value: 'row', label: 'Rowing' }
] as const

export type CardioSubType = (typeof cardioSubTypes)[number]['value']

// Mobility exercises (active movement-based - foam rolling and lacrosse ball are in Recovery)
export const mobilityExercises = [
  'Hip 90/90',
  'Shoulder stretches',
  'Thoracic rotation',
  'Wrist stretches',
  'Frog stretch',
  'Pigeon pose',
  'Cat-cow',
  'World\'s greatest stretch',
  'Couch stretch',
  'Banded hip flexor stretch',
  'Ankle mobility',
  'Deep squat hold',
  'Wall slides',
  'Thread the needle'
]

// Hangboard exercises
export const hangboardExercises = [
  'Max hangs - 20mm edge',
  'Max hangs - 15mm edge',
  'Max hangs - 10mm edge',
  'Repeaters - 20mm edge',
  'Repeaters - 15mm edge',
  'Repeaters - 10mm edge',
  'Half crimp hangs',
  'Open hand hangs',
  'Three finger drag',
  'Front two fingers',
  'Back two fingers',
  'Mono hangs',
  'Pinch hangs',
  'Sloper hangs',
  'One arm hangs',
  'Offset hangs',
  'Lock-off hangs',
  'Pull-up repeaters'
]

// Recovery activities (separate from training sessions)
export const recoveryTypes = [
  { value: 'foam_roll', label: 'Foam rolling' },
  { value: 'lacrosse_ball', label: 'Lacrosse ball work' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'sauna', label: 'Sauna' },
  { value: 'cold_plunge', label: 'Cold plunge' },
  { value: 'massage', label: 'Massage' },
  { value: 'breathing', label: 'Breathing work' },
  { value: 'sleep', label: 'Extra sleep' }
] as const

export type RecoveryType = (typeof recoveryTypes)[number]['value']

export const sessionTypes = [
  { value: 'boulder', label: 'Bouldering', hasSubTypes: true },
  { value: 'lead', label: 'Lead Climbing', hasSubTypes: false },
  { value: 'hangboard', label: 'Hangboard', hasSubTypes: false },
  { value: 'gym', label: 'Gym', hasSubTypes: false },
  { value: 'cardio', label: 'Cardio', hasSubTypes: true },
  { value: 'hiit', label: 'HIIT', hasSubTypes: false },
  { value: 'crossfit', label: 'CrossFit', hasSubTypes: false },
  { value: 'mobility', label: 'Mobility', hasSubTypes: false }
] as const

export type SessionType = (typeof sessionTypes)[number]['value']

export function getExercisesForGroups(groups: MuscleGroup[], isCrossfit: boolean = false): string[] {
  const exerciseMap = isCrossfit ? crossfitExercisesByGroup : exercisesByGroup
  return groups.flatMap((group) => exerciseMap[group])
}

export function getMergedExercisesByGroup(
  customExercises: { name: string; muscleGroup: string }[]
): Record<MuscleGroup, string[]> {
  const merged: Record<string, string[]> = {}
  for (const group of muscleGroups) {
    merged[group] = [...exercisesByGroup[group]]
  }
  for (const ex of customExercises) {
    const group = ex.muscleGroup as MuscleGroup
    if (merged[group]) {
      if (!merged[group].includes(ex.name)) {
        merged[group].push(ex.name)
      }
    }
  }
  return merged as Record<MuscleGroup, string[]>
}

export function getMuscleGroupForExercise(
  exerciseName: string,
  isCrossfit: boolean = false
): MuscleGroup | null {
  const exerciseMap = isCrossfit ? crossfitExercisesByGroup : exercisesByGroup
  for (const [group, exercises] of Object.entries(exerciseMap)) {
    if (exercises.includes(exerciseName)) {
      return group as MuscleGroup
    }
  }
  return null
}
