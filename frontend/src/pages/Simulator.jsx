import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldAlert, Play, Zap, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react'
import { api } from '../api/client'
import { useApp } from '../context/AppContext'
import { ErrorBox, Loader } from '../components/ui'

const ATTACK_SCENARIOS = [
  {
    id: 'scripted_attack',
    title: '🔥 Full Escalating Attack Pattern',
    desc: 'Runs a 5-step scripted fraud attack on account ACC1001 with escalating amount, new device DEV999, and location jump.',
    isScripted: true
  },
  {
    id: 'normal',
    title: '✅ Normal Daily Transaction',
    desc: 'Generates a standard low-risk transaction within baseline parameters.',
    mode: 'normal'
  },
  {
    id: 'high_amount',
    title: '⚠️ High Amount Spike Attack',
    desc: 'Triggers an immediate 10x amount deviation above historical average.',
    mode: 'suspicious'
  },
  {
    id: 'new_device',
    title: '📱 New Unrecognized Device Attack',
    desc: 'Simulates transaction from an un-fingerprinted device ID.',
    mode: 'suspicious'
  },
  {
    id: 'rapid_velocity',
    title: '⚡ Rapid Burst Transfer Attack',
    desc: 'Executes high velocity transaction burst within a 5-minute window.',
    mode: 'attack'
  },
  {
    id: 'network_anomaly',
    title: '🌐 Network Sharing Attack',
    desc: 'Simulates transaction sharing a device fingerprint linked to previously flagged accounts.',
    mode: 'attack'
  }
]

export default function Simulator() {
  const { t } = useApp()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [results, setResults] = useState(null)
  const [notice, setNotice] = useState('')

  const runScenario = async (scenario) => {
    setBusy(true)
    setErr('')
    setResults(null)
    try {
      if (scenario.isScripted) {
        const res = await api.simulateAttack()
        setResults(res.steps)
        setNotice(res.notice)
      } else {
        const res = await api.generate(scenario.mode)
        setResults(res.transactions)
        setNotice(res.notice)
      }
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Zap className="h-6 w-6 text-cyan-400" />
            Fraud Attack Simulator
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Test the live AI Fraud Engine against scripted financial attack vectors in real-time
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ATTACK_SCENARIOS.map((scen) => (
          <div
            key={scen.id}
            className="card flex flex-col justify-between hover:border-cyan-500/60 transition-all cursor-pointer group"
          >
            <div>
              <h3 className="font-extrabold text-sm text-cyan-300 group-hover:text-cyan-200 flex items-center gap-2">
                {scen.title}
              </h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">{scen.desc}</p>
            </div>

            <button
              disabled={busy}
              onClick={() => runScenario(scen)}
              className="mt-4 btn-cyber w-full py-2 text-xs font-bold flex items-center justify-center gap-2"
            >
              <Play className="h-3.5 w-3.5" /> Execute Attack Scenario
            </button>
          </div>
        ))}
      </div>

      {busy && (
        <div className="card text-center py-10">
          <Loader label="Executing attack scenario & querying AI engine..." />
        </div>
      )}

      {err && <ErrorBox message={err} />}

      {results && (
        <div className="card space-y-4 animate-slideIn">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-cyan-400" /> Simulation Execution Results
              </h2>
              {notice && <p className="text-xs text-slate-400 mt-0.5">{notice}</p>}
            </div>
            <span className="chip bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {results.length} Transaction(s) Evaluated
            </span>
          </div>

          <div className="space-y-3">
            {results.map((tx, idx) => {
              const isCritical = tx.risk_level === 'CRITICAL' || tx.risk_level === 'HIGH'
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border ${
                    isCritical ? 'border-red-500/40 bg-red-500/10' : 'border-cyan-500/20 bg-cyber-panel/60'
                  } space-y-2`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-cyan-300 font-bold">{tx.txn_id}</span>
                      <span className="text-xs font-semibold text-slate-300">
                        {tx.account_number} ({tx.location})
                      </span>
                      {tx.step_note && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                          {tx.step_note}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-white">₹{tx.amount?.toLocaleString()}</span>
                      <span
                        className={`chip ${
                          tx.risk_level === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : tx.risk_level === 'HIGH'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}
                      >
                        SCORE: {tx.risk_score}/100 ({tx.risk_level})
                      </span>
                      <span className="text-xs font-bold uppercase text-slate-300">ACTION: {tx.action}</span>
                    </div>
                  </div>

                  {tx.signals && tx.signals.length > 0 && (
                    <div className="pt-2 border-t border-white/5 grid gap-1.5 sm:grid-cols-2">
                      {tx.signals.map((sig, sidx) => (
                        <div key={sidx} className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <AlertTriangle className="h-3 w-3 text-orange-400 flex-shrink-0" />
                          <span>
                            <strong className="text-slate-200">{sig.label}:</strong> {sig.evidence}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
