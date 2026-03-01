import { create } from 'zustand'

interface StoreState {
  // PoseOverlay
  keypoints: [number, number][] | null
  poseScore: number

  // ScoreDisplay
  reps: number
  formErrors: string[]
  joinTime: number | null
  frameTime: number | null

  // ExerciseSelector
  selectedExercise: 'squat' | 'pushup' | 'lunge'
  exercise: string   // string version sent from agent

  // Connection
  isConnected: boolean

  // Actions
  setKeypoints: (kp: [number, number][]) => void
  setPoseScore: (score: number) => void
  setReps: (reps: number) => void
  setExercise: (exercise: string) => void
  setConnected: (v: boolean) => void
  setMetrics: (latency: number, err: string | null) => void
  resetSession: () => void
}

export const useStore = create<StoreState>((set) => ({
  keypoints:         null,
  poseScore:         0,
  reps:              0,
  formErrors:        [],
  joinTime:          null,
  frameTime:         null,
  selectedExercise:  'pushup',
  exercise:          '',
  isConnected:       false,

  setKeypoints:  (keypoints)   => set({ keypoints }),
  setPoseScore:  (poseScore)   => set({ poseScore }),
  setReps:       (reps)        => set({ reps }),
  setExercise:   (exercise)    => set({ exercise, selectedExercise: exercise as any }),
  setConnected:  (isConnected) => set({ isConnected }),
  setMetrics:    (joinTime, _) => set({ joinTime }),
  resetSession:  ()            => set({ reps: 0, poseScore: 0, keypoints: null, formErrors: [] }),
}))