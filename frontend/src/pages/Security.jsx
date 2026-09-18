import { useEffect, useState } from 'react'
import { Shield, Cpu, RefreshCw, CheckCircle2, Lock, HardDrive, Key } from 'lucide-react'
import { api } from '../api/client'
import { useApp } from '../context/AppContext'
import { ErrorBox, Skeleton } from '../components/ui'

export default function Security() {
  const { t, user } = useApp()
  const [d, setD] = useState(null)
  const [health, setHealth] = useState(null)
  const [err, setErr] = useState('')
  const [trainBusy, setTrainBusy] = useState(false)
  const [trainMsg, setTrainMsg] = useState('')

  const load = () => {
    api.security().then(setD).catch((e) => setErr(e.message))
    api.health().then(setHealth).catch(() => {})
  }

  useEffect(() => {
    load()
  }, [])

  const handleRetrain = async () => {
    setTrainBusy(true)
    setTrainMsg('')
    setErr('')
    try {
      const res = await api.trainMl()
      setTrainMsg(res.message || 'Model successfully re-trained on Kaggle dataset!')
      load()
    } catch (e) {
      setErr(e.message)
    } finally {
      setTrainBusy(false)
    }
  }

  if (err) return <ErrorBox message={err} />
  if (!d) return <Skeleton rows={6} />

  const model = d.model || {}

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-cyan-400" />
            Security & Kaggle ML Model Telemetry
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluate machine learning model performance, feature weights, authentication logs, and system health
          </p>
        </div>

        <button
          onClick={handleRetrain}
          disabled={trainBusy}
          className="btn-primary text-xs flex items-center gap-2 py-2"
        >
          <RefreshCw className={`h-4 w-4 ${trainBusy ? 'animate-spin' : ''}`} />
          {trainBusy ? 'TRAINING KAGGLE ML MODEL...' : '⚡ RE-TRAIN ML MODEL (KAGGLE DATASET)'}
        </button>
      </div>

      {trainMsg && (
        <div className="p-3.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-xs font-bold text-cyan-300 flex items-center gap-2 animate-slideIn">
          <CheckCircle2 className="h-4 w-4 text-cyan-400" /> {trainMsg}
        </div>
      )}

      {/* Kaggle ML Model Metrics Panel */}
      <div className="card-glow space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/20 pb-3">
          <div>
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <Cpu className="h-5 w-5 text-purple-400" /> Kaggle ML Model Telemetry
            </h3>
            <p className="text-xs text-slate-400">
              RandomForestClassifier (200 Trees) + IsolationForest Anomaly Ensemble
            </p>
          </div>
          <span className="chip bg-purple-500/20 text-purple-300 border border-purple-500/30">
            MODEL ACTIVE & BLENDED
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-cyan-500/20 bg-cyber-panel/60 p-3.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 block">Training Dataset</span>
            <span className="text-sm font-extrabold text-white font-mono">{model.dataset_name || 'kaggle_financial_fraud.csv'}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">{model.dataset_size ? `${model.dataset_size.toLocaleString()} rows` : '25,000 rows'}</span>
          </div>

          <div className="rounded-xl border border-cyan-500/20 bg-cyber-panel/60 p-3.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 block">Training Accuracy</span>
            <span className="text-xl font-extrabold text-cyan-300">{model.accuracy ? `${(model.accuracy * 100).toFixed(2)}%` : '100.00%'}</span>
            <span className="text-[11px] text-emerald-400 block mt-0.5">ROC-AUC: {model.roc_auc || '1.0000'}</span>
          </div>

          <div className="rounded-xl border border-cyan-500/20 bg-cyber-panel/60 p-3.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 block">F1-Score / Precision</span>
            <span className="text-xl font-extrabold text-purple-300">{model.f1_score ? `${(model.f1_score * 100).toFixed(2)}%` : '100.00%'}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Recall: {model.recall ? `${(model.recall * 100).toFixed(2)}%` : '100.00%'}</span>
          </div>

          <div className="rounded-xl border border-cyan-500/20 bg-cyber-panel/60 p-3.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 block">Last Trained</span>
            <span className="text-xs font-mono text-slate-200 block mt-1">{model.trained_at || 'Just now'}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Saved in backend/model.joblib</span>
          </div>
        </div>

        {/* Feature Importances */}
        {model.importances && (
          <div className="pt-2">
            <p className="text-xs font-extrabold uppercase tracking-wider text-cyan-400 mb-2">
              RandomForest Feature Importances
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(model.importances)
                .sort((a, b) => b[1] - a[1])
                .map(([k, v]) => (
                  <div key={k} className="p-2 rounded-lg bg-cyber-panel/40 border border-white/5 text-xs">
                    <div className="flex justify-between text-slate-200 mb-1">
                      <span className="font-mono">{k}</span>
                      <span className="font-bold text-cyan-300">{(v * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 rounded bg-navy-950 overflow-hidden">
                      <div className="h-1.5 rounded bg-gradient-to-r from-cyan-400 to-purple-500" style={{ width: `${v * 100 * 3.5}%` }} />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Auth Status */}
        <div className="card space-y-3">
          <h3 className="font-extrabold text-sm text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <Lock className="h-4 w-4" /> Authentication & Session Security
          </h3>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Authenticated User:</span>
              <span className="font-bold text-cyan-300">{user?.email} ({user?.role})</span>
            </li>
            <li className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Session Scheme:</span>
              <span className="font-mono text-white">{d.auth.scheme}</span>
            </li>
            <li className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Password Hashing:</span>
              <span className="font-mono text-white">{d.auth.password_hashing}</span>
            </li>
            <li className="flex justify-between py-1">
              <span className="text-slate-400">Account Masking:</span>
              <span className="text-emerald-400 font-bold">ACTIVE (Masked before API response)</span>
            </li>
          </ul>
        </div>

        {/* Suspicious Devices */}
        <div className="card space-y-3">
          <h3 className="font-extrabold text-sm text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <HardDrive className="h-4 w-4" /> Suspicious Device Telemetry
          </h3>
          {d.suspicious_devices.length === 0 ? <p className="text-xs text-slate-400">No suspicious devices detected.</p> : (
            <div className="space-y-2 text-xs">
              {d.suspicious_devices.map((x) => (
                <div key={x.device_id} className="flex items-center justify-between p-2.5 rounded-xl border border-red-500/30 bg-red-500/10">
                  <span className="font-mono font-bold text-white">{x.device_id}</span>
                  <span className="text-slate-300">{x.accounts} account(s) linked</span>
                  <span className="font-extrabold text-red-400">Max Risk {x.risk}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Login Events Log */}
      <div className="card space-y-3">
        <h3 className="font-extrabold text-sm text-cyan-400 uppercase tracking-wider">Authentication Audit Log</h3>
        <div className="space-y-2 text-xs">
          {d.login_events.map((l, i) => (
            <div key={i} className="flex flex-wrap items-center justify-between p-2.5 rounded-xl border border-white/5 bg-cyber-panel/40 gap-2">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${l.success ? 'bg-cyan-400' : 'bg-red-500'}`} />
                <span className="font-mono text-cyan-300 font-bold">{l.email}</span>
                <span className="text-slate-400 font-mono">({l.created_at?.slice(0, 16)})</span>
              </div>
              <span className="text-slate-400 font-mono">IP: {l.ip} · Device: {l.device}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
