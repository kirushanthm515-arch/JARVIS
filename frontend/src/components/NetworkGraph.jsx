import { useMemo, useState } from 'react'
import { RISK_HEX } from './ui'

const TONE = { account: '#38bdf8', upi: '#a78bfa', device: '#f59e0b' }

/** Radial layout: root in the centre, everything else on rings by hop distance. */
export default function NetworkGraph({ data, height = 460 }) {
  const [selected, setSelected] = useState(null)
  const W = 760, H = height

  const positions = useMemo(() => {
    if (!data?.nodes?.length) return {}
    const root = data.nodes.find((n) => n.root) || data.nodes[0]
    const adj = {}
    data.edges.forEach((e) => {
      (adj[e.source] ||= []).push(e.target)
      ;(adj[e.target] ||= []).push(e.source)
    })
    const depth = { [root.id]: 0 }
    const queue = [root.id]
    while (queue.length) {
      const id = queue.shift()
      for (const nb of adj[id] || []) if (depth[nb] === undefined) { depth[nb] = depth[id] + 1; queue.push(nb) }
    }
    const rings = {}
    data.nodes.forEach((n) => { const d = depth[n.id] ?? 3; (rings[d] ||= []).push(n.id) })
    const pos = {}
    Object.entries(rings).forEach(([d, ids]) => {
      const radius = Number(d) * 115
      ids.forEach((id, i) => {
        const a = (i / ids.length) * Math.PI * 2 - Math.PI / 2
        pos[id] = { x: W / 2 + radius * Math.cos(a), y: H / 2 + radius * Math.sin(a) * 0.82 }
      })
    })
    return pos
  }, [data, H])

  if (!data?.nodes?.length) return null
  const node = data.nodes.find((n) => n.id === selected)

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
      <div className="overflow-x-auto rounded-2xl border border-slate-200/70 dark:border-white/10">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 620 }}>
          {data.edges.map((e, i) => {
            const a = positions[e.source], b = positions[e.target]
            if (!a || !b) return null
            return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={e.suspicious ? '#f43f5e' : 'rgba(148,163,184,.45)'}
              strokeWidth={e.suspicious ? 2.5 : 1.4} strokeDasharray={e.suspicious ? '6 4' : ''} />
          })}
          {data.nodes.map((n) => {
            const p = positions[n.id]
            if (!p) return null
            const risky = (n.risk || 0) >= 70
            return (
              <g key={n.id} onClick={() => setSelected(n.id)} className="cursor-pointer">
                <circle cx={p.x} cy={p.y} r={n.root ? 26 : 18}
                  fill={risky ? RISK_HEX.CRITICAL : TONE[n.type]} fillOpacity={selected === n.id ? 1 : 0.85}
                  stroke={selected === n.id ? '#10b981' : 'rgba(255,255,255,.5)'} strokeWidth={selected === n.id ? 3 : 1.5} />
                <text x={p.x} y={p.y + (n.root ? 44 : 34)} textAnchor="middle"
                  className="fill-slate-500 text-[11px]">{n.label}</text>
              </g>
            )
          })}
        </svg>
      </div>
      <div className="card">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Node details</p>
        {!node ? <p className="text-sm text-slate-500">Click any node to inspect it.</p> : (
          <div className="space-y-1 text-sm">
            <p className="font-bold">{node.label}</p>
            <p className="text-slate-500">Type: {node.type}</p>
            <p className="text-slate-500">Max risk observed: {node.risk || 0}/100</p>
            <p className="text-slate-500">
              Connections: {data.edges.filter((e) => e.source === node.id || e.target === node.id).length}
            </p>
          </div>
        )}
        <div className="mt-4 space-y-1 text-xs text-slate-500">
          <p><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: TONE.account }} />Account</p>
          <p><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: TONE.upi }} />UPI ID</p>
          <p><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: TONE.device }} />Device</p>
          <p><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: RISK_HEX.CRITICAL }} />Flagged entity</p>
        </div>
      </div>
    </div>
  )
}
