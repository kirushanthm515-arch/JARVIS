import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, Mail, Shield, ShieldCheck, Activity, Cpu, Radio, Globe, RefreshCw, MailWarning, Sparkles } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { api } from '../api/client'
import { ErrorBox } from '../components/ui'
import { LANGUAGES } from '../i18n'
import CyberShield3D from '../components/3d/CyberShield3D'
import StartupOverlay from '../components/StartupOverlay'

const DEMO = { email: 'analyst@fraudshield.ai', password: 'demo1234' }

export default function Login() {
  const { t, login, lang, setLang } = useApp()
  const nav = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', remember: true })
  const [showPw, setShowPw] = useState(false)
  const [err, setErr] = useState('')
  const [unverifiedEmail, setUnverifiedEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState('')
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    let timer = null
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000)
    }
    return () => clearInterval(timer)
  }, [cooldown])

  const submit = async (creds) => {
    setErr('')
    setUnverifiedEmail('')
    setResendMsg('')
    setBusy(true)
    try {
      await login(creds.email.trim(), creds.password)
      setSuccess(true)
      setTimeout(() => nav('/app'), 600)
    } catch (e) {
      if (e.code === 'unverified' || e.message?.toLowerCase().includes('verify')) {
        setUnverifiedEmail(creds.email.trim())
        setErr(e.message || t('login.unverifiedNotice'))
      } else {
        setErr(e.message || 'Authentication failed. Is the backend running?')
      }
    } finally {
      setBusy(false)
    }
  }

  const handleResend = async () => {
    if (!unverifiedEmail) return
    setResending(true)
    setResendMsg('')
    try {
      const res = await api.resendVerification(unverifiedEmail)
      setResendMsg(res.message || 'Verification email resent!')
      setCooldown(30)
    } catch (e) {
      setResendMsg('Failed to resend email: ' + e.message)
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="grid-bg relative min-h-screen flex items-center justify-center p-4 lg:p-8 bg-cyber-bg text-slate-100 overflow-hidden">
      <StartupOverlay />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl border border-cyan-500/30 bg-cyber-card/90 shadow-glow backdrop-blur-xl overflow-hidden"
      >
        {/* LEFT SIDE: 3D Visualization & Status */}
        <div className="lg:col-span-6 relative flex flex-col justify-between p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-cyan-500/20 bg-gradient-to-br from-cyber-panel/60 to-navy-950/80">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Shield className="h-7 w-7" />
                </div>
                <div>
                  <span className="font-extrabold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                    COTNEXA
                  </span>
                  <p className="text-xs text-cyan-400/80 font-medium">Real-Time Financial Risk Intelligence Platform</p>
                </div>
              </div>

              {/* Language Selector Dropdown */}
              <div className="relative">
                <Globe className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-cyan-400" />
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="input !w-auto !py-1.5 pl-8 pr-2 text-xs font-bold border-cyan-500/30 bg-cyber-panel/90 text-cyan-300"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Security Status Badges */}
            <div className="mt-6 flex flex-wrap gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[11px] font-bold text-cyan-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
                </span>
                ● SYSTEM ONLINE
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-[11px] font-bold text-purple-300">
                <Cpu className="h-3 w-3" />
                ● AI ENGINE ACTIVE
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-[11px] font-bold text-blue-300">
                <Radio className="h-3 w-3" />
                ● THREAT MONITORING ACTIVE
              </div>
            </div>
          </div>

          {/* Interactive 3D Canvas */}
          <div className="my-4 h-64 lg:h-72 w-full">
            <CyberShield3D />
          </div>

          <div className="text-xs text-slate-400 flex items-center justify-between border-t border-cyan-500/20 pt-4">
            <span>COTNEXA Security Gateway v2.4</span>
            <span className="font-mono text-cyan-400">STATUS: PROTECTED</span>
          </div>
        </div>

        {/* RIGHT SIDE: Glassmorphism Login Panel */}
        <div className="lg:col-span-6 flex flex-col justify-center p-6 lg:p-10 bg-cyber-card/60 backdrop-blur-md">
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">{t('login.title')}</h1>
            <p className="text-xs text-slate-400 mt-1">Authenticate into COTNEXA Command Portal</p>
          </div>

          {err && (
            <div className="mb-4">
              <ErrorBox message={err} />
            </div>
          )}

          {unverifiedEmail && (
            <div className="mb-4 p-3.5 rounded-2xl border border-amber-500/40 bg-amber-500/10 space-y-2 text-xs">
              <p className="font-bold text-amber-300 flex items-center gap-1.5">
                <MailWarning className="h-4 w-4" /> {t('login.unverifiedNotice')}
              </p>
              {resendMsg && (
                <p className="text-cyan-300 font-bold">{resendMsg}</p>
              )}
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || cooldown > 0}
                className="btn-cyber w-full !py-2 text-xs flex items-center justify-center gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} />
                {cooldown > 0 ? `Resend available in ${cooldown}s` : t('verify.resend')}
              </button>
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-3 text-xs text-emerald-300 font-bold animate-pulse">
              ✓ Authentication successful! Entering COTNEXA Command Center...
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="label">{t('login.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-cyan-400/70" />
                <input
                  className="input pl-10"
                  value={form.email}
                  autoComplete="username"
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="analyst@cotnexa.ai or demo"
                />
              </div>
            </div>

            <div>
              <label className="label">{t('login.password')}</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-cyan-400/70" />
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pl-10 pr-10"
                  value={form.password}
                  autoComplete="current-password"
                  onKeyDown={(e) => e.key === 'Enter' && submit(form)}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-cyan-400"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.remember}
                  className="accent-cyan-500 rounded"
                  onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                />
                {t('login.remember')}
              </label>
              <button
                type="button"
                className="text-cyan-400 hover:underline"
                onClick={() => setErr('Demo environment active. Use the INSTANT DEMO LOGIN button below.')}
              >
                {t('login.forgot')}
              </button>
            </div>

            <div className="pt-2 space-y-3">
              <button
                className="btn-primary w-full py-3"
                disabled={busy}
                onClick={() => submit(form)}
              >
                {busy ? 'AUTHENTICATING...' : t('login.signin')}
              </button>

              <button
                className="btn-cyber w-full py-3"
                disabled={busy}
                onClick={() => submit(DEMO)}
              >
                ⚡ INSTANT DEMO LOGIN
              </button>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-3.5 text-xs text-cyan-200">
            <p className="flex items-center gap-2 font-bold text-cyan-300">
              <ShieldCheck className="h-4 w-4" /> Verified DB Authentication Active
            </p>
            <p className="mt-1 text-[11px] text-slate-300">
              User: <code className="text-cyan-300">analyst@fraudshield.ai</code> | Pass: <code className="text-cyan-300">demo1234</code>
            </p>
          </div>

          <div className="mt-6 text-center border-t border-cyan-500/20 pt-4 text-xs text-slate-400">
            {t('signup.noAccount')}{' '}
            <Link to="/signup" className="font-bold text-cyan-400 hover:underline">
              {t('signup.signupLink')}
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
