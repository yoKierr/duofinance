import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/shared/api/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Question {
  id: number;
  prompt: string;
  multi_select: boolean;
  choices: {
    id: number;
    text: string;
  }[];
}

interface AnswerResponse {
  correct: boolean;
  explanation: string;
}

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [level, setLevel] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedChoices, setSelectedChoices] = useState<number[]>([]);
  const [questionResult, setQuestionResult] = useState<AnswerResponse | null>(null);
  const [loadingState, setLoadingState] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(1);
  const [isAnswering, setIsAnswering] = useState(false);
  // Track which questions were answered incorrectly and need retry
  const [questionsToRetry, setQuestionsToRetry] = useState<Map<number, Question>>(new Map());
  const [correctlyAnsweredQuestions, setCorrectlyAnsweredQuestions] = useState<Set<number>>(new Set());
  const isMountedRef = useRef(true);
  const pendingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (pendingTimeoutRef.current) {
        clearTimeout(pendingTimeoutRef.current);
        pendingTimeoutRef.current = null;
      }
    };
  }, []);

  const cancelPendingTransition = () => {
    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }
    setIsAnswering(false);
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }

    if (user && id) {
      startLesson();
    }
  }, [user, loading, id, navigate]);

  const startLesson = async () => {
    try {
      setLoadingState(true);
      setError(null);

      // Сбрасываем состояние попытки при старте нового урока/повторе
      setScore(0);
      setQuestionsToRetry(new Map());
      setCorrectlyAnsweredQuestions(new Set());
      setCurrentQuestionIndex(1);
      setSelectedChoices([]);
      setQuestionResult(null);

      // Получаем информацию об уровне
      const levelData = await apiClient.getLevel(parseInt(id!));
      console.log('Level data:', levelData);
      setLevel(levelData);

      // Начинаем попытку
      const attemptData = await apiClient.startAttempt(parseInt(id!));
      console.log('Attempt data:', attemptData);
      setAttempt(attemptData);

      // Получаем первый вопрос
      const question = await apiClient.getNextQuestion(attemptData.id);
      console.log('First question response:', question);
      
      if (question && question.question) {
        setCurrentQuestion(question.question);
        // Подсчитываем количество вопросов в уровне
        const questionCount = levelData.steps?.filter((step: any) => step.type === 'question').length || 1;
        setTotalQuestions(questionCount);
        console.log('Total questions in level:', questionCount);
      } else if (question && question.message) {
        setError(`Нет вопросов для этого уровня: ${question.message}`);
      } else {
        setError('Нет вопросов для этого уровня');
      }
    } catch (err) {
      console.error('Error starting lesson:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки урока');
    } finally {
      setLoadingState(false);
    }
  };

  const handleAnswer = async () => {
    if (!attempt || !currentQuestion || selectedChoices.length === 0 || isAnswering) {
      return;
    }

    setIsAnswering(true);
    try {
      const result = await apiClient.answerQuestion(
        attempt.id,
        currentQuestion.id,
        selectedChoices
      );

      setQuestionResult(result);
      
      const currentQuestionId = currentQuestion.id;
      
      if (result.correct) {
        // Правильный ответ - удаляем из очереди, если был там
        setQuestionsToRetry(prev => {
          const newMap = new Map(prev);
          newMap.delete(currentQuestionId);
          return newMap;
        });
        // Обновляем множество правильно отвеченных вопросов и счет
        setCorrectlyAnsweredQuestions(prev => {
          const alreadyCounted = prev.has(currentQuestionId);
          if (!alreadyCounted) {
            setScore(s => s + 1);
          }
          const newSet = new Set(prev);
          newSet.add(currentQuestionId);
          return newSet;
        });
      } else {
        // Неправильный ответ - добавляем в очередь для повторного прохождения
        setQuestionsToRetry(prev => {
          const newMap = new Map(prev);
          newMap.set(currentQuestionId, currentQuestion);
          return newMap;
        });
      }

      // Через 3 секунды переходим к следующему вопросу или завершаем урок
      if (pendingTimeoutRef.current) {
        clearTimeout(pendingTimeoutRef.current);
      }
      pendingTimeoutRef.current = window.setTimeout(() => {
        // Сначала пробуем взять следующий новый вопрос с бэкенда,
        // а только затем — из очереди на повтор
        setQuestionsToRetry(currentRetryQueue => {
          if (!isMountedRef.current) {
            return currentRetryQueue;
          }
          apiClient.getNextQuestion(attempt.id)
            .then(nextQuestion => {
              console.log('Next question response:', nextQuestion);
              
              if (nextQuestion && nextQuestion.question) {
                // Есть следующий новый вопрос — показываем его
                if (!isMountedRef.current) return;
                setCurrentQuestion(nextQuestion.question);
                setSelectedChoices([]);
                setQuestionResult(null);
                setIsAnswering(false);
                setCurrentQuestionIndex(prev => prev + 1);
                return;
              }

              // Новых вопросов нет — берем из очереди на повтор
              const finalRetryList = Array.from(currentRetryQueue.values());
              if (finalRetryList.length > 0) {
                console.log('Using queued wrong question, left:', finalRetryList.length);
                const firstRetryQuestion = finalRetryList[0];
                currentRetryQueue.delete(firstRetryQuestion.id);

                if (isMountedRef.current) {
                  setCurrentQuestion(firstRetryQuestion);
                  setSelectedChoices([]);
                  setQuestionResult(null);
                  setIsAnswering(false);
                }
              } else {
                // Совсем нет вопросов — завершаем урок
                console.log('All questions completed');
                if (isMountedRef.current) completeLesson();
              }
            })
            .catch(err => {
              console.error('Error getting next question:', err);
              // На ошибке тоже пробуем очередь на повтор
              const finalRetryList = Array.from(currentRetryQueue.values());
              if (finalRetryList.length > 0) {
                const firstRetryQuestion = finalRetryList[0];
                currentRetryQueue.delete(firstRetryQuestion.id);

                if (isMountedRef.current) {
                  setCurrentQuestion(firstRetryQuestion);
                  setSelectedChoices([]);
                  setQuestionResult(null);
                  setIsAnswering(false);
                }
              } else {
                if (isMountedRef.current) completeLesson();
              }
            });

          // Возвращаем текущее состояние очереди (могли удалить первый элемент выше)
          return currentRetryQueue;
        });
      }, 3000);
    } catch (err) {
      console.error('Error answering question:', err);
      setError(err instanceof Error ? err.message : 'Ошибка ответа на вопрос');
      setIsAnswering(false);
    }
  };

  const completeLesson = async () => {
    try {
      const result = await apiClient.completeAttempt(attempt.id);
      console.log('Lesson completed:', result);
      
      // Получаем финальное состояние очереди
      setQuestionsToRetry(currentRetryQueue => {
        const finalQueue = Array.from(currentRetryQueue.values());
        const noRetriesLeft = finalQueue.length === 0;
        
        // Перенаправляем на страницу результатов или обратно к уровням
        navigate('/learn', { 
          state: { 
            lessonCompleted: true, 
            // из бэкенда: точность и правильные ответы
            score: result.score ?? 0,
            correctAnswers: result.correct_answers ?? result.correctAnswers ?? 0,
            totalQuestions: result.total_questions ?? result.totalQuestions ?? totalQuestions,
            reward: (result.reward?.diamonds ?? result.Reward?.diamonds) || level?.reward_points || 0,
            perfectScore: noRetriesLeft
          }
        });
        
        return currentRetryQueue;
      });
    } catch (err) {
      console.error('Error completing lesson:', err);
      // Даже если ошибка при завершении, перенаправляем на главную
      navigate('/learn', { 
        state: { 
          lessonCompleted: true, 
          score: 0,
          correctAnswers: 0,
          totalQuestions: totalQuestions,
          reward: level?.reward_points || 0,
          perfectScore: true
        }
      });
    }
  };

  const toggleChoice = (choiceId: number) => {
    if (currentQuestion?.multi_select) {
      setSelectedChoices(prev => 
        prev.includes(choiceId) 
          ? prev.filter(id => id !== choiceId)
          : [...prev, choiceId]
      );
    } else {
      setSelectedChoices([choiceId]);
    }
  };

  if (loading || loadingState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Загрузка урока...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Ошибка</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => navigate('/learn')}>
            Вернуться к уровням
          </Button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Нет вопросов для этого уровня</div>
      </div>
    );
  }

  const retryCount = questionsToRetry.size;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <header className="bg-white border-b-2 border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                aria-label="Закрыть урок"
                onClick={async () => {
                  cancelPendingTransition();
                  try {
                    if (attempt?.id) {
                      await apiClient.cancelAttempt(attempt.id)
                    }
                  } catch (e) {
                    // игнорируем ошибки отмены
                  }
                  navigate('/learn')
                }}
                className="text-gray-600 hover:text-gray-800 text-2xl leading-none"
              >
                ×
              </button>
              <h1 className="text-xl font-bold text-gray-800">
                {level?.title || 'Урок'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-blue-100 text-blue-700">
                Вопрос {currentQuestionIndex} из {totalQuestions}
              </Badge>
              <Badge className="bg-[#00e3c1]/20 text-[#00b89a]">
                Правильно: {score}
              </Badge>
              {retryCount > 0 && (
                <Badge className="bg-orange-100 text-orange-700">
                  Исправление: {retryCount}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-8 mb-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {currentQuestion.prompt}
            </h2>

            {questionResult && (
              <div className={`p-4 rounded-lg mb-4 ${
                questionResult.correct
                  ? 'bg-[#00e3c1]/10 border-2 border-[#00b89a]'
                  : 'bg-red-50 border-2 border-red-500'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">
                    {questionResult.correct ? '✅' : '❌'}
                  </span>
                  <span className={`font-bold ${
                    questionResult.correct ? 'text-[#00b89a]' : 'text-red-700'
                  }`}>
                    {questionResult.correct ? 'Правильно!' : 'Неправильно'}
                  </span>
                </div>
                {questionResult.explanation && (
                  <p className="text-gray-700">{questionResult.explanation}</p>
                )}
              </div>
            )}

            <div className="space-y-3">
              {currentQuestion.choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => toggleChoice(choice.id)}
                  disabled={!!questionResult}
                  className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                    selectedChoices.includes(choice.id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${
                    questionResult ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  {choice.text}
                </button>
              ))}
            </div>
          </div>

          {!questionResult && (
            <Button
              onClick={handleAnswer}
              disabled={selectedChoices.length === 0 || isAnswering}
              className="w-full duofinance-button duofinance-button-primary"
            >
              {isAnswering ? 'Обработка...' : 'Ответить'}
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}
