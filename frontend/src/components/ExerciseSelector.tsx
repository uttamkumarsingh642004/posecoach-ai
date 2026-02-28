import { useStore } from '../store'

const exercises = [
  { id: 'squat' as const, emoji: '🏋️', name: 'Squat', desc: 'Tracks knee angle & back posture' },
  { id: 'pushup' as const, emoji: '💪', name: 'Push-up', desc: 'Tracks elbow angle & body alignment' },
  { id: 'lunge' as const, emoji: '🦵', name: 'Lunge', desc: 'Tracks front knee & torso position' },
]

export function ExerciseSelector() {
  const { selectedExercise, setExercise, resetSession } = useStore()

  const handleSelect = async (id: 'squat' | 'pushup' | 'lunge') => {
    setExercise(id)
    resetSession()
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/exercise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exercise: id }),
      })
    } catch (e) {
      console.log('Could not update exercise on backend yet')
    }
  }

  return (
    <div className="flex flex-col gap-3 w-full max-w-sm">
      <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Select Exercise</p>
      {exercises.map((ex) => (
        <button
          key={ex.id}
          onClick={() => handleSelect(ex.id)}
          className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
            ${selectedExercise === ex.id
              ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30'
              : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
            }`}
        >
          <span className="text-3xl">{ex.emoji}</span>
          <div>
            <div className="font-semibold text-white">{ex.name}</div>
            <div className="text-slate-400 text-sm">{ex.desc}</div>
          </div>
        </button>
      ))}
    </div>
  )
}