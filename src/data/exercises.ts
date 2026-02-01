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
    'Rice bucket'
  ],
  forearms: ['Wrist curls', 'Reverse wrist curls', 'Pronation/supination'],
  shoulders: [
    'Face pulls',
    'External rotation',
    'YTWs',
    'Shoulder dislocates'
  ],
  back: ['Pull-ups', 'Rows', 'Lat pulldowns', 'Scapular pull-ups'],
  core: [
    'Hanging leg raises',
    'Planks',
    'Dead bugs',
    'Pallof press',
    'Ab wheel'
  ],
  chest: ['Push-ups', 'Dips', 'Bench press', 'Chest flies'],
  triceps: ['Tricep dips', 'Tricep pushdowns', 'Overhead extension'],
  legs: ['Squats', 'Lunges', 'Pistol squats', 'Calf raises'],
  mobility: [
    'Hip 90/90',
    'Shoulder stretches',
    'Thoracic rotation',
    'Wrist stretches'
  ]
}

export const sessionTypes = [
  { value: 'boulder', label: 'Bouldering', emoji: '🪨' },
  { value: 'lead', label: 'Lead Climbing', emoji: '🧗' },
  { value: 'hangboard', label: 'Hangboard', emoji: '🤏' },
  { value: 'supplementary', label: 'Supplementary', emoji: '💪' }
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
