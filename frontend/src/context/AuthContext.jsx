import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(false)

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login/', { email, password })
    return data
  }

  const verifyOtp = async (email, otpCode) => {
    const { data } = await api.post('/auth/verify-otp/', { email, otp_code: otpCode })
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    const refresh = localStorage.getItem('refresh_token')
    api.post('/auth/logout/', { refresh }).catch(() => {})
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const isAdmin = user?.role && user.role !== 'client'
  const isClient = user?.role === 'client'

  return (
    <AuthContext.Provider value={{ user, login, verifyOtp, logout, loading, isAdmin, isClient }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
