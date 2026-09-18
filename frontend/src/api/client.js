// Single API service layer. No secrets live here - the JWT is issued by the backend.
const BASE = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'fs_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY))

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth && getToken()) headers.Authorization = `Bearer ${getToken()}`
  let res
  try {
    res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined })
  } catch {
    throw new Error('Cannot reach the COTNEXA API. Is the backend running on port 5000?')
  }
  let data = null
  try { data = await res.json() } catch { data = null }
  if (!res.ok) {
    if (res.status === 401 && path !== '/login') setToken(null)
    const err = new Error(data?.message || data?.error || `Request failed (${res.status}).`)
    err.status = res.status
    err.code = data?.error
    throw err
  }
  return data
}

export const api = {
  login: (email, password) => request('/login', { method: 'POST', body: { email, password }, auth: false }),
  signup: (payload) => request('/signup', { method: 'POST', body: payload, auth: false }),
  verifyEmail: (token) => request('/auth/verify-email', { method: 'POST', body: { token }, auth: false }),
  resendVerification: (email) => request('/auth/resend-verification', { method: 'POST', body: { email }, auth: false }),
  sendOtp: (email) => request('/auth/send-otp', { method: 'POST', body: { email }, auth: false }),
  verifyOtp: (email, code) => request('/auth/verify-otp', { method: 'POST', body: { email, code }, auth: false }),
  health: () => request('/health', { auth: false }),
  dashboard: () => request('/dashboard'),
  analytics: () => request('/analytics'),
  transactions: (params = '') => request(`/transactions${params}`),
  transaction: (id) => request(`/transaction/${id}`),
  check: (payload) => request('/transaction/check', { method: 'POST', body: payload }),
  act: (id, action) => request(`/transaction/${id}/action`, { method: 'POST', body: { action } }),
  account: (id) => request(`/account/${encodeURIComponent(id)}`),
  upi: (id) => request(`/upi/${encodeURIComponent(id)}`),
  network: (id) => request(`/network/${encodeURIComponent(id)}`),
  alerts: () => request('/alerts'),
  readAlert: (id) => request(`/alerts/${id}/read`, { method: 'POST' }),
  cases: () => request('/investigations'),
  createCase: (txn_id, notes) => request('/investigation', { method: 'POST', body: { txn_id, notes } }),
  updateCase: (id, status, notes) => request(`/investigation/${id}`, { method: 'PATCH', body: { status, notes } }),
  ask: (question) => request('/assistant', { method: 'POST', body: { question } }),
  generate: (mode) => request('/demo/generate', { method: 'POST', body: { mode } }),
  simulateAttack: () => request('/demo/simulate-attack', { method: 'POST' }),
  security: () => request('/security'),
  trainMl: () => request('/ml/train', { method: 'POST' }),
}

