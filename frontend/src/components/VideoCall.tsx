import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { PoseOverlay } from './PoseOverlay'
import { useStreamClient } from '../hooks/useStreamClient'

interface Props {
  userId: string
  userName: string
}

export function VideoCall({ userId, userName }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [videoReady, setVideoReady] = useState(false)
  const { updatePoseData, setMetrics } = useStore()
  const { isLoading, error } = useStreamClient(userId, userName)

  const connectWebSocket = () => {
    try {
      const wsUrl = import.meta.env.VITE_API_URL.replace('http', 'ws') + '/ws/pose'
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          updatePoseData(data.score ?? 0, data.reps ?? 0, data.errors ?? [], data.keypoints ?? [])
          setMetrics(null, data.frameTime ?? null)
        } catch (e) {}
      }
      ws.onclose = () => setTimeout(connectWebSocket, 2000)
    } catch (e) {}
  }

  const startCamera = async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      streamRef.current = stream
      setSessionStarted(true)
      connectWebSocket()

      // Wait for the video element to be in the DOM
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().then(() => {
            setVideoReady(true)
          }).catch(console.error)
        }
      }, 100)

    } catch (err) {
      setCameraError('Camera access denied — please allow camera and try again.')
    }
  }

  // Also try attaching stream when video element mounts
  useEffect(() => {
    if (sessionStarted && videoRef.current && streamRef.current && !videoReady) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().then(() => setVideoReady(true)).catch(console.error)
    }
  }, [sessionStarted, videoReady])

  useEffect(() => {
    return () => {
      wsRef.current?.close()
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  if (!sessionStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-96 gap-6 p-8 bg-slate-900 rounded-2xl">
        <div className="text-6xl">🏋️</div>
        <h2 className="text-2xl font-bold text-white text-center">Ready to start?</h2>
        <p className="text-slate-400 text-center max-w-xs">
          Coach Alex will watch your form in real-time and give voice feedback
        </p>
        {cameraError && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-300 text-sm text-center">
            {cameraError}
          </div>
        )}
        {error && (
          <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-3 text-yellow-300 text-sm text-center">
            Backend: {error}
          </div>
        )}
        <button
          onClick={startCamera}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 px-10 rounded-2xl text-lg transition-all active:scale-95"
        >
          {isLoading ? 'Connecting...' : 'Start Session 🚀'}
        </button>
      </div>
    )
  }

  return (
    <div className="relative w-full bg-black rounded-2xl overflow-hidden" style={{ minHeight: '400px' }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          transform: 'scaleX(-1)',
          minHeight: '400px',
        }}
      />
      {videoReady && (
        <PoseOverlay
          videoWidth={videoRef.current?.videoWidth || 640}
          videoHeight={videoRef.current?.videoHeight || 480}
        />
      )}
      <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-white text-xs font-medium">LIVE</span>
      </div>
      {!videoReady && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <p>Starting camera...</p>
        </div>
      )}
    </div>
  )
}