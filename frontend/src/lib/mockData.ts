import type { Stats, RewardBalance, Achievement, Level } from '@/types/api'

export const mockStats: Stats = {
  currentStreak: 7,
  longestStreak: 30,
  completedLevels: 15
}

export const mockBalance: RewardBalance = {
  diamonds: 25,
  gems: 150,
  coins: 500
}

export const mockAchievements: Achievement[] = [
  {
    id: 1,
    code: 'first_steps',
    name: 'First Steps',
    description: 'Complete your first lesson',
    icon: '🎯',
    points: 10,
    unlocked: true
  },
  {
    id: 2,
    code: 'streak_master',
    name: 'Streak Master',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    points: 50,
    unlocked: true
  },
  {
    id: 4,
    code: 'dedicated_learner',
    name: 'Dedicated Learner',
    description: 'Complete 50 lessons',
    icon: '📚',
    points: 200,
    unlocked: false
  }
]

export const mockLevels: Level[] = [
  {
    id: 1,
    title: 'Basics',
    topic: 'basics',
    difficulty: 'beginner',
    reward_points: 50,
    description: 'Learn the fundamentals',
    icon: '🌟',
    is_active: true,
    isCompleted: true,
    isLocked: false,
    progress: 100,
  },
  {
    id: 2,
    title: 'Greetings',
    topic: 'greetings',
    difficulty: 'beginner',
    reward_points: 75,
    description: 'Say hello and goodbye',
    icon: '👋',
    is_active: true,
    isCompleted: false,
    isLocked: false,
    progress: 60,
  },
  {
    id: 3,
    title: 'Family',
    topic: 'family',
    difficulty: 'intermediate',
    reward_points: 100,
    description: 'Talk about your family',
    icon: '👨‍👩‍👧‍👦',
    is_active: true,
    isCompleted: false,
    isLocked: false,
    progress: 0,
  },
  {
    id: 4,
    title: 'Food',
    topic: 'food',
    difficulty: 'intermediate',
    reward_points: 125,
    description: 'Order food and drinks',
    icon: '🍕',
    is_active: true,
    isCompleted: false,
    isLocked: true,
    progress: 0,
  }
]