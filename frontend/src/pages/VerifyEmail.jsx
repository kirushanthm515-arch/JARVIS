import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, ArrowRight, RefreshCw, Globe, Mail } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { api } from '../api/client'
import { LANGUAGES } from '../i18n'
import CyberShield3D from '../components/3d/CyberShield3D'

export default function VerifyEmail() {
  const { t, lang, setLang } = useApp()
  const [params] = useSearchParams()
  const nav = useNavigate()

  const token = params.get('token') || ''
  const [status, setStatus] = useState('verifying') // verifying | success | expired | invalid | already_verified
  const [userEmail, setUserEmail] = useState('')
  const [message, setMessage] = useState('')
  const [resending, setResending] = useState(false)
  const [resendSent, setResendSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    let timer = null
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000)
    }
    return () => clearInterval(timer)
  }, [cooldown])

  useEffect(() => {
    if (!token) {
      setStatus('invalid')
      setMessage(t('verify.invalid'))
      return
    }

    let isMounted = true
    api.verifyEmail(token)
      .then((res) => {
        if (!isMounted) return
        setUserEmail(res.email || '')
        if (res.status === 'already_verified') {
          setStatus('already_verified')
          setMessage(t('verify.alreadyVerified'))
        } else {
          setStatus('success')
          setMessage(t('verify.success'))
        }
      })
      .catch((err) => {
        if (!isMounted) return
        setUserEmail(err.email || '')
        if (err.code === 'expired' || err.message?.includes('expired')) {
          setStatus('expired')
          setMessage(t('verify.expired'))
        } else if (err.code === 'already_verified' || err.message?.includes('already verified')) {
          setStatus('already_verified')
          setMessage(t('verify.alreadyVerified'))
        } else {
          setStatus('invalid')
          setMessage(err.message || t('verify.invalid'))
        }
      })

    return () => { isMounted = false }
  }, [token, t])

  const handleResend = async () => {
    if (!userEmail) return
    setResending(true)
    setResendSent(false)
    try {
      await api.resendVerification(userEmail)
      setResendSent(true)
      setCooldown(30)
    } catch (e) {
      alert(e.message || 'Failed to resend verification email.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="grid-bg relative min-h-screen flex items-center justify-center p-4 lg:p-8 bg-cyber-bg text-slate-100 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl border border-cyan-500/30 bg-cyber-card/90 shadow-glow backdrop-blur-xl overflow-hidden"
      >
        {/* LEFT SIDE: Visual Globe & Status */}
        <div className="lg:col-span-5 relative flex flex-col justify-between p-6 border-b lg:border-b-0 lg:border-r border-cyan-500/20 bg-gradient-to-br from-cyber-panel/60 to-navy-950/80">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Shield className="h-7 w-7" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  COTNEXA
                </span>
                <p className="text-[11px] text-cyan-400/80 font-medium">Real-Time Financial Risk Intelligence Platform</p>
              </div>
            </div>
          </div>

          <div className="my-4 h-56 w-full">
            <CyberShield3D />
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-cyan-500/20 pt-3">
            <span>COTNEXA Security Gateway</span>
            <span className="font-mono text-cyan-400">STATUS: VERIFYING</span>
          </div>
        </div>

        {/* RIGHT SIDE: Verification Status Panel */}
        <div className="lg:col-span-7 flex flex-col justify-center p-6 lg:p-10 bg-cyber-card/60 backdrop-blur-md relative">
          {/* Top Right Language Selector */}
          <div className="absolute top-6 right-6">
            <div className="relative">
              <Globe className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-cyan-400" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="input !w-auto !py-1.5 pl-8 pr-2 text-xs font-bold border-cyan-500/30 bg-cyber-panel text-cyan-300"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-8">
            {status === 'verifying' && (
              <div className="text-center space-y-4 py-8">
                <div className="inline-flex p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 animate-spin">
                  <RefreshCw className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-extrabold text-white">{t('verify.verifying')}</h2>
                <p className="text-xs text-slate-400">Communicating with COTNEXA Security Gateway...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4 py-4">
                <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-white">{t('verify.success')}</h2>
                  <p className="text-xs text-slate-300 mt-1">{message}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-medium">
                  ✓ Your COTNEXA security analyst account is now fully active.
                </div>
                <div className="pt-4">
                  <button
                    onClick={() => nav('/login')}
                    className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                  >
                    {t('verify.continueLogin')} <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {status === 'already_verified' && (
              <div className="space-y-4 py-4">
                <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-white">{t('verify.alreadyVerified')}</h2>
                  <p className="text-xs text-slate-300 mt-1">{message}</p>
                </div>
                <div className="pt-4">
                  <button
                    onClick={() => nav('/login')}
                    className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                  >
                    {t('signup.loginLink')} <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {status === 'expired' && (
              <div className="space-y-4 py-4">
                <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <AlertTriangle className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-white">{t('verify.expired')}</h2>
                  <p className="text-xs text-slate-300 mt-1">{message}</p>
                </div>

                {resendSent && (
                  <div className="p-3 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-xs text-cyan-300 font-bold">
                    ✉️ New verification link sent! Please check your email inbox.
                  </div>
                )}

                <div className="pt-4 space-y-2">
                  {userEmail && (
                    <button
                      onClick={handleResend}
                      disabled={resending || cooldown > 0}
                      className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${resending ? 'animate-spin' : ''}`} />
                      {cooldown > 0 ? `Resend available in ${cooldown}s` : t('verify.resend')}
                    </button>
                  )}
                  <Link to="/login" className="btn-ghost w-full py-2.5 text-xs text-center block text-slate-300">
                    ← {t('verify.backToLogin')}
                  </Link>
                </div>
              </div>
            )}

            {status === 'invalid' && (
              <div className="space-y-4 py-4">
                <div className="inline-flex p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400">
                  <ShieldAlert className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-white">{t('verify.invalid')}</h2>
                  <p className="text-xs text-slate-300 mt-1">{message}</p>
                </div>
                <div className="pt-4 space-y-2">
                  <Link to="/signup" className="btn-primary w-full py-3 text-center block">
                    {t('signup.signupLink')}
                  </Link>
                  <Link to="/login" className="btn-ghost w-full py-2.5 text-xs text-center block text-slate-300">
                    ← {t('verify.backToLogin')}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
