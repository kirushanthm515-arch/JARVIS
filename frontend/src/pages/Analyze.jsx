import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, FolderPlus, Search, ShieldAlert, Sparkles, Cpu, Play } from 'lucide-react'
import { api } from '../api/client'
import { useApp } from '../context/AppContext'
import { DemoNotice, ErrorBox, Loader, RiskMeter, inr } from '../components/ui'
import ScanBeam3D from '../components/3d/ScanBeam3D'
import { useNavigate } from 'react-router-dom'

const TYPES = ['UPI', 'Bank Transfer', 'Card', 'Wallet']
const LOCATIONS = ['Coimbatore', 'Chennai', 'Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune']

const ACTION_STYLE = {
  ALLOW: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  VERIFY: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  RESTRICT: 'border-orange-500/40 bg-orange-500/10 text-orange-400',
  BLOCK: 'border-red-500/50 bg-red-500/15 text-red-400 shadow-glowRed',
}

export default function Analyze() {
  const { t } = useApp()
  const nav = useNavigate()
  const [form, setForm] = useState({
    account_number: 'ACC1001',
    upi_id: 'demo@upi',
    amount: 95000,
    txn_type: 'UPI',
    device_id: 'DEV999',
    location: 'Chennai',
  })
  const [res, setRes] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [note, setNote] = useState('')

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const loadHackathonScenario = () => {
    setForm({
      account_number: 'ACC1001',
      upi_id: 'demo@upi',
      amount: 95000,
      txn_type: 'UPI',
      device_id: 'DEV999',
      location: 'Chennai',
    })
  }

  const analyze = async () => {
    setBusy(true)
    setErr('')
    setRes(null)
    setNote('')
    try {
      // Small artificial delay so the 3D scanning animation beam can be appreciated
      await new Promise((r) => setTimeout(r, 900))
      const out = await api.check({
        ...form,
        amount: Number(form.amount),
        timestamp: new Date().toISOString().slice(0, 19),
      })
      setRes(out)
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  const act = async (action) => {
    try {
      const out = await api.act(res.txn_id, action)
      setRes({ ...res, action: out.action, status: out.status })
      setNote(`Transaction ${res.txn_id} updated to status: ${out.status}.`)
    } catch (e) {
      setErr(e.message)
    }
  }

  const openCase = async () => {
    try {
      const out = await api.createCase(res.txn_id, 'Created from AI analysis screen.')
      setNote(`Investigation Case ${out.case_id} created in SQLite DB.`)
    } catch (e) {
      setErr(e.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Cpu className="h-6 w-6 text-cyan-400" />
            Analyze Transaction (AI Risk Engine)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Submit transaction parameters for 6-signal contextual evaluation & RandomForest ML scoring
          </p>
        </div>

        <button
          onClick={loadHackathonScenario}
          className="btn-cyber text-xs flex items-center gap-2 py-2"
        >
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          Pre-fill Hackathon Scenario (ACC1001 / ₹95,000)
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Input Parameters Form */}
        <div className="lg:col-span-5 card space-y-4">
          <div className="border-b border-cyan-500/20 pb-3">
            <h3 className="font-extrabold text-sm text-cyan-400 uppercase tracking-wider">Transaction Signals Input</h3>
            <p className="text-[11px] text-slate-400">Enter details to evaluate against historic account baselines</p>
          </div>

          <div>
            <label className="label">{t('transaction.accountNumber')}</label>
            <input className="input font-mono" value={form.account_number} onChange={set('account_number')} placeholder="ACC1001" />
          </div>

          <div>
            <label className="label">{t('transaction.upiId')}</label>
            <input className="input font-mono" value={form.upi_id} onChange={set('upi_id')} placeholder="user@upi" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('transaction.amount')} (₹)</label>
              <input className="input font-bold" type="number" min="1" value={form.amount} onChange={set('amount')} />
            </div>
            <div>
              <label className="label">{t('transaction.type')}</label>
              <select className="input" value={form.txn_type} onChange={set('txn_type')}>
                {TYPES.map((x) => <option key={x}>{x}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('transaction.deviceId')}</label>
              <input className="input font-mono" value={form.device_id} onChange={set('device_id')} placeholder="DEV999" />
            </div>
            <div>
              <label className="label">{t('transaction.location')}</label>
              <select className="input" value={form.location} onChange={set('location')}>
                {LOCATIONS.map((x) => <option key={x}>{x}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">{t('transaction.time')}</label>
            <input className="input text-slate-400 font-mono text-xs" value={new Date().toLocaleString()} readOnly />
          </div>

          <button className="btn-primary w-full py-3 mt-2" onClick={analyze} disabled={busy}>
            <Search className="h-4 w-4" />
            {busy ? 'RUNNING AI FRAUD SCAN...' : 'RUN AI FRAUD SCAN'}
          </button>

          {err && <ErrorBox message={err} />}
        </div>

        {/* AI Scan Progress or Risk Result UI */}
        <div className="lg:col-span-7 space-y-4">
          {busy && <ScanBeam3D label="AI SCANNING TRANSACTION IN REAL-TIME..." />}

          {!busy && !res && (
            <div className="card text-center py-16 text-slate-400 space-y-3">
              <ShieldAlert className="h-12 w-12 text-cyan-500/40 mx-auto" />
              <p className="font-extrabold text-white text-base">Ready to Scan</p>
              <p className="text-xs max-w-md mx-auto text-slate-400">
                Click <strong>"RUN AI FRAUD SCAN"</strong> or pre-fill the hackathon scenario to view real-time AI risk evaluation, signal evidence breakdown, and recommended action.
              </p>
            </div>
          )}

          {res && !busy && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Large Futuristic Risk Score Gauge Panel */}
              <div className="card-glow flex flex-wrap items-center justify-between gap-6">
                <RiskMeter score={res.risk_score} level={res.risk_level} />

                <div className="min-w-[200px] flex-1 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                    <CheckCircle2 className="h-4 w-4" /> AI SCAN COMPLETE
                  </div>
                  <p className="font-mono text-xs text-slate-400">TXN: <span className="text-cyan-300 font-bold">{res.txn_id}</span></p>
                  <p className="text-xl font-extrabold text-white">{inr(res.amount)} · <span className="text-cyan-400">{res.txn_type}</span></p>
                  <p className="text-slate-300 font-mono">{res.masked_account} · {res.upi_id}</p>
                  <p className="text-slate-400">{res.location} · Device: {res.device_id}</p>
                  
                  <div className="pt-2 border-t border-cyan-500/20 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Rule Score: <strong className="text-cyan-300">{res.rule_score}/100</strong></span>
                    {res.ml_available && (
                      <span>ML Opinion: <strong className="text-purple-300">{res.ml_score}/100</strong> (65/35 Blend)</span>
                    )}
                  </div>
                </div>

                <div className={`min-w-[200px] rounded-2xl border p-4 text-center ${ACTION_STYLE[res.action] || ACTION_STYLE.ALLOW}`}>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Recommended Action
                  </p>
                  <p className="mt-1 text-3xl font-extrabold tracking-wider">{res.action}</p>
                  <p className="mt-2 text-[11px] text-slate-300 leading-snug">{res.explanation}</p>
                </div>
              </div>

              {/* Signal Breakdown Cards */}
              <div className="card space-y-3">
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                  <p className="font-extrabold text-sm text-cyan-400 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" /> Signal Evidence Breakdown
                  </p>
                  <span className="text-xs text-slate-400 font-mono">{res.signals.length} Signal(s) Triggered</span>
                </div>

                {res.signals.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3">
                    No risk signals triggered. Behaviour matches this account's baseline.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {res.signals.map((s) => (
                      <div key={s.signal} className="rounded-xl border border-cyan-500/20 bg-cyber-panel/60 p-3 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                          <span className="font-extrabold text-white text-sm">{s.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="chip bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">{s.severity}</span>
                            <span className="font-extrabold text-cyan-400 text-sm">+{s.contribution} pts</span>
                          </div>
                        </div>
                        <p className="text-slate-300 text-xs">{s.evidence}</p>
                        <div className="mt-2 h-1.5 w-full rounded bg-navy-950 overflow-hidden">
                          <div className="h-1.5 rounded bg-gradient-to-r from-cyan-400 to-purple-500"
                            style={{ width: `${Math.min(100, s.contribution * 4.5)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions Toolbar */}
                <div className="pt-3 border-t border-cyan-500/20 flex flex-wrap gap-2">
                  {['ALLOW', 'VERIFY', 'RESTRICT', 'BLOCK'].map((a) => (
                    <button key={a} className={a === res.action ? 'btn-primary text-xs' : 'btn-ghost text-xs'} onClick={() => act(a)}>
                      {a}
                    </button>
                  ))}
                  <button className="btn-cyber text-xs ml-auto" onClick={openCase}>
                    <FolderPlus className="h-3.5 w-3.5" /> CREATE CASE
                  </button>
                  <button className="btn-cyber text-xs" onClick={() => nav(`/app/network?acc=${res.account_number}`)}>
                    VIEW 3D NETWORK
                  </button>
                </div>

                {note && <p className="mt-2 text-xs font-bold text-cyan-400">{note}</p>}
              </div>

              {/* Velocity Windows */}
              <div className="card">
                <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-cyan-400">Account Velocity Windows</p>
                <div className="grid grid-cols-5 gap-2 text-center">
                  {Object.entries(res.velocity || {}).map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-cyan-500/20 bg-cyber-panel/60 p-2">
                      <p className="text-[10px] uppercase font-mono text-slate-400">{k}</p>
                      <p className="text-base font-extrabold text-cyan-300">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
