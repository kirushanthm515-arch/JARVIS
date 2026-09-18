import { useRef, useState } from 'react'
import { Send, Brain, Bot, User, Sparkles } from 'lucide-react'
import { api } from '../api/client'
import { useApp } from '../context/AppContext'
import { ErrorBox, Loader } from '../components/ui'

const SUGGESTIONS = [
  'Show suspicious transactions today.',
  'Why is account ACC1001 high risk?',
  'Show transactions with high velocity.',
  'Which signals does the engine use?',
  'Explain connected accounts for ACC1001.',
  'Summarize latest alerts.'
]

export default function Assistant() {
  const { t } = useApp()
  const [msgs, setMsgs] = useState([{
    role: 'bot',
    answer: 'Welcome to COTNEXA AI Assistant. I strictly analyze evidence and data records stored in the database to answer your forensic questions.',
    details: [
      'Query transaction IDs (e.g. TXN-10001)',
      'Analyze accounts (e.g. ACC1001)',
      'Evaluate UPI handles (e.g. demo@upi)',
      'Inspect velocity trends & alert summaries'
    ],
    grounded_in: 'local SQLite database & ML engine'
  }])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const endRef = useRef(null)

  const send = async (text) => {
    const question = (text ?? q).trim()
    if (!question) return
    setMsgs((m) => [...m, { role: 'user', answer: question }])
    setQ('')
    setBusy(true)
    setErr('')
    try {
      const res = await api.ask(question)
      setMsgs((m) => [...m, { role: 'bot', ...res }])
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-400" />
            AI Investigation Assistant
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Grounded evidence reasoning copilot for fraud analysts (No invented records)
          </p>
        </div>
      </div>

      <div className="card flex h-[65vh] flex-col space-y-4">
        <div className="flex-1 space-y-4 overflow-y-auto pr-2">
          {msgs.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-2xl p-4 text-xs space-y-2 animate-slideIn ${
                m.role === 'user'
                  ? 'ml-auto bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 text-cyan-200'
                  : 'bg-cyber-panel/90 border border-cyan-500/20 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 border-b border-white/10 pb-1.5 font-bold">
                {m.role === 'user' ? (
                  <>
                    <User className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Investigator Question</span>
                  </>
                ) : (
                  <>
                    <Bot className="h-3.5 w-3.5 text-purple-400" />
                    <span className="text-purple-300">FraudShield AI Forensic Assistant</span>
                  </>
                )}
              </div>

              <p className="text-sm font-semibold leading-relaxed text-white">{m.answer}</p>

              {m.details?.length > 0 && (
                <ul className="space-y-1 text-slate-300 pt-1">
                  {m.details.map((d, j) => (
                    <li key={j} className="flex items-start gap-1.5">
                      <span className="text-cyan-400 font-bold">•</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              )}

              {m.role === 'bot' && m.grounded_in && (
                <p className="pt-2 text-[10px] uppercase font-mono tracking-wider text-cyan-400/80">
                  Grounding Source: {m.grounded_in}
                </p>
              )}
            </div>
          ))}
          {busy && <Loader label="Evaluating database evidence..." />}
          <div ref={endRef} />
        </div>

        {err && <ErrorBox message={err} />}

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-cyan-500/20">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              className="btn-cyber !py-1 !px-2.5 text-[11px] font-medium"
              onClick={() => send(s)}
              disabled={busy}
            >
              <Sparkles className="h-3 w-3 text-cyan-400" /> {s}
            </button>
          ))}
        </div>

        {/* Input prompt */}
        <div className="flex gap-2">
          <input
            className="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={t('placeholder.assistant')}
          />
          <button className="btn-primary" onClick={() => send()} disabled={busy}>
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
