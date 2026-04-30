// Типы для совместимости с бэкендом
export interface Stats {
  currentStreak: number
  longestStreak: number
  completedLevels: number
}

export interface RewardBalance {
  diamonds: number
  gems: number
  coins: number
}

export interface Achievement {
  id: number
  code: string
  name: string
  description: string
  icon: string
  points: number
  unlocked?: boolean
}

export interface Level {
  id: number
  title: string
  topic: string
  difficulty: string
  reward_points: number
  description?: string
  is_active: boolean
  isCompleted?: boolean
  isLocked?: boolean
  progress?: number
  icon?: string
  steps_count?: number
}

export interface UserStats {
  total_attempts: number
  completed_levels: number
  total_diamonds: number
  current_streak: number
  average_score: number
  achievements_count: number
}

// Дополнительные типы для API
export interface User {
  id: number
  username: string
  email: string
  displayName?: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: number
  user_id: number
  avatar?: string
  bio?: string
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  token: string
  accessToken: string
  refreshToken: string
  user: User
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface Attempt {
  id: number
  user_id?: number
  level_id?: number
  UserID?: number
  LevelID?: number
  status?: string
  Status?: string
  result_score?: number
  ResultScore?: number
  started_at?: string
  StartedAt?: string
  completed_at?: string
  CompletedAt?: string
  created_at?: string
  CreatedAt?: string
}

export interface Question {
  id: number
  level_id: number
  question_text: string
  correct_answer: string
  options: string[]
  created_at: string
}

export interface Transaction {
  id: number
  user_id: number
  amount: number
  type: 'earn' | 'spend'
  description: string
  created_at: string
}

export interface UserAchievement {
  id: number
  user_id: number
  achievement_id: number
  unlocked_at: string
  achievement: Achievement
}