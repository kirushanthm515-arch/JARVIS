import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity, Ban, IndianRupee, PlayCircle, ShieldAlert, TrendingUp, Zap, Radio, Eye } from 'lucide-react'
import { api } from '../api/client'
import { useApp } from '../context/AppContext'
import { DemoNotice, Empty, ErrorBox, Kpi, RiskBadge, Skeleton, inr } from '../components/ui'
import ThreatGlobe3D from '../components/3d/ThreatGlobe3D'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { t } = useApp()
  const nav = useNavigate()
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState('')
  const [sim, setSim] = useState([])
  const [selectedTx, setSelectedTx] = useState(null)

  const load = useCallback(async () => {
    try {
      const d = await api.dashboard()
      setData(d)
      setErr('')
    } catch (e) {
      setErr(e.message)
    }
  }, [])

  // Auto-polling every 3 seconds for live transaction monitor
  useEffect(() => {
    load()
    const id = setInterval(load, 3000)
    return () => clearInterval(id)
  }, [load])

  const simulateOne = async () => {
    setBusy('one')
    try {
      await api.generate('normal')
      await load()
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy('')
    }
  }

  const runAttack = async () => {
    setBusy('attack')
    setSim([])
    try {
      const res = await api.simulateAttack()
      for (const [i, step] of res.steps.entries()) {
        await new Promise((r) => setTimeout(r, 650))
        setSim((s) => [...s, step])
        if (i === res.steps.length - 1) await load()
      }
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy('')
    }
  }

  if (err) return <ErrorBox message={err} />
  if (!data) return <div className="space-y-4"><Skeleton rows={3} /><Skeleton rows={6} /></div>

  const k = data.kpis
  return (
    <div className="space-y-6">
      {/* Hero Command Area with 3D Globe */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 flex flex-col justify-between card-glow bg-gradient-to-br from-cyber-card/90 to-cyber-panel/80">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/20 pb-3">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  FRAUDSHIELD AI
                </h1>
                <p className="text-xs text-cyan-400 font-mono mt-0.5">Financial Threat Intelligence Command Center</p>
              </div>
              <span className="chip bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                LIVE TELEMETRY ACTIVE
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-bold text-cyan-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
                </span>
                ● AI Engine: ONLINE
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs font-bold text-blue-300">
                <Radio className="h-3 w-3" />
                ● Transaction Monitor: ACTIVE
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs font-bold text-purple-300">
                ● Database: CONNECTED
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-cyan-500/20 flex flex-wrap gap-3">
            <button className="btn-primary" onClick={() => nav('/app/analyze')}>
              ⚡ RUN AI FRAUD SCAN
            </button>
            <button className="btn-cyber" onClick={simulateOne} disabled={!!busy}>
              <Zap className="h-4 w-4" /> {busy === 'one' ? '...' : 'GENERATE SAMPLE TXN'}
            </button>
            <button className="btn-ghost" onClick={runAttack} disabled={!!busy}>
              <PlayCircle className="h-4 w-4" /> {busy === 'attack' ? 'Running Attack...' : 'SIMULATE FRAUD ATTACK'}
            </button>
          </div>
        </div>

        {/* 3D Threat Globe Widget */}
        <div className="lg:col-span-5 card overflow-hidden flex flex-col items-center justify-center p-2 relative bg-cyber-card/90">
          <p className="absolute top-3 left-4 text-xs font-extrabold uppercase tracking-wider text-cyan-400 z-10">
            3D Global Network Intelligence
          </p>
          <ThreatGlobe3D />
        </div>
      </div>

      {/* Real-Time KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Kpi icon={Activity} label={t('dashboard.totalTransactions')} value={k.total_transactions} />
        <Kpi icon={TrendingUp} label={t('dashboard.analyzed')} value={k.analyzed} />
        <Kpi icon={ShieldAlert} label={t('dashboard.fraudDetected')} value={k.fraud_detected} />
        <Kpi icon={ShieldAlert} label={t('dashboard.highRisk')} value={k.high_risk} />
        <Kpi icon={Ban} label={t('dashboard.blocked')} value={k.blocked} />
        <Kpi icon={IndianRupee} label={t('dashboard.amountProtected')} value={k.amount_protected} prefix="₹" />
      </div>

      {/* Simulated Attack Feed */}
      {sim.length > 0 && (
        <div className="card border-red-500/40 bg-red-500/5 space-y-3">
          <p className="font-extrabold text-sm text-red-400 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" /> Live Fraud Attack Simulation (Scripted Feed)
          </p>
          <div className="grid gap-2 md:grid-cols-5">
            {sim.map((s, i) => (
              <motion.div key={s.txn_id} initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border border-red-500/30 bg-cyber-panel/90 p-3 text-xs space-y-1">
                <p className="text-[10px] font-bold text-slate-400">Step {i + 1} · {s.step_note}</p>
                <p className="font-extrabold text-white text-sm">{inr(s.amount)}</p>
                <p className="text-[11px] text-slate-300 font-mono">{s.location} · {s.device_id}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-base font-extrabold text-cyan-300">{s.risk_score}</span>
                  <RiskBadge level={s.risk_level} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Live Transaction Monitor */}
      <div className="card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/20 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              {t('dashboard.liveMonitor')}
            </h2>
            <p className="text-xs text-slate-400">Real-time incoming transaction evaluation stream (Polling every 3s)</p>
          </div>
          <span className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
            </span>
            STREAM ACTIVE
          </span>
        </div>

        {data.recent.length === 0 ? <Empty title={t('common.noData')} /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-cyan-400 border-b border-cyan-500/20">
                <tr>
                  {[
                    'table.txnId', 'table.account', 'table.upiId', 'table.amount', 'table.location',
                    'table.device', 'table.riskScore', 'table.status', 'table.action', 'table.inspect'
                  ].map((k) => <th key={k} className="px-3 py-2.5 font-extrabold">{t(k)}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence initial={false}>
                  {data.recent.map((r) => (
                    <motion.tr key={r.txn_id} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      className="hover:bg-cyan-500/5 transition-colors cursor-pointer" onClick={() => setSelectedTx(r)}>
                      <td className="px-3 py-3 font-mono font-bold text-cyan-300">{r.txn_id}</td>
                      <td className="px-3 py-3 font-mono text-slate-300">{r.masked_account}</td>
                      <td className="px-3 py-3 font-mono text-slate-300">{r.upi_id}</td>
                      <td className="px-3 py-3 font-bold text-white">{inr(r.amount)}</td>
                      <td className="px-3 py-3 text-slate-300">{r.location}</td>
                      <td className="px-3 py-3 font-mono text-slate-400">{r.device_id}</td>
                      <td className="px-3 py-3">
                        <RiskBadge level={r.risk_level} />
                        <span className="ml-2 font-bold font-mono text-slate-200">{r.risk_score}</span>
                      </td>
                      <td className="px-3 py-3 font-extrabold uppercase text-cyan-300">
                        {t(`status.${(r.status || 'COMPLETED').toLowerCase().replace('_', '')}`) || r.status || 'COMPLETED'}
                      </td>
                      <td className="px-3 py-3 font-bold uppercase text-white">
                        {t(`action.${(r.action || 'ALLOW').toLowerCase()}`) || r.action}
                      </td>
                      <td className="px-3 py-3">
                        <button className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Inspection Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-slideIn">
          <div className="card-glow max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div>
                <h3 className="font-extrabold text-lg text-white">Transaction Intelligence</h3>
                <p className="font-mono text-xs text-cyan-400">{selectedTx.txn_id}</p>
              </div>
              <button onClick={() => setSelectedTx(null)} className="text-slate-400 hover:text-white text-lg">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-cyber-panel border border-cyan-500/20">
                <span className="text-slate-400 block text-[10px] uppercase">Account</span>
                <span className="font-mono font-bold text-white">{selectedTx.masked_account}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-cyber-panel border border-cyan-500/20">
                <span className="text-slate-400 block text-[10px] uppercase">Amount</span>
                <span className="font-bold text-white">{inr(selectedTx.amount)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-cyber-panel border border-cyan-500/20">
                <span className="text-slate-400 block text-[10px] uppercase">UPI ID</span>
                <span className="font-mono text-cyan-300">{selectedTx.upi_id}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-cyber-panel border border-cyan-500/20">
                <span className="text-slate-400 block text-[10px] uppercase">Device / Location</span>
                <span className="text-slate-200">{selectedTx.device_id} ({selectedTx.location})</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-cyber-panel border border-cyan-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block uppercase">Evaluated Risk Score</span>
                <span className="text-2xl font-extrabold text-cyan-300">{selectedTx.risk_score} / 100</span>
              </div>
              <RiskBadge level={selectedTx.risk_level} />
            </div>

            {selectedTx.signals && selectedTx.signals.length > 0 && (
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 block mb-2">Signal Evidence</span>
                <div className="space-y-1.5">
                  {selectedTx.signals.map((s, idx) => (
                    <div key={idx} className="p-2 rounded bg-white/5 border border-white/10 text-xs text-slate-300">
                      <div className="flex justify-between font-bold text-white mb-0.5">
                        <span>{s.label}</span>
                        <span className="text-cyan-400">+{s.contribution} pts</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{s.evidence}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-cyan-500/20">
              <button className="btn-cyber text-xs" onClick={() => { nav(`/app/network?acc=${selectedTx.account_number}`); setSelectedTx(null) }}>
                View 3D Network Graph
              </button>
              <button className="btn-primary text-xs" onClick={() => setSelectedTx(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
