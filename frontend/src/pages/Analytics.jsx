import { useEffect, useState } from 'react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts'
import { api } from '../api/client'
import { useApp } from '../context/AppContext'
import { DemoNotice, ErrorBox, RISK_HEX, Skeleton, inr } from '../components/ui'
import { Activity, BarChart3, TrendingUp, PieChart as PieIcon } from 'lucide-react'

const CYBER_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#00f0ff',
  VIOLET: '#8b5cf6',
}

const Panel = ({ title, icon: Icon, children }) => (
  <div className="card space-y-3">
    <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
      <h3 className="font-extrabold text-sm text-cyan-400 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" />} {title}
      </h3>
    </div>
    <div style={{ height: 250 }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  </div>
)

export default function Analytics() {
  const { t } = useApp()
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    api.analytics().then(setD).catch((e) => setErr(e.message))
  }, [])

  if (err) return <ErrorBox message={err} />
  if (!d) return <Skeleton rows={8} />

  const totals = d.by_type.reduce((a, r) => a + r.total, 0)
  const fraud = d.by_type.reduce((a, r) => a + r.fraud, 0)
  const pie = [{ name: 'Flagged Fraud', value: fraud }, { name: 'Legitimate', value: totals - fraud }]
  const dist = d.risk_distribution.map((r) => ({ name: r.k, value: r.total }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-cyan-400" />
            {t('analytics.title')}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('analytics.sub')}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Fraud vs Legitimate Ratio" icon={PieIcon}>
          <PieChart>
            <Pie data={pie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={4}>
              <Cell fill={CYBER_COLORS.CRITICAL} />
              <Cell fill={CYBER_COLORS.LOW} />
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#0d1527', borderColor: '#00f0ff', color: '#fff', borderRadius: '12px' }} />
            <Legend />
          </PieChart>
        </Panel>

        <Panel title="Risk Score Spectrum Distribution" icon={Activity}>
          <PieChart>
            <Pie data={dist} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={4}>
              {dist.map((e) => <Cell key={e.name} fill={CYBER_COLORS[e.name] || '#64748b'} />)}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#0d1527', borderColor: '#00f0ff', color: '#fff', borderRadius: '12px' }} />
            <Legend />
          </PieChart>
        </Panel>

        <Panel title="Flagged Fraud Incidents by Location" icon={BarChart3}>
          <BarChart data={d.by_location}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis dataKey="k" stroke="#94a3b8" fontSize={11} />
            <YAxis stroke="#94a3b8" fontSize={11} />
            <Tooltip contentStyle={{ backgroundColor: '#0d1527', borderColor: '#00f0ff', color: '#fff', borderRadius: '12px' }} />
            <Bar dataKey="fraud" fill={CYBER_COLORS.HIGH} radius={[6, 6, 0, 0]} />
          </BarChart>
        </Panel>

        <Panel title="Fraud Volume by Payment Channel" icon={BarChart3}>
          <BarChart data={d.by_type}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis dataKey="k" stroke="#94a3b8" fontSize={11} />
            <YAxis stroke="#94a3b8" fontSize={11} />
            <Tooltip contentStyle={{ backgroundColor: '#0d1527', borderColor: '#00f0ff', color: '#fff', borderRadius: '12px' }} />
            <Bar dataKey="fraud" fill={CYBER_COLORS.VIOLET} radius={[6, 6, 0, 0]} />
          </BarChart>
        </Panel>

        <Panel title="Daily Fraud Incident Trend" icon={TrendingUp}>
          <LineChart data={d.trend}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis dataKey="k" stroke="#94a3b8" fontSize={10} />
            <YAxis stroke="#94a3b8" fontSize={11} />
            <Tooltip contentStyle={{ backgroundColor: '#0d1527', borderColor: '#00f0ff', color: '#fff', borderRadius: '12px' }} />
            <Line type="monotone" dataKey="fraud" stroke={CYBER_COLORS.CRITICAL} strokeWidth={2.5} dot={{ r: 4, fill: '#ef4444' }} />
          </LineChart>
        </Panel>

        <Panel title="Total Transaction Volume Stream" icon={TrendingUp}>
          <AreaChart data={d.trend}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis dataKey="k" stroke="#94a3b8" fontSize={10} />
            <YAxis stroke="#94a3b8" fontSize={11} />
            <Tooltip contentStyle={{ backgroundColor: '#0d1527', borderColor: '#00f0ff', color: '#fff', borderRadius: '12px' }} />
            <Area type="monotone" dataKey="total" stroke={CYBER_COLORS.LOW} fill={CYBER_COLORS.LOW} fillOpacity={0.2} />
          </AreaChart>
        </Panel>
      </div>

      <div className="card space-y-3">
        <p className="font-extrabold text-sm text-cyan-400 uppercase tracking-wider">Simulated Regional Threat Breakdown</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {d.by_location.map((l) => (
            <div key={l.k} className="rounded-2xl border border-cyan-500/20 bg-cyber-panel/60 p-4 space-y-1">
              <p className="font-extrabold text-white text-base">{l.k}</p>
              <p className="text-xs text-slate-400">{l.total} transactions · <span className="text-red-400 font-bold">{l.fraud} flagged</span></p>
              <p className="text-sm font-extrabold text-cyan-300 pt-1">{inr(l.amount)}</p>
              <div className="mt-2 h-1.5 rounded bg-navy-950 overflow-hidden">
                <div className="h-1.5 rounded bg-red-500" style={{ width: `${Math.min(100, (l.fraud / Math.max(l.total, 1)) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
