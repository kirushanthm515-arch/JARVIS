import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Activity, Bell, Brain, ChevronLeft, CreditCard, FileSearch, Folder, Globe, LayoutDashboard,
  LogOut, Menu, Moon, RefreshCw, Search, Share2, Shield, ShieldAlert, Smartphone, Sun, Users, Zap
} from 'lucide-react'
import { api } from '../api/client'
import { useApp } from '../context/AppContext'
import { LANGUAGES } from '../i18n'

const NAV = [
  ['/app', LayoutDashboard, 'nav.dashboard', true],
  ['/app/analyze', Search, 'nav.analyze'],
  ['/app/transactions', CreditCard, 'nav.transactions'],
  ['/app/accounts', Users, 'nav.accounts'],
  ['/app/upi', Smartphone, 'nav.upi'],
  ['/app/alerts', ShieldAlert, 'nav.alerts'],
  ['/app/network', Share2, 'nav.network'],
  ['/app/investigations', Folder, 'nav.investigations'],
  ['/app/analytics', Activity, 'nav.analytics'],
  ['/app/map', Globe, 'nav.map'],
  ['/app/simulator', Zap, 'nav.simulator'],
  ['/app/assistant', Brain, 'nav.assistant'],
  ['/app/security', Shield, 'nav.security'],
  ['/app/settings', FileSearch, 'nav.settings'],
]

export default function Layout({ children }) {
  const { t, lang, setLang, theme, toggleTheme, user, logout } = useApp()
  const [open, setOpen] = useState(false)
  const [health, setHealth] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [showAlerts, setShowAlerts] = useState(false)
  const [genBusy, setGenBusy] = useState(false)
  const nav = useNavigate()

  useEffect(() => {
    const load = () => {
      api.health().then(setHealth).catch(() => setHealth(null))
      api.alerts().then((a) => setAlerts(a.filter((x) => !x.read).slice(0, 6))).catch(() => {})
    }
    load()
    const id = setInterval(load, 15000)
    return () => clearInterval(id)
  }, [])

  const handleGenDemoData = async () => {
    setGenBusy(true)
    try {
      await api.generate('suspicious')
      const unread = await api.alerts()
      setAlerts(unread.filter((x) => !x.read).slice(0, 6))
      window.location.reload()
    } catch (e) {
      alert('Failed to generate demo data: ' + e.message)
    } finally {
      setGenBusy(false)
    }
  }

  const signOut = () => { logout(); nav('/login') }

  return (
    <div className="min-h-screen lg:flex bg-cyber-bg text-slate-100">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-cyan-500/20 bg-cyber-card/95 backdrop-blur-xl text-slate-200
        transition-transform duration-300 lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-5 border-b border-cyan-500/20">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                COTNEXA
              </span>
              <p className="text-[10px] font-mono text-cyan-400/70">CYBER DEFENSE</p>
            </div>
          </div>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setOpen(false)} aria-label="Close menu">
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1 px-3 py-4 overflow-y-auto max-h-[calc(100vh-230px)]">
          {NAV.map(([to, Icon, key, end]) => (
            <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all
                ${isActive 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
              <Icon className="h-4 w-4" /> {t(key)}
            </NavLink>
          ))}
        </nav>

        {/* Live System Health Box */}
        <div className="mx-3 my-3 rounded-xl border border-cyan-500/20 bg-cyber-panel/80 p-3 text-[11px]">
          <p className="mb-2 font-bold uppercase tracking-wider text-cyan-400 flex items-center justify-between">
            <span>{t('telemetry.title')}</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
            </span>
          </p>
          {[
            ['backend', 'telemetry.backend'],
            ['database', 'telemetry.database'],
            ['ml_model', 'telemetry.mlModel'],
            ['fraud_engine', 'telemetry.fraudEngine'],
            ['ai_assistant', 'telemetry.aiAssistant']
          ].map(([k, tKey]) => (
            <div key={k} className="flex items-center justify-between py-0.5">
              <span className="capitalize text-slate-400 font-mono text-[10px]">{t(tKey)}</span>
              <span className="flex items-center gap-1.5 font-extrabold text-[10px]">
                <span className={`h-1.5 w-1.5 rounded-full ${health?.[k] === 'ONLINE' || health?.[k] === 'READY' ? 'bg-cyan-400' : 'bg-amber-400'}`} />
                <span className={health?.[k] === 'ONLINE' || health?.[k] === 'READY' ? 'text-cyan-400 font-bold' : 'text-amber-400'}>
                  {health?.[k] === 'READY' ? t('telemetry.ready') : t('telemetry.online')}
                </span>
              </span>
            </div>
          ))}
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-cyan-500/20 bg-cyber-card/90
          px-4 py-3 backdrop-blur-md">
          <button className="lg:hidden text-cyan-400" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0 hidden sm:block">
            <p className="truncate text-sm font-extrabold tracking-tight text-white">COTNEXA // CYBER DEFENSE COMMAND</p>
            <p className="truncate text-[11px] text-cyan-400/80 font-mono">Real-Time Financial Risk Intelligence Platform</p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Quick Demo Data Generator Button */}
            <button
              onClick={handleGenDemoData}
              disabled={genBusy}
              title="Generate Synthetic Transactions"
              className="btn-cyber !px-2.5 !py-1.5 text-xs font-bold flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${genBusy ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">{t('dashboard.genDemoData')}</span>
            </button>

            {/* Language Selector */}
            <div className="relative">
              <Globe className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-cyan-400" />
              <select value={lang} onChange={(e) => setLang(e.target.value)} title="Language"
                className="input !w-auto !py-1.5 pl-8 pr-2 text-xs font-bold border-cyan-500/30 bg-cyber-panel">
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
              </select>
            </div>

            {/* Alert Notifications Bell */}
            <button className="btn-ghost !px-2.5 !py-1.5 relative border-cyan-500/30" onClick={() => setShowAlerts((v) => !v)} title="Alerts">
              <Bell className="h-4 w-4 text-cyan-400" />
              {alerts.length > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white shadow-glowRed">
                  {alerts.length}
                </span>
              )}
            </button>

            {/* Dark / Light Theme Toggle */}
            <button className="btn-ghost !px-2.5 !py-1.5 border-cyan-500/30" onClick={toggleTheme} title="Theme">
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-cyan-400" />}
            </button>

            {/* User Profile & Logout */}
            <div className="hidden items-center gap-2 sm:flex ml-1">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-xs font-bold text-cyan-300">
                {(user?.name || 'A').slice(0, 1)}
              </div>
              <button className="btn-ghost !px-2.5 !py-1.5 border-cyan-500/30 text-red-400 hover:bg-red-500/10" onClick={signOut} title={t('nav.logout')}>
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

          {showAlerts && (
            <div className="absolute right-4 top-14 w-80 animate-slideIn rounded-2xl border border-cyan-500/40 bg-cyber-panel p-4 shadow-glow z-50">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-cyan-400">{t('nav.alerts')}</p>
              {alerts.length === 0 && <p className="py-3 text-sm text-slate-400">No unread alerts.</p>}
              {alerts.map((a) => (
                <button key={a.id} onClick={() => { api.readAlert(a.id); setShowAlerts(false); nav('/app/alerts') }}
                  className="block w-full rounded-xl px-3 py-2.5 text-left text-xs hover:bg-white/5 border border-transparent hover:border-cyan-500/30 transition mb-1.5">
                  <span className="font-bold flex items-center gap-1.5 text-slate-100">
                    {a.level === 'CRITICAL' ? '🔴' : '🟠'} {a.title}
                  </span>
                  <span className="block text-[11px] font-mono text-cyan-400/80 mt-0.5">{a.txn_id}</span>
                </button>
              ))}
            </div>
          )}
        </header>

        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
