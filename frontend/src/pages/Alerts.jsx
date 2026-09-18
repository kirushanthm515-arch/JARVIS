import { useEffect, useState } from 'react'
import { ShieldAlert, Check, FolderPlus, AlertOctagon } from 'lucide-react'
import { api } from '../api/client'
import { useApp } from '../context/AppContext'
import { Empty, ErrorBox, Skeleton } from '../components/ui'
import { useNavigate } from 'react-router-dom'

export default function Alerts() {
  const { t } = useApp()
  const nav = useNavigate()
  const [rows, setRows] = useState(null)
  const [filter, setFilter] = useState('ALL')
  const [err, setErr] = useState('')
  const [note, setNote] = useState('')

  const load = () => api.alerts().then(setRows).catch((e) => { setErr(e.message); setRows([]) })
  useEffect(() => { load() }, [])

  const markRead = async (id) => {
    await api.readAlert(id)
    load()
  }

  const investigate = async (txnId) => {
    try {
      const c = await api.createCase(txnId, 'Opened from Fraud Alert Center.')
      setNote(`Investigation Case ${c.case_id} created for transaction ${txnId}.`)
    } catch (e) {
      setErr(e.message)
    }
  }

  const filteredRows = (rows || []).filter((r) => filter === 'ALL' || r.level === filter)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-400" />
            {t('alerts.title')}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('alerts.sub')}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === f
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow'
                  : 'bg-cyber-panel text-slate-400 border border-transparent hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {err && <ErrorBox message={err} />}
      {note && <div className="p-3 rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-xs font-bold text-cyan-300">{note}</div>}

      <div className="card">
        {!rows ? <Skeleton rows={6} /> : filteredRows.length === 0 ? (
          <Empty title="No security alerts found." hint="Run a simulation or scan a transaction to trigger alerts." />
        ) : (
          <div className="space-y-2.5">
            {filteredRows.map((a) => {
              const isCrit = a.level === 'CRITICAL'
              return (
                <div key={a.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 text-xs transition-all ${
                  a.read 
                    ? 'border-white/5 bg-cyber-panel/40 opacity-70' 
                    : isCrit 
                    ? 'border-red-500/40 bg-red-500/10 shadow-glowRed' 
                    : 'border-orange-500/30 bg-orange-500/5'
                }`}>
                  <div className="flex items-center gap-3 min-w-[240px]">
                    <div className={`p-2 rounded-xl border ${isCrit ? 'border-red-500/40 bg-red-500/20 text-red-400' : 'border-orange-500/40 bg-orange-500/20 text-orange-400'}`}>
                      <AlertOctagon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-extrabold text-sm text-white">{a.title}</p>
                      <p className="text-slate-300 text-xs mt-0.5">{a.message}</p>
                      <p className="text-[11px] font-mono text-cyan-400/80 mt-1">TXN: {a.txn_id} · {a.created_at?.slice(0, 16)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`chip ${isCrit ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-orange-500/20 text-orange-400 border border-orange-500/40'}`}>
                      {a.level}
                    </span>
                    {!a.read && (
                      <button className="btn-ghost !py-1.5 !px-3 !text-xs" onClick={() => markRead(a.id)}>
                        <Check className="h-3.5 w-3.5" /> Mark Read
                      </button>
                    )}
                    <button className="btn-cyber !py-1.5 !px-3 !text-xs" onClick={() => investigate(a.txn_id)}>
                      <FolderPlus className="h-3.5 w-3.5" /> Create Case
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
