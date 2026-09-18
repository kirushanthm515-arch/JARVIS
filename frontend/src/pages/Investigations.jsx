import { useEffect, useState } from 'react'
import { Folder, ChevronDown, ChevronUp, Clock, CheckCircle2, ShieldAlert } from 'lucide-react'
import { api } from '../api/client'
import { useApp } from '../context/AppContext'
import { Empty, ErrorBox, RiskBadge, Skeleton } from '../components/ui'

const STATUSES = ['OPEN', 'UNDER REVIEW', 'RESOLVED', 'FALSE POSITIVE']

export default function Investigations() {
  const { t } = useApp()
  const [rows, setRows] = useState(null)
  const [err, setErr] = useState('')
  const [open, setOpen] = useState(null)
  const [notes, setNotes] = useState('')

  const load = () => api.cases().then(setRows).catch((e) => { setErr(e.message); setRows([]) })
  useEffect(() => { load() }, [])

  const update = async (c, status) => {
    try {
      await api.updateCase(c.case_id, status, notes || c.notes || '')
      load()
    } catch (e) {
      setErr(e.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Folder className="h-6 w-6 text-cyan-400" />
            Investigation Case Center
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage active case files, evaluate forensic evidence timelines, and record investigator notes
          </p>
        </div>
      </div>

      {err && <ErrorBox message={err} />}

      {!rows ? <Skeleton rows={5} /> : rows.length === 0 ? (
        <div className="card"><Empty title="No investigation cases available." hint="Create one from the analysis screen or the alert center." /></div>
      ) : (
        <div className="space-y-4">
          {rows.map((c) => {
            const isOpen = open === c.case_id
            return (
              <div key={c.case_id} className="card space-y-3 transition-all">
                <div className="flex flex-wrap items-center justify-between gap-3 cursor-pointer" onClick={() => { setOpen(isOpen ? null : c.case_id); setNotes(c.notes || '') }}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono font-bold text-sm">
                      {c.case_id}
                    </div>
                    <div>
                      <p className="font-extrabold text-sm text-white">{c.txn_id} · {c.upi_id}</p>
                      <p className="text-[11px] font-mono text-slate-400">Created: {c.created_at?.slice(0, 16)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] uppercase text-slate-400 block">Risk Score</span>
                      <span className="font-extrabold text-cyan-300 font-mono text-base">{c.risk_score}/100</span>
                    </div>
                    <RiskBadge level={c.risk_score > 85 ? 'CRITICAL' : c.risk_score > 70 ? 'HIGH' : 'MEDIUM'} />
                    <span className={`chip ${c.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'}`}>
                      {c.status}
                    </span>
                    <button className="btn-ghost !p-2">
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-cyan-500/20 grid gap-6 lg:grid-cols-2 animate-slideIn">
                    {/* Evidence List */}
                    <div className="space-y-3">
                      <p className="text-xs font-extrabold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                        <ShieldAlert className="h-4 w-4" /> Signal Evidence Log
                      </p>
                      {c.evidence.length === 0 ? <p className="text-xs text-slate-400">No signals recorded.</p> : (
                        <div className="space-y-2">
                          {c.evidence.map((s, idx) => (
                            <div key={idx} className="p-3 rounded-xl border border-cyan-500/20 bg-cyber-panel/60 text-xs">
                              <div className="flex justify-between font-extrabold text-white mb-1">
                                <span>{s.label}</span>
                                <span className="text-cyan-400">+{s.contribution} pts ({s.severity})</span>
                              </div>
                              <p className="text-slate-300 text-[11px]">{s.evidence}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Timeline & Notes */}
                    <div className="space-y-4">
                      <p className="text-xs font-extrabold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                        <Clock className="h-4 w-4" /> Investigation Audit Timeline
                      </p>
                      <ol className="relative space-y-2.5 border-l border-cyan-500/30 pl-5 text-xs">
                        {c.timeline.map((e, i) => (
                          <li key={i} className="relative">
                            <span className="absolute -left-[25px] mt-1 h-2.5 w-2.5 rounded-full bg-cyan-400 ring-4 ring-cyan-500/20" />
                            <span className="text-[10px] font-mono text-cyan-400/80">{e.time}</span>
                            <p className="font-semibold text-slate-200 mt-0.5">{e.event}</p>
                          </li>
                        ))}
                      </ol>

                      <div>
                        <p className="mb-1.5 text-xs font-extrabold uppercase tracking-wider text-cyan-400">Investigator Case Notes</p>
                        <textarea
                          className="input h-20 text-xs font-sans"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Record findings, interview notes, or action rationale..."
                        />
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {STATUSES.map((s) => (
                          <button
                            key={s}
                            className={s === c.status ? 'btn-primary text-xs !py-1.5' : 'btn-ghost text-xs !py-1.5'}
                            onClick={() => update(c, s)}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
