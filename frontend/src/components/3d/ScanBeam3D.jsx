import React from 'react'

export default function ScanBeam3D({ label = "AI SCANNING TRANSACTION..." }) {
  return (
    <div className="relative flex flex-col items-center justify-center p-8 rounded-3xl border border-cyan-500/40 bg-cyber-card/95 shadow-glow overflow-hidden min-h-[300px]">
      {/* Laser Scanning Grid */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-purple-600/10 scanline" />
      
      {/* Rotating Cyber Core */}
      <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-purple-500 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        <div className="absolute inset-4 rounded-full border border-blue-400 border-dashed animate-pulse" />
        <div className="w-12 h-12 rounded-full bg-cyan-400/20 shadow-glow flex items-center justify-center animate-ping" />
        <span className="text-xl">🛡️</span>
      </div>

      <p className="font-extrabold text-lg tracking-wider text-cyan-300 animate-pulse">{label}</p>
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 font-mono">
        <span>● Evaluating Contextual Signals</span>
        <span>● Running Random Forest ML</span>
        <span>● Checking Anomaly Matrix</span>
      </div>
    </div>
  )
}
