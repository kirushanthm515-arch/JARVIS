import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, getToken, setToken } from '../api/client'
import { translate } from '../i18n'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fs_user') || 'null') } catch { return null }
  })
  const [lang, setLang] = useState(() => localStorage.getItem('fs_lang') || 'en')
  const [theme, setTheme] = useState(() => localStorage.getItem('fs_theme') || 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('fs_theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('fs_lang', lang)
    document.documentElement.lang = lang
  }, [lang])

  const login = useCallback(async (email, password) => {
    const res = await api.login(email, password)
    setToken(res.token)
    localStorage.setItem('fs_user', JSON.stringify(res.user))
    setUser(res.user)
    return res.user
  }, [])

  const signup = useCallback(async (payload) => {
    const res = await api.signup(payload)
    setToken(res.token)
    localStorage.setItem('fs_user', JSON.stringify(res.user))
    setUser(res.user)
    return res.user
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    localStorage.removeItem('fs_user')
    setUser(null)
  }, [])

  const value = useMemo(() => ({
    user, login, signup, logout, isAuthed: !!user && !!getToken(),
    lang, setLang, theme, setTheme,
    toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    t: (key) => translate(lang, key),
  }), [user, login, signup, logout, lang, theme])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
