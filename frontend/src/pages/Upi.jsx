import { useState, useEffect } from 'react'
import { Search, Smartphone, ShieldAlert, Radio } from 'lucide-react'
import { api } from '../api/client'
import { useApp } from '../context/AppContext'
import { Empty, ErrorBox, Loader, RiskBadge, inr } from '../components/ui'

const Flag = ({ label, value }) => (
  <div className="rounded-xl border border-cyan-500/20 bg-cyber-panel/60 p-3.5">
    <p className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">{label}</p>
    <p className={`mt-1 font-extrabold text-base ${value === 'YES' || value === 'HIGH' || value === 'CRITICAL' ? 'text-red-400' : 'text-cyan-300'}`}>
      {value}
    </p>
  </div>
)

export default function Upi() {
  const { t } = useApp()
  const [id, setId] = useState('demo@upi')
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async (val = id) => {
    setBusy(true)
    setErr('')
    setData(null)
    try {
      const res = await api.upi(val.trim())
      setData(res)
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    load('demo@upi')
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Smartphone className="h-6 w-6 text-cyan-400" />
            UPI ID Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Query instant payment handles for velocity spikes, location jumps, and device sharing anomalies
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
            placeholder="demo@upi"
          />
        </div>
        <button className="btn-primary" onClick={() => load()} disabled={busy}>
          {busy ? 'Searching...' : 'SEARCH UPI HANDLE'}
        </button>
      </div>

      {busy && <div className="card text-center py-12"><Loader label="Analyzing UPI Handle Telemetry..." /></div>}
      {err && <ErrorBox message={err} />}

      {data && (
        <div className="space-y-6">
          <div className="card-glow space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
              <div>
                <p className="text-xl font-extrabold text-cyan-300 font-mono">{data.upi_id}</p>
                <p className="text-xs text-slate-300 mt-0.5">Linked Account: <span className="font-mono text-cyan-400">{data.masked_account}</span></p>
              </div>
              <RiskBadge level={data.risk} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Flag label="Overall Risk Level" value={data.risk} />
              <Flag label="Transaction Velocity" value={data.velocity_flag} />
              <Flag label="New Device Introduced" value={data.new_device} />
              <Flag label="Location Anomaly" value={data.location_anomaly} />
              <Flag label="Network Anomaly" value={data.network_anomaly} />
              <Flag label="Total Transactions" value={data.transaction_count} />
              <Flag label="Average Amount" value={inr(data.avg_amount)} />
              <Flag label="Unique Devices Seen" value={data.known_devices.length} />
            </div>

            <div className="p-3 rounded-xl border border-cyan-500/20 bg-cyber-panel/80 text-xs text-slate-300 font-mono flex flex-wrap justify-between gap-2">
              <span className="text-cyan-400 font-bold">VELOCITY METRICS:</span>
              <span>1m: <strong className="text-white">{data.velocity['1m']}</strong></span>
              <span>5m: <strong className="text-white">{data.velocity['5m']}</strong></span>
              <span>15m: <strong className="text-white">{data.velocity['15m']}</strong></span>
              <span>1h: <strong className="text-white">{data.velocity['1h']}</strong></span>
              <span>24h: <strong className="text-white">{data.velocity['24h']}</strong></span>
            </div>
          </div>

          <div className="card space-y-3">
            <p className="font-extrabold text-sm text-cyan-400 uppercase tracking-wider">Recent Activity Stream</p>
            {data.recent_transactions.length === 0 ? <Empty title={t('common.noData')} /> : (
              <div className="space-y-2">
                {data.recent_transactions.map((r) => (
                  <div key={r.txn_id} className="p-3 rounded-xl border border-white/5 bg-cyber-panel/40 flex flex-wrap items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-300">{r.txn_id}</span>
                      <span className="text-slate-300">{r.location} · Device: {r.device_id}</span>
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
