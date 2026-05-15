// API Client для подключения к бэкенду
import type {
  Level,
  Achievement,
  AchievementCatalogItem,
  ShopItem,
  ShopPurchaseResult,
  UserStats,
  User,
  Course,
  UpdateProfilePayload,
} from '@/types/api'

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
  private refreshPromise: Promise<void> | null = null

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
    this.syncAccessTokenFromStorage()
  }

  private syncAccessTokenFromStorage() {
    this.accessToken = localStorage.getItem('access_token')
  }

  private isAuthEndpoint(endpoint: string) {
    return (
      endpoint.startsWith('/auth/login') ||
      endpoint.startsWith('/auth/register') ||
      endpoint.startsWith('/auth/refresh')
    )
  }

  private async refreshAccessToken(): Promise<void> {
    if (this.refreshPromise) {
      await this.refreshPromise
      return
    }

    this.refreshPromise = (async () => {
      await this.refreshToken()
    })().finally(() => {
      this.refreshPromise = null
    })

    await this.refreshPromise
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retried = false
  ): Promise<APIResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    this.syncAccessTokenFromStorage()

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.accessToken) {
      (headers as Record<string, string>).Authorization = `Bearer ${this.accessToken}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (
        response.status === 401 &&
        !retried &&
        !this.isAuthEndpoint(endpoint) &&
        localStorage.getItem('refresh_token')
      ) {
        try {
          await this.refreshAccessToken()
          return this.request<T>(endpoint, options, true)
        } catch {
          // fall through to error handling below
        }
      }

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      return await response.json()
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
      if (response.data.user) {
        response.data.user = this.mapUserFromApi(response.data.user)
      }
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

    const url = `${this.baseURL}/auth/refresh`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const data: APIResponse<AuthResponse> = await response.json()

    if (data.success && data.data) {
      this.accessToken = data.data.access_token
      localStorage.setItem('access_token', data.data.access_token)
      localStorage.setItem('refresh_token', data.data.refresh_token)
    } else {
      throw new Error('Failed to refresh token')
    }

    return data.data!
  }

  // User methods
  mapUserFromApi(data: User): User {
    return {
      id: data.id,
      email: data.email,
      username: data.username,
      avatar: data.profile?.avatar || data.avatar,
      profile: data.profile,
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.request<User>('/me')
    return this.mapUserFromApi(response.data!)
  }

  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const response = await this.request<User>('/me/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    return this.mapUserFromApi(response.data!)
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

  async getAchievementsCatalog(): Promise<AchievementCatalogItem[]> {
    const response = await this.request<AchievementCatalogItem[]>('/achievements/catalog')
    return response.data || []
  }

  async getShopItems(): Promise<ShopItem[]> {
    const response = await this.request<ShopItem[]>('/shop/items')
    return response.data || []
  }

  async purchaseShopItem(achievementId: number): Promise<ShopPurchaseResult> {
    const response = await this.request<ShopPurchaseResult>('/shop/purchase', {
      method: 'POST',
      body: JSON.stringify({ achievement_id: achievementId }),
    })
    return response.data!
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
