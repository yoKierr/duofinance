import type {
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    User,
    Profile,
    Stats,
    Level,
    Attempt,
    Question,
    RewardBalance,
    Transaction,
    Achievement,
    UserAchievement,
  } from '@/types/api';
  
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080';
  
  class ApiClient {
    private accessToken: string | null = null;
  
    constructor() {
      if (typeof window !== 'undefined') {
        this.accessToken = localStorage.getItem('accessToken');
      }
    }
  
    private async request<T>(
      endpoint: string,
      options: RequestInit = {}
    ): Promise<T> {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };
  
      if (this.accessToken) {
        headers.Authorization = `Bearer ${this.accessToken}`;
      }
  
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
  
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}`);
      }
  
      return response.json();
    }
  
    // Auth
    async login(data: LoginRequest): Promise<AuthResponse> {
      const response = await this.request<AuthResponse>('/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      this.setTokens(response.accessToken, response.refreshToken);
      return response;
    }
  
    async register(data: RegisterRequest): Promise<AuthResponse> {
      const response = await this.request<AuthResponse>('/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      this.setTokens(response.accessToken, response.refreshToken);
      return response;
    }
  
    async refresh(): Promise<AuthResponse> {
      const refreshToken = localStorage.getItem('refreshToken');
      const response = await this.request<AuthResponse>('/v1/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
      this.setTokens(response.accessToken, response.refreshToken);
      return response;
    }
  
    // User
    async getMe(): Promise<User> {
      return this.request<User>('/v1/me');
    }
  
    async updateProfile(data: Partial<Profile>): Promise<Profile> {
      return this.request<Profile>('/v1/me/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    }
  
    async getStats(): Promise<Stats> {
      return this.request<Stats>('/v1/me/stats');
    }
  
    // Levels
    async getLevels(): Promise<Level[]> {
      return this.request<Level[]>('/v1/levels');
    }
  
    async getLevel(id: string): Promise<Level> {
      return this.request<Level>(`/v1/levels/${id}`);
    }
  
    async getLevelsByDifficulty(difficulty: string): Promise<Level[]> {
      return this.request<Level[]>(`/v1/levels/difficulty/${difficulty}`);
    }
  
    async getLevelsByTopic(topic: string): Promise<Level[]> {
      return this.request<Level[]>(`/v1/levels/topic/${topic}`);
    }
  
    // Attempts
    async startAttempt(levelId: string): Promise<Attempt> {
      return this.request<Attempt>('/v1/attempts', {
        method: 'POST',
        body: JSON.stringify({ levelId }),
      });
    }
  
    async getAttempts(): Promise<Attempt[]> {
      return this.request<Attempt[]>('/v1/attempts');
    }
  
    async getAttempt(id: string): Promise<Attempt> {
      return this.request<Attempt>(`/v1/attempts/${id}`);
    }
  
    async getNextQuestion(attemptId: string): Promise<Question> {
      return this.request<Question>(`/v1/attempts/${attemptId}/next`);
    }
  
    async answerQuestion(
      attemptId: string,
      data: { questionId: string; answer: string }
    ): Promise<{ correct: boolean; explanation?: string }> {
      return this.request(`/v1/attempts/${attemptId}/answer`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
  
    async completeAttempt(attemptId: string): Promise<Attempt> {
      return this.request<Attempt>(`/v1/attempts/${attemptId}/complete`, {
        method: 'POST',
      });
    }
  
    // Rewards
    async getBalance(): Promise<RewardBalance> {
      return this.request<RewardBalance>('/v1/rewards/balance');
    }
  
    async getTransactions(): Promise<Transaction[]> {
      return this.request<Transaction[]>('/v1/rewards/transactions');
    }
  
    // Achievements
    async getAchievements(): Promise<Achievement[]> {
      return this.request<Achievement[]>('/v1/achievements');
    }
  
    async getMyAchievements(): Promise<UserAchievement[]> {
      return this.request<UserAchievement[]>('/v1/achievements/my');
    }
  
    async getAchievementProgress(id: string): Promise<{ progress: number; total: number }> {
      return this.request(`/v1/achievements/${id}/progress`);
    }
  
    // Token management
    private setTokens(accessToken: string, refreshToken: string) {
      this.accessToken = accessToken;
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
      }
    }
  
    logout() {
      this.accessToken = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }
  }
  
  export const api = new ApiClient();
  