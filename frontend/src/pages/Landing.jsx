import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, Globe, Lock, Network, Shield, Sparkles, Cpu, Zap } from 'lucide-react'
import { useApp } from '../context/AppContext'
import CyberShield3D from '../components/3d/CyberShield3D'
import StartupOverlay from '../components/StartupOverlay'

const CARDS = [
  [Sparkles, 'AI Risk Intelligence Engine', 'Six contextual signal families evaluated simultaneously with zero isolated transactions.'],
  [Brain, 'Explainable ML Classifier', 'Transparent RandomForest + IsolationForest scores shipped with severity & point contributions.'],
  [Network, '3D Entity Network Graph', 'Interactive 3D graph visualization exposing device sharing & connected account clusters.'],
  [Globe, 'Multilingual Telemetry UI', 'Native support for English, Tamil, Hindi, Telugu, Malayalam, and Kannada.'],
  [Lock, 'Production-Grade Security', 'JWT session control, PBKDF2 120k round hashing, masked account profiles, CORS headers.'],
  [Shield, 'Automated Action Matrix', 'ALLOW, VERIFY, RESTRICT or BLOCK recommendations with analyst investigation overrides.'],
]

export default function Landing() {
  const { t } = useApp()
  return (
    <div className="grid-bg min-h-screen bg-cyber-bg text-slate-100 overflow-hidden">
      <StartupOverlay />

      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 border-b border-cyan-500/20 bg-cyber-card/40 backdrop-blur-md">
        <div className="flex items-center gap-3 font-extrabold tracking-wider">
          <div className="p-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Shield className="h-6 w-6" />
          </div>
          <span className="text-lg text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
            COTNEXA
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-cyber text-xs">
            {t('login.signin')}
          </Link>
          <Link to="/app" className="btn-primary text-xs">
            LAUNCH COMMAND CENTER ⚡
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-bold text-cyan-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
            </span>
            COTNEXA // CYBER DEFENSE COMMAND PLATFORM
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-white"
          >
            Real-Time AI Financial Fraud Detection & Risk Intelligence
          </motion.h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
            Protect financial networks against escalating cyber fraud, account takeovers, velocity bursts, and device sharing anomalies with explainable 3D threat intelligence.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link to="/app" className="btn-primary py-3.5 px-6 text-sm font-extrabold">
              LAUNCH CYBER COMMAND PORTAL
            </Link>
            <Link to="/login" className="btn-cyber py-3.5 px-6 text-sm font-extrabold">
              INSTANT DEMO LOGIN
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 pt-6 border-t border-cyan-500/20">
            {[
              ['WHAT IS IT?', 'AI Financial Fraud Command Platform'],
              ['WHAT DOES IT ANALYZE?', 'Account + UPI + Device + Location + Velocity + Network'],
              ['WHAT DOES IT PRODUCE?', '0-100 Risk Score + 3D Graph + Action Recommendation'],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-cyan-500/20 bg-cyber-panel/60 p-4 space-y-1">
                <p className="text-[10px] font-extrabold tracking-widest text-cyan-400 uppercase">{k}</p>
                <p className="text-xs font-semibold text-slate-200">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 3D Shield Hero Widget */}
        <div className="lg:col-span-5 relative h-80 sm:h-96 w-full flex items-center justify-center">
          <CyberShield3D />
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="mx-auto max-w-7xl px-6 py-16 border-t border-cyan-500/20">
        <div className="mb-10 text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Cyber Defense Engine Capabilities</h2>
          <p className="text-xs text-slate-400">Comprehensive end-to-end financial threat intelligence architecture</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map(([Icon, title, body]) => (
            <div key={title} className="card-glow space-y-3 hover:scale-[1.02] transition-transform">
              <div className="p-2.5 w-fit rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-extrabold text-base text-white">{title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
