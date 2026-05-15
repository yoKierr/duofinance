import { useState, useEffect } from 'react'
import { apiClient } from '@/shared/api/client'
import type { Level, Achievement, AchievementCatalogItem, ShopItem, UserStats, Attempt, Course } from '@/types/api'

// Хук для получения уровней
export function useLevels() {
  const [levels, setLevels] = useState<Level[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        setLoading(true)
        const [levelsData, attemptsData] = await Promise.all([
          apiClient.getLevels(),
          apiClient.getUserAttempts().catch(() => []) // Если ошибка, используем пустой массив
        ])
        
        console.log('Levels data:', levelsData)
        console.log('Attempts data:', attemptsData)
        
        // Создаем карту попыток по уровням
        const attemptsByLevel = new Map<number, Attempt[]>()
        attemptsData.forEach((attempt: Attempt) => {
          // Бэкенд возвращает LevelID, а не level_id
          const levelId = attempt.level_id || attempt.LevelID
          if (levelId && !attemptsByLevel.has(levelId)) {
            attemptsByLevel.set(levelId, [])
          }
          if (levelId) {
            attemptsByLevel.get(levelId)!.push(attempt)
          }
        })
        
        // Преобразуем данные бэкенда в формат фронтенда
        const formattedLevels = levelsData.map((level, index) => {
          const levelAttempts = attemptsByLevel.get(level.id) || []
          const completedAttempts = levelAttempts.filter((a: Attempt) => 
            a.status === 'completed' || a.Status === 'completed'
          )
          const isCompleted = completedAttempts.length > 0
          
          // Прогресс только для завершенных уровней
          let progress = 0
          
          if (isCompleted) {
            progress = 100
          }
          
          return {
            ...level,
            icon: getLevelIcon(level.topic),
            isCompleted,
            progress,
          }
        })
        
        // Применяем логику разблокировки: каждый следующий уровень
        // доступен только если предыдущий завершен
        const finalLevels = formattedLevels.map((level, index) => {
          const isLocked = index > 0 && !formattedLevels[index - 1]?.isCompleted
          return {
            ...level,
            isLocked,
          }
        })
        
        setLevels(finalLevels)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch levels')
      } finally {
        setLoading(false)
      }
    }

    fetchLevels()
  }, [])

  return { levels, loading, error }
}

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true)
        const data = await apiClient.getCourses()
        setCourses(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch courses')
      } finally {
        setLoading(false)
      }
    }
    fetchCourses()
  }, [])

  return { courses, loading, error }
}

// Каталог достижений с прогрессом (синхронизация и выдача на бэкенде).
export function useAchievementsCatalog() {
  const [achievements, setAchievements] = useState<AchievementCatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true)
        const data = await apiClient.getAchievementsCatalog()
        setAchievements(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить достижения')
      } finally {
        setLoading(false)
      }
    }

    fetchCatalog()
  }, [])

  return { achievements, loading, error }
}

// Хук для получения достижений (legacy)
export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true)
        const [allAchievements, userAchievements] = await Promise.all([
          apiClient.getAchievements(),
          apiClient.getUserAchievements(),
        ])

        const userAchievementIds = new Set(userAchievements.map((a) => a.id))
        const formattedAchievements = allAchievements.map((achievement) => ({
          ...achievement,
          unlocked: userAchievementIds.has(achievement.id),
        }))

        setAchievements(formattedAchievements)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch achievements')
      } finally {
        setLoading(false)
      }
    }

    fetchAchievements()
  }, [])

  return { achievements, loading, error }
}

// Хук для получения статистики пользователя
export function useUserStats() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const data = await apiClient.getUserStats()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user stats')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, loading, error }
}

// Хук для получения баланса алмазов
export function useDiamondsBalance() {
  const [balance, setBalance] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBalance = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getDiamondsBalance()
      setBalance(data.balance)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balance')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchBalance()
  }, [])

  return { balance, loading, error, refetch: fetchBalance, setBalance }
}

export function useShopItems() {
  const [items, setItems] = useState<ShopItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchItems = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.getShopItems()
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить магазин')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchItems()
  }, [])

  return { items, loading, error, refetch: fetchItems }
}

// Вспомогательная функция для получения иконки уровня
function getLevelIcon(topic: string): string {
  const iconMap: Record<string, string> = {
    'basics': '🌟',
    'greetings': '👋',
    'family': '👨‍👩‍👧‍👦',
    'food': '🍕',
    'numbers': '🔢',
    'colors': '🎨',
    'animals': '🐶',
    'travel': '✈️',
    'work': '💼',
    'hobbies': '🎮',
  }
  
  return iconMap[topic.toLowerCase()] || '📚'
}
