import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Shield, TrendingUp, Lock, Loader2, ArrowRight, Globe, Landmark, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'

const features = [
  { icon: Shield, title: 'Bank-Grade Security', desc: 'Multi-factor authentication with real-time fraud monitoring' },
  { icon: TrendingUp, title: 'Smart Banking', desc: 'Double-entry ledger, automated instruments, comprehensive reporting' },
  { icon: Lock, title: 'Regulatory Compliance', desc: 'KYC/AML controls, immutable audit trails, maker-checker workflows' },
]

const stats = [
  { value: '$2.4B', label: 'Assets Under Management' },
  { value: '15K+', label: 'Active Accounts' },
  { value: '99.99%', label: 'System Uptime' },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState({})
  const [mounted, setMounted] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { setMounted(true) }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await login(email, password)
      if (data.otp_required) {
        toast.success('OTP sent to your email')
        if (data.dev_otp) {
          toast(`Dev OTP: ${data.dev_otp}`, { duration: 15000, icon: '\uD83D\uDD11' })
        }
        navigate('/verify-otp', { state: { email } })
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const FloatingInput = ({ id, type, value, onChange, label, icon: Icon }) => (
    <div className="relative group">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(f => ({...f, [id]: true}))}
        onBlur={() => setFocused(f => ({...f, [id]: false}))}
        className={`peer w-full pl-12 pr-4 pt-6 pb-2.5 border-2 rounded-2xl bg-gray-50/30
                   focus:outline-none focus:bg-white text-sm transition-all duration-300 placeholder-transparent
                   ${value ? 'border-accent-400/50 bg-white' : 'border-gray-200 hover:border-gray-300'}
                   ${focused[id] ? 'border-accent-400 ring-4 ring-accent-400/10 shadow-lg shadow-accent-400/5' : ''}`}
        placeholder={label}
        required
      />
      <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300
        ${focused[id] || value ? 'text-accent-500' : 'text-gray-400'}`}>
        <Icon size={18} />
      </div>
      <label
        htmlFor={id}
        className={`absolute left-12 transition-all duration-300 pointer-events-none
          ${value || focused[id]
            ? 'top-2.5 text-[10px] font-bold text-accent-500 tracking-wide uppercase'
            : 'top-[18px] text-sm text-gray-400'
          }`}
      >
        {label}
      </label>
    </div>
  )

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left - Branding Panel */}
      <div className="hidden lg:flex lg:w-[55%] bg-gradient-to-br from-primary-900 via-primary-700 to-primary-500 relative overflow-hidden flex-col justify-between p-10">
        {/* Animated background layers */}
        <div className="absolute inset-0 login-pattern" />
        <div className="absolute inset-0 login-glow" />
        <div className="absolute inset-0 login-glow-2" />

        {/* Floating orbs */}
        <div className="login-orb w-[500px] h-[500px] bg-accent-400 -top-40 -right-40 animate-float-slow" />
        <div className="login-orb w-[300px] h-[300px] bg-blue-500 bottom-20 -left-20 animate-float-delay" />
        <div className="login-orb w-[200px] h-[200px] bg-emerald-400 top-1/2 right-20 animate-float" />

        {/* Top - Logo */}
        <div className="relative z-10 flex items-center gap-3 animate-fade-in-up">
          <img src="/logo.svg" alt="Prominence Bank" className="h-12 brightness-0 invert" />
        </div>

        {/* Center - Hero */}
        <div className="relative z-10 max-w-lg -mt-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-accent-400 text-xs font-semibold mb-6 animate-fade-in-up-d1">
            <Globe size={14} />
            <span>Secure Digital Banking Platform</span>
          </div>

          <h1 className="text-5xl font-extrabold text-white leading-[1.1] mb-4 animate-fade-in-up-d2">
            Banking
            <span className="block bg-gradient-to-r from-accent-300 via-accent-400 to-accent-500 bg-clip-text text-transparent animate-gradient">
              Reimagined
            </span>
          </h1>
          <p className="text-primary-200 text-base leading-relaxed mb-8 animate-fade-in-up-d3">
            Complete core banking platform with institutional-grade security, real-time processing, and regulatory compliance built in.
          </p>

          {/* Feature cards */}
          <div className="space-y-3">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className={`flex gap-4 p-3 rounded-xl glass hover:bg-white/10 transition-all duration-300 group animate-fade-in-up-d${i + 3}`}>
                <div className="w-10 h-10 rounded-xl bg-accent-400/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-400/30 group-hover:scale-110 transition-all duration-300">
                  <Icon size={18} className="text-accent-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm group-hover:text-accent-300 transition-colors">{title}</h3>
                  <p className="text-primary-300 text-xs mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom - Stats */}
        <div className="relative z-10 flex gap-8 animate-fade-in-up-d6">
          {stats.map(({ value, label }) => (
            <div key={label}>
              <p className="text-xl font-bold text-accent-400">{value}</p>
              <p className="text-xs text-primary-300">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className={`w-full max-w-[420px] transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <img src="/logo.svg" alt="Prominence Bank" className="h-12 mx-auto" />
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-primary-500 tracking-tight">Welcome back</h2>
            <p className="text-gray-400 mt-2">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <FloatingInput id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} label="Email Address" icon={CreditCard} />
            <FloatingInput id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} label="Password" icon={Lock} />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2.5 text-gray-500 cursor-pointer group">
                <div className="relative">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="w-5 h-5 rounded-md border-2 border-gray-300 peer-checked:border-accent-400 peer-checked:bg-accent-400 transition-all duration-200" />
                  <svg className="absolute top-0.5 left-0.5 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className="group-hover:text-gray-700 transition-colors">Remember me</span>
              </label>
              <span className="text-accent-500 hover:text-accent-600 cursor-pointer font-medium hover:underline decoration-2 underline-offset-2">Forgot password?</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full py-3.5 bg-gradient-to-r from-accent-400 via-accent-500 to-accent-400 bg-[length:200%_auto] text-primary-900 rounded-2xl font-bold text-[15px]
                         hover:bg-right active:scale-[0.97] transition-all duration-500
                         shadow-xl shadow-accent-400/20 hover:shadow-2xl hover:shadow-accent-400/30
                         disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Authenticating...</>
              ) : (
                <>Sign In <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            <span className="text-xs text-gray-400 font-medium">DEMO ACCESS</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          </div>

          {/* Demo credentials */}
          <div className="p-5 bg-gradient-to-br from-primary-50/80 to-accent-50/40 rounded-2xl border border-accent-200/30">
            <div className="flex items-center gap-2 mb-3">
              <Landmark size={14} className="text-accent-500" />
              <p className="text-xs font-bold text-primary-500 uppercase tracking-wider">Quick Login</p>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Admin', email: 'admin@prominencebank.com', pass: 'Admin2026!Secure' },
                { label: 'Client', email: 'john.doe@email.com', pass: 'Client2026!Secure' },
              ].map(cred => (
                <button
                  key={cred.label}
                  type="button"
                  onClick={() => { setEmail(cred.email); setPassword(cred.pass) }}
                  className="w-full flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 hover:border-accent-400/40 hover:shadow-md hover:shadow-accent-400/5 transition-all duration-300 group text-left"
                >
                  <div>
                    <span className="text-[10px] font-bold text-accent-500 uppercase tracking-wider">{cred.label}</span>
                    <p className="text-xs text-gray-600 font-mono mt-0.5">{cred.email}</p>
                  </div>
                  <ArrowRight size={14} className="text-gray-300 group-hover:text-accent-500 group-hover:translate-x-1 transition-all duration-300" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
