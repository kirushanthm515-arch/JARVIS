import { useEffect, useState } from 'react'
import { Search, Share2, Box, Layers } from 'lucide-react'
import { api } from '../api/client'
import { useApp } from '../context/AppContext'
import NetworkGraph3D from '../components/3d/NetworkGraph3D'
import NetworkGraph from '../components/NetworkGraph'
import { Empty, ErrorBox, Loader } from '../components/ui'
import { useSearchParams } from 'react-router-dom'

export default function Network() {
  const { t } = useApp()
  const [searchParams] = useSearchParams()
  const initialAcc = searchParams.get('acc') || 'ACC1001'

  const [id, setId] = useState(initialAcc)
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [mode3D, setMode3D] = useState(true)

  const load = async (value = id) => {
    setBusy(true)
    setErr('')
    setData(null)
    try {
      const res = await api.network(value.trim())
      setData(res)
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    load(initialAcc)
  }, [initialAcc])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Share2 className="h-6 w-6 text-cyan-400" />
            3D Network & Entity Graph Analysis
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Visualize account, UPI, device, and location relationships to uncover shared fingerprints
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode3D(true)}
            className={`btn-cyber text-xs flex items-center gap-1.5 ${mode3D ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400' : ''}`}
          >
            <Box className="h-4 w-4" /> 3D Cyber Graph
          </button>
          <button
            onClick={() => setMode3D(false)}
            className={`btn-ghost text-xs flex items-center gap-1.5 ${!mode3D ? 'bg-white/10 text-white' : ''}`}
          >
            <Layers className="h-4 w-4" /> 2D Radial View
          </button>
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
          {busy ? 'Building Graph...' : 'BUILD NETWORK GRAPH'}
        </button>
      </div>

      {busy && <div className="card text-center py-12"><Loader label="Resolving entity relationships & building graph..." /></div>}
      {err && <ErrorBox message={err} />}

      {data && (
        data.nodes.length ? (
          mode3D ? (
            <NetworkGraph3D data={data} />
          ) : (
            <NetworkGraph data={data} />
          )
        ) : (
          <div className="card"><Empty title="No network relationships detected for this account." /></div>
        )
      )}
    </div>
  )
}
