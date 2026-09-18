import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Eye, EyeOff, Lock, Mail, Shield, User, CheckCircle2,
  ArrowRight, Globe, Cpu, Radio, Sparkles, Inbox, RefreshCw
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { api } from '../api/client'
import { ErrorBox } from '../components/ui'
import { LANGUAGES } from '../i18n'
import CyberShield3D from '../components/3d/CyberShield3D'
import StartupOverlay from '../components/StartupOverlay'

export default function Signup() {
  const { t, lang, setLang } = useApp()
  const nav = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'analyst' })
  const [showPw, setShowPw] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [verifyUrl, setVerifyUrl] = useState('')
  const [verifyToken, setVerifyToken] = useState('')

  const handleSignup = async (e) => {
    if (e) e.preventDefault()
    setErr('')

    const email = form.email.trim()
    if (!form.name.trim()) return setErr('Please enter your full name.')
    if (!email || !email.includes('@')) return setErr('Please enter a valid email address.')
    if (form.password.length < 6) return setErr('Password must be at least 6 characters.')

    setBusy(true)
    try {
      const res = await api.signup({
        name: form.name.trim(),
        email: email,
        password: form.password,
        role: form.role
      })
      setSubmitted(true)
      if (res.verify_url) setVerifyUrl(res.verify_url)
      if (res.verify_token) setVerifyToken(res.verify_token)
    } catch (e) {
      setErr(e.message || 'Account registration failed. Please try again.')
    } finally {
      setBusy(false)
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

              {/* Language Switcher Dropdown */}
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

            {/* Live Security Badges */}
            <div className="mt-6 flex flex-wrap gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[11px] font-bold text-cyan-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
                </span>
                ● GATEWAY ACTIVE
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-[11px] font-bold text-purple-300">
                <Cpu className="h-3 w-3" />
                ● EMAIL VERIFICATION ENGINE
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-emerald-300">
                <Radio className="h-3 w-3" />
                ● ZERO TRUST REGISTRATION
              </div>
            </div>
          </div>

          {/* Interactive 3D Canvas */}
          <div className="my-4 h-60 lg:h-64 w-full">
            <CyberShield3D />
          </div>

          <div className="text-xs text-slate-400 flex items-center justify-between border-t border-cyan-500/20 pt-4">
            <span>COTNEXA Security Portal v2.4</span>
            <span className="font-mono text-cyan-400">EMAIL VERIFICATION ENFORCED</span>
          </div>
        </div>

        {/* RIGHT SIDE: Signup Form */}
        <div className="lg:col-span-6 flex flex-col justify-center p-6 lg:p-10 bg-cyber-card/60 backdrop-blur-md">
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">{t('signup.title')}</h1>
            <p className="text-xs text-slate-400 mt-1">{t('signup.subtitle')}</p>
          </div>

          {err && (
            <div className="mb-4">
              <ErrorBox message={err} />
            </div>
          )}

          {submitted ? (
            <div className="space-y-4">
              <div className="rounded-2xl border-2 border-cyan-400/80 bg-gradient-to-r from-cyan-950/90 to-slate-900/90 p-5 shadow-glow space-y-3">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm border-b border-cyan-500/30 pb-2">
                  <Inbox className="h-5 w-5 text-cyan-400 animate-bounce" />
                  {t('signup.verificationSentTitle')}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {t('signup.verificationSentSub')} <strong className="text-white font-mono">{form.email}</strong>.
                </p>
                <p className="text-[11px] text-slate-400">
                  Please click the link inside the email to verify your COTNEXA account before signing in.
                </p>

                {verifyToken && (
                  <div className="mt-3 pt-3 border-t border-cyan-500/20">
                    <button
                      onClick={() => nav(`/verify-email?token=${verifyToken}`)}
                      className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      ⚡ Auto-Verify Account (Development Mode)
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Link to="/login" className="btn-ghost w-full py-3 text-center block text-xs font-bold text-cyan-300">
                  {t('signup.loginLink')} →
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="label">{t('signup.name')}</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-cyan-400/70" />
                  <input
                    required
                    className="input pl-10"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Kiruthika Security"
                  />
                </div>
              </div>

              <div>
                <label className="label">{t('login.email')}</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-cyan-400/70" />
                  <input
                    required
                    type="email"
                    className="input pl-10"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="analyst@cotnexa.ai"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">{t('signup.role')}</label>
                  <select
                    className="input font-bold border-cyan-500/30 bg-cyber-panel text-cyan-300"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    <option value="analyst">Analyst</option>
                    <option value="investigator">Investigator</option>
                    <option value="admin">Risk Admin</option>
                  </select>
                </div>

                <div>
                  <label className="label">{t('login.password')}</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-cyan-400/70" />
                    <input
                      required
                      type={showPw ? 'text' : 'password'}
                      className="input pl-10 pr-9"
                      value={form.password}
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
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                  disabled={busy}
                >
                  {busy ? (
                    'CREATING ACCOUNT...'
                  ) : (
                    <>
                      {t('signup.signupLink')} <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Bottom Navigation Link */}
              <div className="mt-6 text-center border-t border-cyan-500/20 pt-4 text-xs text-slate-400">
                {t('signup.haveAccount')}{' '}
                <Link to="/login" className="font-bold text-cyan-400 hover:underline">
                  {t('signup.loginLink')}
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
