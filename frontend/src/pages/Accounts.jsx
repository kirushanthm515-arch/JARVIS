import { useState, useEffect } from 'react'
import { Search, Users, ShieldAlert, Smartphone, MapPin, HardDrive } from 'lucide-react'
import { api } from '../api/client'
import { useApp } from '../context/AppContext'
import { Empty, ErrorBox, Loader, RiskBadge, inr } from '../components/ui'
import { useNavigate } from 'react-router-dom'

const Stat = ({ label, value, sub }) => (
  <div className="rounded-xl border border-cyan-500/20 bg-cyber-panel/60 p-3.5">
    <p className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">{label}</p>
    <p className="mt-1 text-base font-extrabold text-white">{value}</p>
    {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
  </div>
)

export default function Accounts() {
  const { t } = useApp()
  const nav = useNavigate()
  const [id, setId] = useState('ACC1001')
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async (val = id) => {
    setBusy(true)
    setErr('')
    setData(null)
    try {
      const res = await api.account(val.trim())
      setData(res)
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    load('ACC1001')
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-cyan-400" />
            Account Risk Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Deep contextual risk profile, behavioral baseline, device mapping, and connected entities
          </p>
        </div>
      </div>

      <div className="card flex flex-wrap gap-3 items-center">
        <div className="relative min-w-[260px] flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-cyan-400" />
          <input
            className="input pl-10 font-mono"
            value={id}
            onChange={(e) => setId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="ACC1001"
          />
        </div>
        <button className="btn-primary" onClick={() => load()} disabled={busy}>
          {busy ? 'Searching...' : 'SEARCH ACCOUNT'}
        </button>
      </div>

      {busy && <div className="card text-center py-12"><Loader label="Building Account Risk Profile..." /></div>}
      {err && <ErrorBox message={err} />}
      {!busy && !data && !err && <div className="card"><Empty title="Search an account" hint="Demo accounts: ACC1001 – ACC1012." /></div>}

      {data && (
        <div className="space-y-6">
          <div className="card-glow space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
              <div>
                <p className="font-mono text-xl font-extrabold text-cyan-300">{data.account_number}</p>
                <p className="text-xs text-slate-300 mt-0.5">{data.holder_name} · <span className="font-mono text-cyan-400">{data.upi_id}</span></p>
                <p className="text-[11px] text-slate-400">Home Location: {data.home_location}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs text-slate-400 block uppercase">Account Risk Score</span>
                  <span className="text-3xl font-extrabold text-cyan-300">{data.risk_score} / 100</span>
                </div>
                <RiskBadge level={data.risk_score > 70 ? 'HIGH' : data.risk_score > 30 ? 'MEDIUM' : 'LOW'} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Account Age" value={`${data.account_age_days} days`} sub={`Opened: ${data.opened_at?.slice(0, 10)}`} />
              <Stat label="Total Transactions" value={data.transaction_count} sub={`Avg Amount: ${inr(data.avg_amount)}`} />
              <Stat label="Maximum Transfer" value={inr(data.max_amount)} />
              <Stat label="Fraud Incidents" value={data.fraud_incidents} sub={data.fraud_incidents > 0 ? 'Previously Flagged' : 'Clean History'} />
              <Stat label="Known Devices" value={data.known_devices.length} sub={data.known_devices.join(', ')} />
              <Stat label="Known Locations" value={data.known_locations.length} sub={data.known_locations.join(', ')} />
              <Stat label="Connected Accounts" value={data.connected_accounts.length} sub="Shared Devices" />
              <Stat label="Baseline Status" value="ACTIVE" sub="Learning Enabled" />
            </div>
          </div>

          <div className="card space-y-3">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
              <h3 className="font-extrabold text-sm text-cyan-400 uppercase tracking-wider">
                Connected Accounts (Shared Device Fingerprints)
              </h3>
              <button
                className="btn-cyber text-xs py-1"
                onClick={() => nav(`/app/network?acc=${data.account_number}`)}
              >
                Inspect 3D Network
              </button>
            </div>

            {data.connected_accounts.length === 0 ? (
              <Empty title="No shared device relationships detected." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.connected_accounts.map((c) => (
                  <div
                    key={c.account_number + c.shared_device}
                    className="rounded-xl border border-cyan-500/20 bg-cyber-panel/60 p-3.5 text-xs space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-white">{c.masked}</span>
                      <span className={`chip ${c.max_risk_score >= 70 ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-cyan-500/10 text-cyan-300'}`}>
                        Risk {c.max_risk_score}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Via Device <code className="text-cyan-300">{c.shared_device}</code> ({c.shared_transactions} transactions)
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card space-y-3">
            <p className="font-extrabold text-sm text-cyan-400 uppercase tracking-wider">Account Transaction Timeline</p>
            {data.recent_transactions.length === 0 ? <Empty title={t('common.noData')} /> : (
              <div className="space-y-2">
                {data.recent_transactions.slice(0, 10).map((r) => (
                  <div key={r.txn_id} className="p-3 rounded-xl border border-white/5 bg-cyber-panel/40 flex flex-wrap items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-300">{r.txn_id}</span>
                      <span className="text-slate-400 font-mono">({r.created_at?.slice(0, 16)})</span>
                      <span className="text-slate-200">{r.location} · {r.device_id}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-white">{inr(r.amount)}</span>
                      <RiskBadge level={r.risk_level} />
                      <span className="font-mono font-bold text-cyan-400">{r.risk_score}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
