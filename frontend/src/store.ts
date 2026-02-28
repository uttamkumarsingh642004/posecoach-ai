import { create } from 'zustand'

interface StoreState {
  selectedExercise: 'squat' | 'pushup' | 'lunge'
  poseScore: number
  repCount: number
  formErrors: string[]
  keypoints: number[][] | null
  isConnected: boolean
  joinTime: number | null
  frameTime: number | null

  setExercise: (exercise: 'squat' | 'pushup' | 'lunge') => void
  updatePoseData: (score: number, reps: number, errors: string[], keypoints: number[][]) => void
  setConnected: (val: boolean) => void
  setMetrics: (joinTime: number | null, frameTime: number | null) => void
  resetSession: () => void
}

export const useStore = create<StoreState>((set) => ({
  selectedExercise: 'squat',
  poseScore: 0,
  repCount: 0,
  formErrors: [],
  keypoints: null,
  isConnected: false,
  joinTime: null,
  frameTime: null,

  setExercise: (exercise) => set({ selectedExercise: exercise }),
  updatePoseData: (score, reps, errors, keypoints) =>
    set({ poseScore: score, repCount: reps, formErrors: errors, keypoints }),
  setConnected: (val) => set({ isConnected: val }),
  setMetrics: (joinTime, frameTime) =>
    set((s) => ({
      joinTime: joinTime ?? s.joinTime,
      frameTime: frameTime ?? s.frameTime,
    })),
  resetSession: () =>
    set({ poseScore: 0, repCount: 0, formErrors: [], keypoints: null }),
}))