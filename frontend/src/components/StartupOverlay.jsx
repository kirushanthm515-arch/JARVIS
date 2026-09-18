import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield } from 'lucide-react'

export default function StartupOverlay({ onComplete }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      if (onComplete) onComplete()
    }, 1900)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-cyber-dark text-slate-100 scanline"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-center px-4"
          >
            <div className="relative mb-6">
              <div className="absolute -inset-4 rounded-full bg-cyan-500/20 blur-xl animate-pulse" />
              <Shield className="h-16 w-16 text-cyan-400 drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]" />
            </div>

            <h1 className="text-3xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500">
              COTNEXA
            </h1>
            <p className="mt-2 text-xs font-bold tracking-widest uppercase text-cyan-400/80">
              REAL-TIME FINANCIAL RISK INTELLIGENCE PLATFORM
            </p>

            <div className="mt-8 flex items-center gap-3">
              <div className="h-1.5 w-36 overflow-hidden rounded-full bg-navy-800 border border-cyan-500/30">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 animate-scanner" />
              </div>
            </div>

            <p className="mt-3 text-xs font-mono text-slate-400 animate-pulse">
              SYSTEM INITIALIZING...
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
