import { useStore } from '../store'
import { motion, AnimatePresence } from 'framer-motion'

export function ScoreDisplay() {
  const { poseScore, reps, formErrors, joinTime, frameTime } = useStore()

  const scoreColor =
    poseScore >= 85 ? 'text-green-400' :
    poseScore >= 60 ? 'text-yellow-400' : 'text-red-400'

  const scoreBg =
    poseScore >= 85 ? 'border-green-500 bg-green-500/10' :
    poseScore >= 60 ? 'border-yellow-500 bg-yellow-500/10' : 'border-red-500 bg-red-500/10'

  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-900 rounded-2xl w-full">

      {/* Score Circle */}
      <div className="flex flex-col items-center gap-1">
        <p className="text-slate-400 text-xs uppercase tracking-wider">Form Score</p>
        <motion.div
          className={`w-28 h-28 rounded-full border-4 flex items-center justify-center ${scoreBg}`}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.3 }}
          key={poseScore}
        >
          <span className={`text-4xl font-bold ${scoreColor}`}>{poseScore}</span>
        </motion.div>
      </div>

      {/* Rep Counter */}
      <div className="flex flex-col items-center gap-1">
        <p className="text-slate-400 text-xs uppercase tracking-wider">Reps</p>
        <AnimatePresence mode="wait">
          <motion.div
            key={reps}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-5xl font-bold text-white"
          >
            {reps}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Form Errors */}
      {formErrors.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-slate-400 text-xs uppercase tracking-wider">Corrections</p>
          {formErrors.slice(0, 3).map((err: string, i: number) => (
            <div key={i} className="bg-red-500/20 border border-red-500/40 rounded-lg px-3 py-2 text-red-300 text-sm">
              {err}
            </div>
          ))}
        </div>
      )}

      {/* Metrics HUD */}
      <div className="mt-auto bg-black/40 rounded-lg p-3 font-mono text-xs text-green-400 space-y-1">
        <div className="flex justify-between">
          <span>Join latency</span>
          <span>{joinTime ? `${joinTime}ms` : '--'}</span>
        </div>
        <div className="flex justify-between">
          <span>Frame time</span>
          <span>{frameTime ? `${frameTime}ms` : '--'}</span>
        </div>
      </div>
    </div>
  )
}