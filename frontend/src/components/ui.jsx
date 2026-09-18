import { motion } from 'framer-motion'
import { AlertTriangle, Inbox } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export const RISK_STYLES = {
  LOW: 'bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/30',
  MEDIUM: 'bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/30',
  HIGH: 'bg-orange-500/15 text-orange-500 ring-1 ring-orange-500/30',
  CRITICAL: 'bg-rose-500/15 text-rose-500 ring-1 ring-rose-500/30',
}
export const RISK_HEX = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#f97316', CRITICAL: '#f43f5e' }

export const inr = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

export const RiskBadge = ({ level }) => (
  <span className={`chip ${RISK_STYLES[level] || RISK_STYLES.LOW}`}>{level}</span>
)

export function Counter({ value = 0, prefix = '', duration = 900 }) {
  const [shown, setShown] = useState(0)
  const ref = useRef(0)
  useEffect(() => {
    const from = ref.current, start = performance.now()
    let raf
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1)
      setShown(from + (value - from) * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
      else ref.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  return <>{prefix}{Math.round(shown).toLocaleString('en-IN')}</>
}

export const Kpi = ({ icon: Icon, label, value, prefix, hint }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card">
    <div className="flex items-start justify-between">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      {Icon && <Icon className="h-4 w-4 text-emerald-500" />}
    </div>
    <p className="mt-3 text-2xl font-extrabold tracking-tight md:text-3xl">
      <Counter value={value} prefix={prefix} />
    </p>
    {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
  </motion.div>
)

export const Loader = ({ label = 'Loading...' }) => (
  <div className="flex items-center gap-3 text-sm text-slate-500">
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
    {label}
  </div>
)

export const Skeleton = ({ rows = 4 }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => <div key={i} className="skeleton h-10 w-full" />)}
  </div>
)

export const Empty = ({ title = 'Nothing here yet', hint }) => (
  <div className="flex flex-col items-center gap-2 py-10 text-center text-slate-500">
    <Inbox className="h-8 w-8 opacity-60" />
    <p className="font-semibold">{title}</p>
    {hint && <p className="max-w-sm text-sm opacity-80">{hint}</p>}
  </div>
)

export const ErrorBox = ({ message }) => (
  <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-500">
    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{message}</span>
  </div>
)

export const DemoNotice = ({ text }) => (
  <p className="text-[11px] uppercase tracking-wider text-slate-500">{text}</p>
)

/** Animated circular risk meter (0-100). */
export function RiskMeter({ score = 0, level = 'LOW', size = 190 }) {
  const r = size / 2 - 14
  const c = 2 * Math.PI * r
  const color = RISK_HEX[level] || RISK_HEX.LOW
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth="12" fill="none"
          className="stroke-slate-200 dark:stroke-white/10" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} strokeWidth="12" fill="none" stroke={color} strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${(score / 100) * c} ${c}` }}
          transition={{ duration: 1.1, ease: 'easeOut' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold tabular-nums" style={{ color }}>
          <Counter value={score} />
        </span>
        <span className="text-xs text-slate-500">/ 100</span>
        <span className={`chip mt-2 ${RISK_STYLES[level]}`}>{level}</span>
      </div>
    </div>
  )
}
