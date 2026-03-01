import { create } from 'zustand'

interface StoreState {
  // Used by PoseOverlay.tsx — pixel coords [x, y][]
  keypoints: [number, number][] | null
  poseScore: number

  // HUD overlays
  reps: number
  exercise: string
  isConnected: boolean

  // Actions
  setKeypoints: (kp: [number, number][]) => void
  setPoseScore: (score: number) => void
  setReps: (reps: number) => void
  setExercise: (exercise: string) => void
  setConnected: (v: boolean) => void
  setMetrics: (latency: number, err: string | null) => void
}

export const useStore = create<StoreState>((set) => ({
  keypoints:   null,
  poseScore:   0,
  reps:        0,
  exercise:    '',
  isConnected: false,

  setKeypoints:  (keypoints)    => set({ keypoints }),
  setPoseScore:  (poseScore)    => set({ poseScore }),
  setReps:       (reps)         => set({ reps }),
  setExercise:   (exercise)     => set({ exercise }),
  setConnected:  (isConnected)  => set({ isConnected }),
  setMetrics:    (_l, _e)       => {},
}))