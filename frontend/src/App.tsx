import { useState } from 'react'
import { StreamVideo } from '@stream-io/video-react-sdk'
import '@stream-io/video-react-sdk/dist/css/styles.css'
import { VideoCall } from './components/VideoCall'
import { ScoreDisplay } from './components/ScoreDisplay'
import { ExerciseSelector } from './components/ExerciseSelector'
import { useStore } from './store'
import { useStreamClient } from './hooks/useStreamClient'

const USER_ID = 'user-' + Math.random().toString(36).slice(2, 9)

export default function App() {
  const [started, setStarted] = useState(false)
  const { isConnected } = useStore()
  const { client, callId, isLoading, error } = useStreamClient(USER_ID, 'Athlete')

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏋️</span>
          <h1 className="text-xl font-bold text-blue-400">PoseCoach AI</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
          <span className="text-xs text-slate-400">{isConnected ? 'Connected' : isLoading ? 'Connecting...' : 'Offline'}</span>
        </div>
      </header>

      {!started ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 p-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-2">Your AI Fitness Coach</h2>
            <p className="text-slate-400">Real-time form correction powered by Vision AI + Gemini Live</p>
          </div>
          <ExerciseSelector />
          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-300 text-sm">
              {error}
            </div>
          )}
          <button
            onClick={() => setStarted(true)}
            disabled={!client || isLoading}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 px-12 rounded-2xl text-lg transition-all active:scale-95"
          >
            {isLoading ? 'Connecting...' : 'Start Session 🚀'}
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row gap-4 p-4">
          <div className="flex-1 min-h-96">
            {client && callId ? (
              <StreamVideo client={client}>
                <VideoCall client={client} callId={callId} />
              </StreamVideo>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                Connecting...
              </div>
            )}
          </div>
          <div className="w-full md:w-72 flex flex-col gap-4">
            <ScoreDisplay />
            <ExerciseSelector />
          </div>
        </div>
      )}

      <footer className="text-center py-3 text-slate-600 text-xs border-t border-slate-800">
        Powered by Vision Agents SDK by Stream
      </footer>
    </div>
  )
}