import { useEffect, useState, useRef } from 'react'
import {
  StreamCall,
  useCallStateHooks,
  CallingState,
} from '@stream-io/video-react-sdk'
import '@stream-io/video-react-sdk/dist/css/styles.css'
import { PoseOverlay } from './PoseOverlay'
import { useStore } from '../store'

interface Props {
  client: any
  callId: string
}

function CallUI({ client, callId }: { client: any; callId: string }) {
  const { useParticipants, useCallCallingState } = useCallStateHooks()
  const participants  = useParticipants()
  const callingState  = useCallCallingState()

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const audioRefs     = useRef<{ [key: string]: HTMLAudioElement }>({})

  const [videoDims, setVideoDims]         = useState({ w: 640, h: 480 })
  const [coachSpeaking, setCoachSpeaking] = useState(false)

  const { setKeypoints, setPoseScore, setReps, setExercise,
          poseScore, reps, exercise, keypoints } = useStore()

  const localParticipant = participants.find(p => p.isLocalParticipant)
  const coachParticipant = participants.find(p => !p.isLocalParticipant)

  // Attach local camera stream to video element
  useEffect(() => {
    if (!localParticipant?.videoStream || !localVideoRef.current) return
    localVideoRef.current.srcObject = localParticipant.videoStream
    localVideoRef.current.play().catch(console.error)
  }, [localParticipant?.videoStream])

  // Track video pixel dimensions so PoseOverlay canvas scales correctly
  useEffect(() => {
    const el = localVideoRef.current
    if (!el) return
    const update = () => {
      if (el.videoWidth) setVideoDims({ w: el.videoWidth, h: el.videoHeight })
    }
    el.addEventListener('loadedmetadata', update)
    el.addEventListener('resize', update)
    return () => {
      el.removeEventListener('loadedmetadata', update)
      el.removeEventListener('resize', update)
    }
  }, [])

  // Play coach audio + detect when they are speaking
  useEffect(() => {
    participants.forEach(p => {
      if (p.isLocalParticipant || !p.audioStream) return
      const key = p.sessionId
      if (audioRefs.current[key]) return

      const audio = new Audio()
      audio.srcObject = p.audioStream
      audio.autoplay = true

      try {
        const actx     = new AudioContext()
        const src      = actx.createMediaStreamSource(p.audioStream)
        const analyser = actx.createAnalyser()
        analyser.fftSize = 256
        src.connect(analyser)
        const buf = new Uint8Array(analyser.frequencyBinCount)
        const tick = () => {
          analyser.getByteFrequencyData(buf)
          setCoachSpeaking(buf.reduce((a, b) => a + b, 0) / buf.length > 10)
          requestAnimationFrame(tick)
        }
        tick()
      } catch (_) {}

      audio.play().catch(() => {
        const retry = () => {
          audio.play().catch(console.error)
          document.removeEventListener('click', retry)
          document.removeEventListener('touchstart', retry)
        }
        document.addEventListener('click', retry)
        document.addEventListener('touchstart', retry)
      })
      audioRefs.current[key] = audio
    })
  }, [participants])

  // Receive keypoints + score + reps + exercise from agent via Stream Chat
  useEffect(() => {
    if (!client || !callId) return
    let ch: any = null

    const setup = async () => {
      try {
        ch = client.channel('messaging', 'posecoach-session')
        await ch.watch()
        ch.on('message.new', (event: any) => {
          const m = event.message
          if (!m) return
          if (m.keypoints) {
            const px: [number, number][] = m.keypoints.map(
              ([x, y]: [number, number]) => [x * videoDims.w, y * videoDims.h]
            )
            setKeypoints(px)
          }
          if (m.score    !== undefined) setPoseScore(Math.round(m.score))
          if (m.reps     !== undefined) setReps(m.reps)
          if (m.exercise)               setExercise(m.exercise)
        })
      } catch (_) {}
    }

    setup()
    return () => { ch?.stopWatching().catch(console.error) }
  }, [client, callId, videoDims])

  if (callingState !== CallingState.JOINED) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <div className="text-5xl animate-bounce">🏋️</div>
          <p className="text-slate-400 text-sm animate-pulse">Connecting to Coach Alex...</p>
        </div>
      </div>
    )
  }

  const scoreColor =
    poseScore >= 80 ? '#4ade80' :
    poseScore >= 55 ? '#facc15' : '#f87171'

  const formLabel =
    poseScore >= 80 ? 'GREAT!'  :
    poseScore >= 55 ? 'ADJUST'  : 'FIX FORM'

  return (
    <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden" style={{ minHeight: 480 }}>

      {/* YOUR CAMERA — mirrored selfie */}
      <video
        ref={localVideoRef}
        autoPlay playsInline muted
        className="w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* YOLO SKELETON — canvas overlay drawn by PoseOverlay */}
      {keypoints && keypoints.length >= 17 && (
        <div className="absolute inset-0" style={{ transform: 'scaleX(-1)' }}>
          <PoseOverlay videoWidth={videoDims.w} videoHeight={videoDims.h} />
        </div>
      )}

      {/* FORM SCORE — top right */}
      <div
        className="absolute top-3 right-3 rounded-2xl px-4 py-2 text-center min-w-[76px]"
        style={{
          background: 'rgba(0,0,0,0.82)',
          border: `2px solid ${scoreColor}`,
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="text-3xl font-black" style={{ color: scoreColor }}>
          {poseScore > 0 ? poseScore : '--'}
        </div>
        <div className="text-white text-[10px] font-bold tracking-widest">FORM</div>
        <div className="text-[11px] font-bold" style={{ color: scoreColor }}>
          {poseScore > 0 ? formLabel : '—'}
        </div>
      </div>

      {/* LIVE + REPS — top left */}
      <div
        className="absolute top-3 left-3 flex items-center gap-2 rounded-full px-3 py-1.5"
        style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)' }}
      >
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-white text-xs font-bold">
          LIVE · <span className="text-green-400">{reps}</span> {reps === 1 ? 'rep' : 'reps'}
        </span>
      </div>

      {/* Exercise pill — top center */}
      {exercise && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}
        >
          <span className="text-yellow-300 text-xs font-black uppercase tracking-[0.2em]">
            {exercise}
          </span>
        </div>
      )}

      {/* Bottom status bar */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}
      >
        <div className="flex items-center gap-2">
          {coachParticipant ? (
            <>
              <div className={`w-2 h-2 rounded-full ${coachSpeaking ? 'bg-green-400 animate-ping' : 'bg-green-700'}`} />
              <span className="text-xs font-semibold" style={{ color: coachSpeaking ? '#4ade80' : '#86efac' }}>
                {coachSpeaking ? '🤖 Coach Alex speaking...' : '🤖 Coach Alex watching'}
              </span>
            </>
          ) : (
            <span className="text-slate-400 text-xs animate-pulse">⏳ Waiting for Coach Alex...</span>
          )}
        </div>
        <span className="text-slate-400 text-xs">🎤 Speak to coach</span>
      </div>
    </div>
  )
}

export function VideoCall({ client, callId }: Props) {
  const [call, setCall]   = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!client || !callId) return
    const c = client.call('default', callId)

    // Force H264 — fixes VP8 errors on Python agent + works natively on mobile
    c.join({
      create: true,
      data: { settings_override: { video: { codec: 'h264' } } }
    })
      .then(() => {
        setCall(c)
        c.camera.enable()
        c.microphone.enable()
      })
      .catch((err: any) => setError(err.message))

    return () => { c.leave().catch(console.error) }
  }, [client, callId])

  if (error) return (
    <div className="flex items-center justify-center h-full bg-slate-900 rounded-2xl p-8">
      <div className="text-red-400 text-center">
        <p className="font-bold mb-1">Connection Error</p>
        <p className="text-sm opacity-75">{error}</p>
      </div>
    </div>
  )

  if (!call) return (
    <div className="flex items-center justify-center h-full bg-slate-900 rounded-2xl" style={{ minHeight: 400 }}>
      <div className="text-center">
        <div className="text-4xl mb-3 animate-pulse">🏋️</div>
        <p className="text-slate-400 text-sm">Joining session...</p>
      </div>
    </div>
  )

  return (
    <StreamCall call={call}>
      <CallUI client={client} callId={callId} />
    </StreamCall>
  )
}