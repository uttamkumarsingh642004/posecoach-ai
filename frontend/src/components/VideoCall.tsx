import { useEffect, useState } from 'react'
import {
  StreamVideo,
  StreamCall,
  useStreamVideoClient,
  ParticipantView,
  useCallStateHooks,
  CallingState,
} from '@stream-io/video-react-sdk'
import '@stream-io/video-react-sdk/dist/css/styles.css'
import { useStore } from '../store'

interface Props {
  client: any
  callId: string
}

function CallUI() {
  const { useParticipants, useCallCallingState } = useCallStateHooks()
  const participants = useParticipants()
  const callingState = useCallCallingState()
  const { poseScore, repCount } = useStore()

  if (callingState !== CallingState.JOINED) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        <p>Connecting to Coach Alex...</p>
      </div>
    )
  }

  // Find local participant (you)
  const localParticipant = participants.find(p => p.isLocalParticipant)

  return (
    <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden" style={{ minHeight: '400px' }}>
      {localParticipant && (
        <ParticipantView
          participant={localParticipant}
          className="w-full h-full"
        />
      )}

      {/* Score overlay */}
      <div className="absolute top-3 right-3 bg-black/70 rounded-xl px-4 py-2 text-center">
        <div className={`text-3xl font-bold ${poseScore >= 85 ? 'text-green-400' : poseScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
          {poseScore}
        </div>
        <div className="text-white text-xs">FORM</div>
      </div>

      <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-white text-xs font-medium">LIVE · {repCount} reps</span>
      </div>
    </div>
  )
}

export function VideoCall({ client, callId }: Props) {
  const [call, setCall] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!client || !callId) return

    const c = client.call('default', callId)
    c.join({ create: true })
      .then(() => {
        setCall(c)
        // Enable camera and mic
        c.camera.enable()
        c.microphone.enable()
      })
      .catch((err: any) => {
        setError(err.message)
        console.error('Call join error:', err)
      })

    return () => {
      c.leave().catch(console.error)
    }
  }, [client, callId])

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900 rounded-2xl p-8">
        <div className="text-red-400 text-center">
          <p className="text-lg font-bold mb-2">Connection Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!call) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900 rounded-2xl" style={{ minHeight: '400px' }}>
        <div className="text-center text-white">
          <div className="text-4xl mb-4 animate-pulse">🏋️</div>
          <p>Joining session...</p>
        </div>
      </div>
    )
  }

  return (
    <StreamCall call={call}>
      <CallUI />
    </StreamCall>
  )
}