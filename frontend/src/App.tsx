import { useState } from 'react'
import { VideoCall } from './components/VideoCall'
import { ScoreDisplay } from './components/ScoreDisplay'
import { ExerciseSelector } from './components/ExerciseSelector'
import { useStore } from './store'

function App() {
  const [started, setStarted] = useState(false)
  const { isConnected } = useStore()

  // Generate stable userId once
  const [userId] = useState(() => 'user-' + Math.random().toString(36).slice(2, 9))
  const userName = 'Athlete'

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏋️</span>
          <h1 className="text-xl font-bold text-blue-400">PoseCoach AI</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
          <span className="text-xs text-slate-400">{isConnected ? 'Connected' : 'Offline'}</span>
        </div>
      </header>

      {/* Main */}
      {!started ? (
        /* Hero / Setup Screen */
        <div className="flex-1 flex flex-col items-center justify-center gap-8 p-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-2">Your AI Fitness Coach</h2>
            <p className="text-slate-400">Real-time form correction powered by Vision AI</p>
          </div>

          <ExerciseSelector />

          <button
            onClick={() => setStarted(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-12 rounded-2xl text-lg transition-all active:scale-95 shadow-lg shadow-blue-500/25"
          >
            Start Session 🚀
          </button>
        </div>
      ) : (
        /* Active Session */
        <div className="flex-1 flex flex-col md:flex-row gap-4 p-4">
          {/* Video — left / top */}
          <div className="flex-1 min-h-64 md:min-h-0">
            <VideoCall userId={userId} userName={userName} />
          </div>

          {/* Score panel — right / bottom */}
          <div className="w-full md:w-72 flex flex-col gap-4">
            <ScoreDisplay />
            <ExerciseSelector />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-3 text-slate-600 text-xs border-t border-slate-800">
        Powered by Vision Agents SDK by Stream
      </footer>
    </div>
  )
}

export default App