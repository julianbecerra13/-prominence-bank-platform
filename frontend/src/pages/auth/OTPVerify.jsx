import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ShieldCheck, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function OTPVerifyPage() {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const inputRefs = useRef([])
  const { verifyOtp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email

  useEffect(() => {
    if (!email) { navigate('/login'); return }
    inputRefs.current[0]?.focus()
  }, [email, navigate])

  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newDigits = [...digits]
    newDigits[index] = value.slice(-1)
    setDigits(newDigits)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setDigits(pasted.split(''))
      inputRefs.current[5]?.focus()
    }
  }

  const otp = digits.join('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) return
    setLoading(true)
    try {
      const user = await verifyOtp(email, otp)
      toast.success('Login successful!')
      navigate(user.role === 'client' ? '/client' : '/admin')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP')
      setDigits(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  if (!email) return null

  return (
    <div className="min-h-screen flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-[58%] bg-gradient-to-br from-primary-900 via-primary-700 to-primary-500 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 login-pattern" />
        <div className="absolute inset-0 login-glow" />

        <div className="relative z-10 text-center">
          <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur mx-auto mb-6 flex items-center justify-center animate-float">
            <ShieldCheck size={48} className="text-accent-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2 animate-fade-in-up">Two-Factor Authentication</h2>
          <p className="text-primary-200 max-w-sm mx-auto animate-fade-in-up-d1">
            For your security, we require a verification code for every login attempt.
          </p>
        </div>

        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-accent-400/5 animate-float" />
      </div>

      {/* Right - OTP Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="lg:hidden text-center mb-8">
            <img src="/logo.svg" alt="Prominence Bank" className="h-12 mx-auto" />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-primary-500">Verify your identity</h2>
            <p className="text-gray-400 mt-1">
              Enter the 6-digit code sent to <strong className="text-gray-600">{email}</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="flex gap-3 mb-8" onPaste={handlePaste}>
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleDigitChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className={`w-full h-16 text-center text-2xl font-bold rounded-xl border-2 transition-all duration-200 outline-none
                    ${digit
                      ? 'border-accent-400 bg-accent-50/50 text-primary-500'
                      : 'border-gray-200 bg-white text-gray-800 focus:border-accent-400 focus:ring-4 focus:ring-accent-400/10'
                    }`}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3 bg-gradient-to-r from-accent-400 to-accent-500 text-primary-900 rounded-xl font-semibold
                         hover:from-accent-500 hover:to-accent-600 active:scale-[0.98] transition-all duration-200
                         shadow-lg shadow-accent-400/25 disabled:opacity-60 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={18} className="animate-spin" /> Verifying...</> : 'Verify & Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Didn't receive a code? <span className="text-accent-500 font-medium cursor-pointer hover:text-accent-600">Resend OTP</span>
          </p>
        </div>
      </div>
    </div>
  )
}
