import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Search, Eye, CreditCard } from 'lucide-react'
import { api } from '../api/client'
import { useApp } from '../context/AppContext'
import { Empty, ErrorBox, RiskBadge, Skeleton, inr } from '../components/ui'
import { useNavigate } from 'react-router-dom'

const LEVELS = ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

export default function Transactions() {
  const { t } = useApp()
  const nav = useNavigate()
  const [rows, setRows] = useState(null)
  const [err, setErr] = useState('')
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState('')
  const [sort, setSort] = useState({ key: 'created_at', dir: -1 })
  const [selectedTx, setSelectedTx] = useState(null)

  const load = useCallback(async () => {
    setRows(null)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (level) params.set('risk_level', level)
      setRows(await api.transactions('?' + params.toString()))
      setErr('')
    } catch (e) {
      setErr(e.message)
      setRows([])
    }
  }, [search, level])

  useEffect(() => {
    const id = setTimeout(load, 250)
    return () => clearTimeout(id)
  }, [load])

  const sorted = useMemo(() => {
    if (!rows) return null
    return [...rows].sort((a, b) => (a[sort.key] > b[sort.key] ? 1 : -1) * sort.dir)
  }, [rows, sort])

  const exportCsv = () => {
    const cols = ['txn_id', 'masked_account', 'upi_id', 'amount', 'txn_type', 'location', 'device_id',
      'created_at', 'risk_score', 'risk_level', 'action', 'status']
    const csv = [cols.join(','), ...(sorted || []).map((r) => cols.map((c) => `"${r[c] ?? ''}"`).join(','))].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'fraudshield-transactions.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const th = (key, label) => (
    <th
      className="cursor-pointer px-3 py-2.5 font-extrabold text-cyan-400 uppercase tracking-wider hover:text-white"
      onClick={() => setSort((s) => ({ key, dir: s.key === key ? -s.dir : 1 }))}
    >
      {label}{sort.key === key ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''}
    </th>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-cyan-400" />
            Searchable Transaction Stream History
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Query and filter stored transactions, evaluate contextual signals, and export forensic CSV reports
          </p>
        </div>

        <button className="btn-cyber text-xs flex items-center gap-2 py-2" onClick={exportCsv}>
          <Download className="h-4 w-4 text-cyan-400" /> Export Forensic CSV
        </button>
      </div>

      <div className="card space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-cyan-400" />
            <input
              className="input pl-10"
              placeholder="Search ID / account / UPI / device / location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input !w-auto border-cyan-500/30 font-bold"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            {LEVELS.map((l) => <option key={l} value={l}>{l || 'All Risk Levels'}</option>)}
          </select>
        </div>

        {err && <ErrorBox message={err} />}

        {!sorted ? <Skeleton rows={8} /> : sorted.length === 0 ? (
          <Empty title="No transactions found." hint="Try clearing the search or risk level filter." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-xs">
              <thead className="border-b border-cyan-500/20 text-[11px]">
                <tr>
                  {th('txn_id', t('table.txnId'))}
                  {th('masked_account', t('table.account'))}
                  {th('upi_id', t('table.upiId'))}
                  {th('amount', t('table.amount'))}
                  {th('txn_type', t('transaction.type'))}
                  {th('location', t('table.location'))}
                  {th('device_id', t('table.device'))}
                  {th('created_at', t('table.created'))}
                  {th('risk_score', t('table.riskScore'))}
                  {th('risk_level', t('transaction.riskLevel'))}
                  {th('action', t('table.action'))}
                  <th className="px-3 py-2.5 font-extrabold text-cyan-400 uppercase tracking-wider">{t('table.inspect')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sorted.map((r) => (
                  <tr
                    key={r.txn_id}
                    className="hover:bg-cyan-500/5 transition-colors cursor-pointer"
                    onClick={() => setSelectedTx(r)}
                  >
                    <td className="px-3 py-3 font-mono font-bold text-cyan-300">{r.txn_id}</td>
                    <td className="px-3 py-3 font-mono text-slate-300">{r.masked_account}</td>
                    <td className="px-3 py-3 font-mono text-slate-300">{r.upi_id}</td>
                    <td className="px-3 py-3 font-extrabold text-white">{inr(r.amount)}</td>
                    <td className="px-3 py-3 text-slate-300">{r.txn_type}</td>
                    <td className="px-3 py-3 text-slate-300">{r.location}</td>
                    <td className="px-3 py-3 font-mono text-slate-400">{r.device_id}</td>
                    <td className="px-3 py-3 font-mono text-slate-400">{r.created_at?.slice(0, 16)}</td>
                    <td className="px-3 py-3 font-extrabold font-mono text-cyan-300">{r.risk_score}</td>
                    <td className="px-3 py-3"><RiskBadge level={r.risk_level} /></td>
                    <td className="px-3 py-3 font-bold uppercase text-white">{r.action}</td>
                    <td className="px-3 py-3">
                      <button className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-slideIn">
          <div className="card-glow max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div>
                <h3 className="font-extrabold text-lg text-white">Full Transaction Audit Record</h3>
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
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 block mb-2">Signal Evidence Log</span>
                <div className="space-y-1.5">
                  {selectedTx.signals.map((s, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-white/5 border border-cyan-500/20 text-xs text-slate-300">
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
              <button
                className="btn-cyber text-xs"
                onClick={() => { nav(`/app/network?acc=${selectedTx.account_number}`); setSelectedTx(null) }}
              >
                Inspect 3D Network Graph
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
