import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/shared/api/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface Question {
  id: number;
  prompt: string;
  multi_select: boolean;
  choices: {
    id: number;
    text: string;
  }[];
}

interface TextCard {
  level_step_id: number;
  title: string;
  body: string;
}

interface AnswerResponse {
  correct: boolean;
  explanation: string;
}

type NextPayload =
  | { kind: 'none'; message?: string }
  | { kind: 'text'; level_step_id: number; title: string; body: string }
  | { kind: 'question'; question: Question };

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [level, setLevel] = useState<Record<string, unknown> | null>(null);
  const attemptRef = useRef<{ id: number } | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [textCard, setTextCard] = useState<TextCard | null>(null);
  const [selectedChoices, setSelectedChoices] = useState<number[]>([]);
  const [questionResult, setQuestionResult] = useState<AnswerResponse | null>(null);
  const [loadingState, setLoadingState] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [masteredQuestionIds, setMasteredQuestionIds] = useState<Set<number>>(new Set());
  const [hadWrongAnswer, setHadWrongAnswer] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
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

  const progressPercent =
    totalQuestions > 0 ? Math.round((masteredQuestionIds.size / totalQuestions) * 100) : 0;

  const cancelPendingTransition = () => {
    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }
    setIsAnswering(false);
  };

  const completeLesson = useCallback(async () => {
    const att = attemptRef.current;
    if (!att) return;
    try {
      const result = await apiClient.completeAttempt(att.id);
      navigate('/learn', {
        state: {
          lessonCompleted: true,
          score: result.score ?? 0,
          correctAnswers: result.correct_answers ?? result.correctAnswers ?? 0,
          totalQuestions: result.total_questions ?? result.totalQuestions ?? totalQuestions,
          reward: (result.reward?.diamonds ?? result.Reward?.diamonds) || (level?.reward_points as number) || 0,
          perfectScore: !hadWrongAnswer && masteredQuestionIds.size >= totalQuestions,
        },
      });
    } catch (err) {
      console.error('Error completing lesson:', err);
      navigate('/learn', {
        state: {
          lessonCompleted: true,
          score: 0,
          correctAnswers: masteredQuestionIds.size,
          totalQuestions,
          reward: (level?.reward_points as number) || 0,
          perfectScore: false,
        },
      });
    }
  }, [navigate, totalQuestions, level, hadWrongAnswer, masteredQuestionIds.size]);

  const applyNextStep = useCallback(
    (next: NextPayload) => {
      if (next.kind === 'question' && next.question) {
        setCurrentQuestion(next.question);
        setTextCard(null);
        setSelectedChoices([]);
        setQuestionResult(null);
        setIsAnswering(false);
        return;
      }

      if (next.kind === 'text') {
        setCurrentQuestion(null);
        setTextCard({
          level_step_id: next.level_step_id,
          title: next.title,
          body: next.body,
        });
        setQuestionResult(null);
        setIsAnswering(false);
        return;
      }

      void completeLesson();
    },
    [completeLesson]
  );

  const proceedToNext = useCallback(
    async (attemptId: number) => {
      try {
        const raw = await apiClient.getNextQuestion(attemptId);
        const next = raw as NextPayload;
        if (!isMountedRef.current) return;
        applyNextStep(next);
      } catch (e) {
        console.error('Error advancing lesson:', e);
        if (isMountedRef.current) {
          await completeLesson();
        }
      }
    },
    [applyNextStep, completeLesson]
  );

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }

    if (user && id) {
      void startLesson();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, id, navigate]);

  const startLesson = async () => {
    try {
      setLoadingState(true);
      setError(null);
      setMasteredQuestionIds(new Set());
      setHadWrongAnswer(false);
      setSelectedChoices([]);
      setQuestionResult(null);
      setTextCard(null);
      setCurrentQuestion(null);

      const levelData = await apiClient.getLevel(parseInt(id!, 10));
      setLevel(levelData);

      const qCount =
        (levelData.steps as Array<{ type?: string }> | undefined)?.filter((s) => s.type === 'question')
          .length ?? 0;
      setTotalQuestions(qCount);

      const attemptData = await apiClient.startAttempt(parseInt(id!, 10));
      attemptRef.current = attemptData;

      const next = (await apiClient.getNextQuestion(attemptData.id)) as NextPayload;

      if (next.kind === 'none') {
        if (qCount === 0) {
          await apiClient.completeAttempt(attemptData.id);
          navigate('/learn', {
            state: {
              lessonCompleted: true,
              score: 100,
              correctAnswers: 0,
              totalQuestions: 0,
              reward: (levelData.reward_points as number) || 0,
              perfectScore: true,
            },
          });
          return;
        }
        setError('Нет шагов для этого урока');
        return;
      }

      applyNextStep(next);
    } catch (err) {
      console.error('Error starting lesson:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки урока');
    } finally {
      setLoadingState(false);
    }
  };

  const handleTextContinue = async () => {
    const att = attemptRef.current;
    const card = textCard;
    if (!att || !card) return;
    try {
      setIsAnswering(true);
      await apiClient.acknowledgeTextStep(att.id, card.level_step_id);
      await proceedToNext(att.id);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setIsAnswering(false);
    }
  };

  const handleAnswer = async () => {
    if (!attemptRef.current || !currentQuestion || selectedChoices.length === 0 || isAnswering) {
      return;
    }

    setIsAnswering(true);
    try {
      const result = await apiClient.answerQuestion(
        attemptRef.current.id,
        currentQuestion.id,
        selectedChoices
      );

      setQuestionResult(result);

      if (result.correct) {
        setMasteredQuestionIds((prev) => {
          if (prev.has(currentQuestion.id)) return prev;
          const next = new Set(prev);
          next.add(currentQuestion.id);
          return next;
        });
      } else {
        setHadWrongAnswer(true);
      }

      if (pendingTimeoutRef.current) {
        clearTimeout(pendingTimeoutRef.current);
      }
      pendingTimeoutRef.current = window.setTimeout(() => {
        const aid = attemptRef.current?.id;
        if (!aid || !isMountedRef.current) return;
        void proceedToNext(aid);
      }, result.correct ? 1200 : 2200);
    } catch (err) {
      console.error('Error answering question:', err);
      setError(err instanceof Error ? err.message : 'Ошибка ответа на вопрос');
      setIsAnswering(false);
    }
  };

  const toggleChoice = (choiceId: number) => {
    if (currentQuestion?.multi_select) {
      setSelectedChoices((prev) =>
        prev.includes(choiceId) ? prev.filter((x) => x !== choiceId) : [...prev, choiceId]
      );
    } else {
      setSelectedChoices([choiceId]);
    }
  };

  if (loading || loadingState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-zinc-100">
        <div className="text-2xl">Загрузка урока...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 text-zinc-100">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-400">Ошибка</h1>
          <p className="mb-4 text-zinc-400">{error}</p>
          <Button onClick={() => navigate('/learn')}>Вернуться к уровням</Button>
        </div>
      </div>
    );
  }

  if (!currentQuestion && !textCard) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-zinc-100">
        <div className="text-2xl">Нет содержимого для этого урока</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-zinc-100">
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950">
        <div className="container mx-auto px-4 py-4">
          <div className="mb-3 flex items-center gap-3">
            <button
              aria-label="Закрыть урок"
              onClick={async () => {
                cancelPendingTransition();
                try {
                  if (attemptRef.current?.id) {
                    await apiClient.cancelAttempt(attemptRef.current.id);
                  }
                } catch {
                  /* ignore */
                }
                navigate('/learn');
              }}
              className="shrink-0 text-2xl leading-none text-zinc-400 hover:text-white"
            >
              ×
            </button>
            {totalQuestions > 0 && <Progress value={progressPercent} className="h-2 flex-1" />}
          </div>
          <h1 className="truncate text-lg font-bold text-white">{String(level?.title || 'Урок')}</h1>
        </div>
      </header>

      <div className="container mx-auto max-w-2xl px-4 py-8">
        {textCard && (
          <Card className="mb-6 p-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Справка</p>
            <h2 className="mb-4 text-2xl font-bold text-white">{textCard.title || 'Важно'}</h2>
            <div className="mb-8 whitespace-pre-wrap text-base leading-relaxed text-zinc-300">{textCard.body}</div>
            <Button
              onClick={() => void handleTextContinue()}
              disabled={isAnswering}
              className="finstart-button finstart-button-primary w-full"
            >
              {isAnswering ? '...' : 'Понятно, дальше'}
            </Button>
          </Card>
        )}

        {currentQuestion && (
          <Card className="mb-6 p-8">
            <div className="mb-6">
              <h2 className="mb-4 text-2xl font-bold text-white">{currentQuestion.prompt}</h2>

              {questionResult && (
                <div
                  className={`mb-4 rounded-lg p-4 ${
                    questionResult.correct
                      ? 'border-2 border-zinc-600 bg-zinc-800'
                      : 'border-2 border-red-500 bg-red-950/40'
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-2xl">{questionResult.correct ? '✅' : '❌'}</span>
                    <span className={`font-bold ${questionResult.correct ? 'text-white' : 'text-red-400'}`}>
                      {questionResult.correct ? 'Правильно!' : 'Неправильно — вернёмся к этому вопросу в конце'}
                    </span>
                  </div>
                  {questionResult.explanation && <p className="text-zinc-300">{questionResult.explanation}</p>}
                </div>
              )}

              <div className="space-y-3">
                {currentQuestion.choices.map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => toggleChoice(choice.id)}
                    disabled={!!questionResult}
                    className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                      selectedChoices.includes(choice.id)
                        ? 'border-white bg-zinc-800 text-white'
                        : 'border-zinc-700 bg-zinc-950/80 text-zinc-200 hover:border-zinc-500'
                    } ${questionResult ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                  >
                    {choice.text}
                  </button>
                ))}
              </div>
            </div>

            {!questionResult && (
              <Button
                onClick={() => void handleAnswer()}
                disabled={selectedChoices.length === 0 || isAnswering}
                className="finstart-button finstart-button-primary w-full"
              >
                {isAnswering ? 'Обработка...' : 'Ответить'}
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
