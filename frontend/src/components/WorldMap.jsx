import React, { useState } from 'react'
import { MapPin, Globe, ShieldAlert } from 'lucide-react'

const LOCATIONS = [
  { name: 'Chennai', lat: '13.0827', lng: '80.2707', x: 70, y: 56, risk: 'HIGH', txns: 42, alert: 'High Velocity Spike' },
  { name: 'Coimbatore', lat: '11.0168', lng: '76.9558', x: 67, y: 59, risk: 'LOW', txns: 28, alert: 'Normal Activity' },
  { name: 'Bangalore', lat: '12.9716', lng: '77.5946', x: 68, y: 58, risk: 'MEDIUM', txns: 35, alert: 'Device Sharing' },
  { name: 'Mumbai', lat: '19.0760', lng: '72.8777', x: 63, y: 52, risk: 'CRITICAL', txns: 51, alert: 'Suspicious Network' },
  { name: 'Delhi', lat: '28.7041', lng: '77.1025', x: 66, y: 44, risk: 'HIGH', txns: 39, alert: 'Location Jump' },
  { name: 'Hyderabad', lat: '17.3850', lng: '78.4867', x: 67, y: 53, risk: 'MEDIUM', txns: 22, alert: 'Odd Hour Activity' },
  { name: 'Dubai', lat: '25.2048', lng: '55.2708', x: 53, y: 46, risk: 'HIGH', txns: 19, alert: 'International Anomaly' },
  { name: 'Singapore', lat: '1.3521', lng: '103.8198', x: 80, y: 64, risk: 'LOW', txns: 14, alert: 'Verified Relay' },
  { name: 'London', lat: '51.5074', lng: '-0.1278', x: 38, y: 32, risk: 'CRITICAL', txns: 8, alert: 'High Value Transfer' },
]

export default function WorldMap() {
  const [selected, setSelected] = useState(LOCATIONS[0])

  return (
    <div className="card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/20 pb-3">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Globe className="h-5 w-5 text-cyan-400" /> Live Threat Map (Simulated Feed)
          </h2>
          <p className="text-xs text-slate-400">
            Real-time geographical transaction origin monitoring across key financial hubs
          </p>
        </div>
        <span className="chip bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
          DEMO DATA FEED ACTIVE
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Map Canvas Visualizer */}
        <div className="lg:col-span-8 relative h-[360px] rounded-2xl border border-cyan-500/30 bg-cyber-dark overflow-hidden scanline flex items-center justify-center">
          {/* Cyber World Map SVG background overlay */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-20 stroke-cyan-500 fill-none" strokeWidth="0.3">
            <path d="M 20,30 Q 35,20 50,30 T 80,30 T 90,60 T 60,70 T 30,65 Z" />
            <path d="M 60,45 Q 70,40 75,55 T 65,70 Z" />
            <circle cx="50" cy="50" r="45" strokeDasharray="2 2" />
          </svg>

          {/* Interactive Location Markers */}
          {LOCATIONS.map((loc) => {
            const isSelected = selected.name === loc.name
            const isCrit = loc.risk === 'CRITICAL' || loc.risk === 'HIGH'

            return (
              <div
                key={loc.name}
                style={{ top: `${loc.y}%`, left: `${loc.x}%` }}
                onClick={() => setSelected(loc)}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              >
                <div className="relative flex items-center justify-center">
                  <span
                    className={`absolute rounded-full h-8 w-8 animate-ping opacity-75 ${
                      isCrit ? 'bg-red-500' : 'bg-cyan-400'
                    }`}
                  />
                  <span
                    className={`relative rounded-full h-3.5 w-3.5 border-2 border-white ${
                      isCrit ? 'bg-red-500 shadow-glowRed' : 'bg-cyan-400 shadow-glow'
                    } ${isSelected ? 'scale-125 ring-4 ring-cyan-400/40' : ''}`}
                  />
                </div>
                <div className="hidden group-hover:block absolute top-5 left-1/2 -translate-x-1/2 bg-cyber-panel/95 backdrop-blur border border-cyan-500/40 rounded px-2 py-1 text-[10px] font-bold text-white whitespace-nowrap z-20">
                  {loc.name} ({loc.risk})
                </div>
              </div>
            )
          })}
        </div>

        {/* Selected Hub Intelligence Card */}
        <div className="lg:col-span-4 card-glow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-cyan-500/20 pb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-400">Hub Telemetry</span>
              <span
                className={`chip ${
                  selected.risk === 'CRITICAL'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : selected.risk === 'HIGH'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}
              >
                {selected.risk} RISK
              </span>
            </div>

            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-cyan-400" /> {selected.name}
            </h3>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Coordinates: {selected.lat}° N, {selected.lng}° E
            </p>

            <div className="mt-4 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Recent Activity Volume:</span>
                <span className="font-bold text-white">{selected.txns} Transactions/hr</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Primary Signal Alert:</span>
                <span className="font-bold text-cyan-300">{selected.alert}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Status:</span>
                <span className="font-bold text-emerald-400">ACTIVE MONITORING</span>
              </div>
            </div>
          </div>

          <div className="mt-4 text-[11px] text-slate-400 italic bg-cyan-500/5 border border-cyan-500/10 p-2.5 rounded-xl">
            Notice: Map location indicators reflect simulated transaction activity for hackathon demonstration.
          </div>
        </div>
      </div>
    </div>
  )
}
