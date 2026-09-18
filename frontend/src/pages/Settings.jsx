import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useApp } from '../context/AppContext'
import { ErrorBox } from '../components/ui'
import { LANGUAGES } from '../i18n'

export default function Settings() {
  const { t, lang, setLang, theme, setTheme } = useApp()
  const [thresholds, setThresholds] = useState(() =>
    JSON.parse(localStorage.getItem('fs_thresholds') || '{"medium":31,"high":71,"critical":86}'))
  const [notify, setNotify] = useState(() => localStorage.getItem('fs_notify') !== 'off')
  const [health, setHealth] = useState(null)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => { api.health().then(setHealth).catch(() => {}) }, [])

  const save = () => {
    localStorage.setItem('fs_thresholds', JSON.stringify(thresholds))
    localStorage.setItem('fs_notify', notify ? 'on' : 'off')
    setMsg('Preferences saved to this browser.')
  }

  const gen = async (mode) => {
    setErr(''); setMsg('')
    try { const r = await api.generate(mode); setMsg(`${r.generated} synthetic ${mode} transactions generated.`) }
    catch (e) { setErr(e.message) }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">{t('nav.settings')}</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card space-y-3">
          <p className="font-bold">Appearance & language</p>
          <div>
            <label className="label">{t('common.language')}</label>
            <select className="input" value={lang} onChange={(e) => setLang(e.target.value)}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t('common.theme')}</label>
            <select className="input" value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="dark">Dark</option><option value="light">Light</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-emerald-500" checked={notify}
              onChange={(e) => setNotify(e.target.checked)} /> Enable alert notifications
          </label>
        </div>

        <div className="card space-y-3">
          <p className="font-bold">Risk thresholds (display)</p>
          {['medium', 'high', 'critical'].map((k) => (
            <div key={k}>
              <label className="label">{k} starts at {thresholds[k]}</label>
              <input type="range" min="10" max="99" value={thresholds[k]} className="w-full accent-emerald-500"
                onChange={(e) => setThresholds({ ...thresholds, [k]: Number(e.target.value) })} />
            </div>
          ))}
          <button className="btn-primary" onClick={save}>Save preferences</button>
          <p className="text-xs text-slate-500">
            The backend scoring bands live in fraud_engine.THRESHOLDS so the engine and the audit trail stay consistent.
          </p>
        </div>

        <div className="card space-y-3">
          <p className="font-bold">Demo data generator</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn-ghost" onClick={() => gen('normal')}>Generate normal transactions</button>
            <button className="btn-ghost" onClick={() => gen('suspicious')}>Generate suspicious transactions</button>
            <button className="btn-ghost" onClick={() => gen('attack')}>Generate fraud attack data</button>
          </div>
          <p className="text-xs text-slate-500">{t('common.demoData')}</p>
        </div>

        <div className="card">
          <p className="mb-3 font-bold">API configuration & system status</p>
          <p className="text-sm text-slate-500">API base: {import.meta.env.VITE_API_URL || '/api (dev proxy)'}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {health && Object.entries(health).filter(([k]) => k !== 'uptime_seconds').map(([k, v]) => (
              <div key={k} className="flex items-center justify-between rounded-xl border border-slate-200/70 px-3 py-2 text-sm dark:border-white/10">
                <span className="capitalize text-slate-500">{k.replace('_', ' ')}</span>
                <span className="font-semibold text-emerald-500">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {msg && <p className="text-sm text-emerald-500">{msg}</p>}
      {err && <ErrorBox message={err} />}
    </div>
  )
}
