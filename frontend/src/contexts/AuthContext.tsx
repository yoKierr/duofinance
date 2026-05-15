import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiClient } from '@/shared/api/client'
import type { User } from '@/types/api'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (credentials: { email: string; password: string }) => Promise<void>
  register: (credentials: { email: string; username: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  setUserFromApi: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('access_token')
      const refresh = localStorage.getItem('refresh_token')
      if (!token && !refresh) {
        setLoading(false)
        return
      }

      try {
        const userData = await apiClient.getCurrentUser()
        setUser(userData)
      } catch {
        if (!refresh) {
          localStorage.removeItem('access_token')
          setLoading(false)
          return
        }
        try {
          await apiClient.refreshToken()
          const userData = await apiClient.getCurrentUser()
          setUser(userData)
        } catch (error) {
          console.error('Failed to restore session:', error)
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
      } finally {
        setLoading(false)
      }
    }

    void restoreSession()
  }, [])

  const login = async ({ email, password }: { email: string; password: string }) => {
    try {
      const authResponse = await apiClient.login(email, password)
      setUser(authResponse.user)
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const register = async ({ email, username, password }: { email: string; username: string; password: string }) => {
    try {
      await apiClient.register(email, username, password)
      // После регистрации автоматически логинимся
      const authResponse = await apiClient.login(email, password)
      setUser(authResponse.user)
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await apiClient.logout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setUser(null)
    }
  }

  const refreshUser = async () => {
    const userData = await apiClient.getCurrentUser()
    setUser(userData)
  }

  const setUserFromApi = (next: User) => {
    setUser(next)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setUserFromApi }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}