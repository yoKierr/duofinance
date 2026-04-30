import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiClient } from '@/shared/api/client'
import type { User } from '@/types/api'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (credentials: { email: string; password: string }) => Promise<void>
  register: (credentials: { email: string; username: string; password: string }) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Проверяем, есть ли сохраненный токен
    const token = localStorage.getItem('access_token')
    if (token) {
      // Пытаемся получить данные пользователя
      apiClient.getCurrentUser()
        .then((userData) => {
          setUser(userData)
        })
        .catch((error) => {
          console.error('Failed to get current user:', error)
          // Если токен недействителен, очищаем его
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
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

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
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