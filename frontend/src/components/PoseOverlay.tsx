import { useEffect, useRef } from 'react'
import { useStore } from '../store'

const SKELETON_CONNECTIONS = [
  [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
  [5, 11], [6, 12], [11, 12],
  [11, 13], [13, 15], [12, 14], [14, 16],
]

interface Props {
  videoWidth: number
  videoHeight: number
}

export function PoseOverlay({ videoWidth, videoHeight }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { keypoints, poseScore } = useStore()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !keypoints || keypoints.length < 17) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = videoWidth
    canvas.height = videoHeight
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const lineColor =
      poseScore >= 85 ? '#22c55e' :
      poseScore >= 60 ? '#eab308' : '#ef4444'

    // Draw skeleton lines
    ctx.strokeStyle = lineColor
    ctx.lineWidth = 3
    ctx.lineCap = 'round'

    for (const [a, b] of SKELETON_CONNECTIONS) {
      if (!keypoints[a] || !keypoints[b]) continue
      const [x1, y1] = keypoints[a]
      const [x2, y2] = keypoints[b]
      if (x1 === 0 && y1 === 0) continue
      if (x2 === 0 && y2 === 0) continue
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }

    // Draw joint circles
    ctx.fillStyle = '#3b82f6'
    for (const kp of keypoints) {
      if (!kp || (kp[0] === 0 && kp[1] === 0)) continue
      ctx.beginPath()
      ctx.arc(kp[0], kp[1], 5, 0, 2 * Math.PI)
      ctx.fill()
    }
  }, [keypoints, poseScore, videoWidth, videoHeight])

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
    />
  )
}