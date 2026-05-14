// API Client для подключения к бэкенду
import type { Level, Achievement, UserStats, User, Course } from '@/types/api'

const API_BASE_URL = 'http://localhost:8080/v1'

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    total?: number
    page?: number
    page_size?: number
  }
}

// User interface moved to @/types/api

export interface AuthResponse {
  access_token: string
  refresh_token: string
  user: User
}

class APIClient {
  private baseURL: string
  private accessToken: string | null = null

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
    this.accessToken = localStorage.getItem('access_token')
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.accessToken) {
      (headers as any).Authorization = `Bearer ${this.accessToken}`
    }

    try {
      console.log(`Making request to: ${url}`, { headers, body: options.body })
      
      const response = await fetch(url, {
        ...options,
        headers,
      })

      console.log(`Response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Response error:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log('Response data:', data)
      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Auth methods
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    if (response.success && response.data) {
      this.accessToken = response.data.access_token
      localStorage.setItem('access_token', response.data.access_token)
      localStorage.setItem('refresh_token', response.data.refresh_token)
    }

    return response.data!
  }

  async register(email: string, username: string, password: string): Promise<User> {
    const response = await this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    })

    return response.data!
  }

  async logout(): Promise<void> {
    try {
      await this.request('/logout', {
        method: 'POST',
      })
    } finally {
      this.accessToken = null
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await this.request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (response.success && response.data) {
      this.accessToken = response.data.access_token
      localStorage.setItem('access_token', response.data.access_token)
      localStorage.setItem('refresh_token', response.data.refresh_token)
    }

    return response.data!
  }

  // User methods
  async getCurrentUser(): Promise<User> {
    const response = await this.request<User>('/me')
    return response.data!
  }

  async getUserStats(): Promise<UserStats> {
    const response = await this.request<UserStats>('/me/stats')
    return response.data!
  }

  // Levels methods
  async getLevels(): Promise<Level[]> {
    const response = await this.request<Level[]>('/levels')
    console.log('getLevels response:', response)
    return response.data || []
  }

  async getCourses(): Promise<Course[]> {
    const response = await this.request<Course[]>('/courses')
    return response.data || []
  }

  async getLevel(id: number): Promise<any> {
    const response = await this.request(`/levels/${id}`)
    return response.data
  }

  // Achievements methods
  async getAchievements(): Promise<Achievement[]> {
    const response = await this.request<Achievement[]>('/achievements')
    return response.data || []
  }

  async getUserAchievements(): Promise<Achievement[]> {
    const response = await this.request<Achievement[]>('/achievements/my')
    return response.data || []
  }

  // Rewards methods
  async getDiamondsBalance(): Promise<{ balance: number }> {
    const response = await this.request<{ balance: number }>('/rewards/balance')
    return response.data!
  }

  async getTransactionHistory(): Promise<any[]> {
    const response = await this.request<any[]>('/rewards/transactions')
    return response.data || []
  }

  // Attempts methods
  async startAttempt(levelId: number): Promise<any> {
    const response = await this.request('/attempts', {
      method: 'POST',
      body: JSON.stringify({ level_id: levelId }),
    })
    return response.data
  }

  async getUserAttempts(): Promise<any[]> {
    const response = await this.request<any[]>('/attempts')
    console.log('getUserAttempts response:', response)
    return response.data || []
  }

  async getNextQuestion(attemptId: number): Promise<any> {
    const response = await this.request(`/attempts/${attemptId}/next`)
    console.log('getNextQuestion raw response:', response)

    const data = response.data as Record<string, unknown> | null | undefined
    if (!data) {
      return { kind: 'none', message: 'empty' }
    }

    if (data.kind === 'none') {
      return { kind: 'none', message: (data.message as string) || 'done' }
    }

    if (data.kind === 'text') {
      return {
        kind: 'text',
        level_step_id: data.level_step_id as number,
        title: (data.title as string) || '',
        body: (data.body as string) || '',
      }
    }

    if (data.kind === 'question' && data.question) {
      const q = data.question as Record<string, unknown>
      return {
        kind: 'question',
        level_step_id: data.level_step_id as number | undefined,
        question: {
          id: q.id as number,
          prompt: q.prompt as string,
          multi_select: Boolean(q.multi_select ?? q.multiSelect),
          choices: ((q.choices as Array<Record<string, unknown>>) || []).map((c) => ({
            id: c.id as number,
            text: c.text as string,
          })),
        },
      }
    }

    if (data.message && !data.question) {
      return { kind: 'none', message: String(data.message) }
    }

    if (data.id && data.prompt) {
      const q = data as Record<string, unknown>
      return {
        kind: 'question',
        question: {
          id: q.id as number,
          prompt: q.prompt as string,
          multi_select: Boolean(q.multi_select),
          choices: ((q.choices as Array<Record<string, unknown>>) || []).map((c) => ({
            id: c.id as number,
            text: c.text as string,
          })),
        },
      }
    }

    if (data.question) {
      const q = data.question as Record<string, unknown>
      return {
        kind: 'question',
        question: {
          id: q.id as number,
          prompt: q.prompt as string,
          multi_select: Boolean(q.multi_select ?? q.multiSelect),
          choices: ((q.choices as Array<Record<string, unknown>>) || []).map((c) => ({
            id: c.id as number,
            text: c.text as string,
          })),
        },
      }
    }

    return { kind: 'none', message: 'unknown' }
  }

  async acknowledgeTextStep(attemptId: number, levelStepId: number): Promise<void> {
    await this.request(`/attempts/${attemptId}/text-step`, {
      method: 'POST',
      body: JSON.stringify({ level_step_id: levelStepId }),
    })
  }

  async answerQuestion(attemptId: number, questionId: number, choiceIds: number[]): Promise<any> {
    const response = await this.request(`/attempts/${attemptId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ question_id: questionId, choice_ids: choiceIds }),
    })
    return response.data
  }

  async completeAttempt(attemptId: number): Promise<any> {
    const response = await this.request(`/attempts/${attemptId}/complete`, {
      method: 'POST',
    })
    return response.data
  }

  async cancelAttempt(attemptId: number): Promise<void> {
    await this.request(`/attempts/${attemptId}/cancel`, {
      method: 'POST',
    })
  }
}

export const apiClient = new APIClient()
