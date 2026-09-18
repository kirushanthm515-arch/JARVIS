import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { Loader } from './components/ui'
import { useApp } from './context/AppContext'

const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Analyze = lazy(() => import('./pages/Analyze'))
const Transactions = lazy(() => import('./pages/Transactions'))
const Accounts = lazy(() => import('./pages/Accounts'))
const Upi = lazy(() => import('./pages/Upi'))
const Alerts = lazy(() => import('./pages/Alerts'))
const Network = lazy(() => import('./pages/Network'))
const Analytics = lazy(() => import('./pages/Analytics'))
const MapPage = lazy(() => import('./pages/MapPage'))
const Simulator = lazy(() => import('./pages/Simulator'))
const Assistant = lazy(() => import('./pages/Assistant'))
const Investigations = lazy(() => import('./pages/Investigations'))
const Security = lazy(() => import('./pages/Security'))
const Settings = lazy(() => import('./pages/Settings'))

function Private({ children }) {
  const { isAuthed } = useApp()
  return isAuthed ? <Layout>{children}</Layout> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-cyber-bg text-cyan-400"><Loader label="Loading COTNEXA Portal..." /></div>}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/verify" element={<VerifyEmail />} />
        <Route path="/app" element={<Private><Dashboard /></Private>} />
        <Route path="/app/analyze" element={<Private><Analyze /></Private>} />
        <Route path="/app/transactions" element={<Private><Transactions /></Private>} />
        <Route path="/app/accounts" element={<Private><Accounts /></Private>} />
        <Route path="/app/upi" element={<Private><Upi /></Private>} />
        <Route path="/app/alerts" element={<Private><Alerts /></Private>} />
        <Route path="/app/network" element={<Private><Network /></Private>} />
        <Route path="/app/analytics" element={<Private><Analytics /></Private>} />
        <Route path="/app/map" element={<Private><MapPage /></Private>} />
        <Route path="/app/simulator" element={<Private><Simulator /></Private>} />
        <Route path="/app/assistant" element={<Private><Assistant /></Private>} />
        <Route path="/app/investigations" element={<Private><Investigations /></Private>} />
        <Route path="/app/security" element={<Private><Security /></Private>} />
        <Route path="/app/settings" element={<Private><Settings /></Private>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
