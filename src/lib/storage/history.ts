import { UnitGroup } from "../../domain/question/types";

export type StepAttempt = {
  questionType: string;
  unitGroup: UnitGroup;
  firstTryCorrect: boolean;
  wrongCount: number;
  timedOut: boolean;
  responseSeconds: number;
};

export type SessionResult = {
  id: string;
  completedQuestions: number;
  reachedFinalAnswer: number;
  totalSteps: number;
  firstTryCorrectSteps: number;
  wrongCount: number;
  timeoutCount: number;
  averageResponseSeconds: number;
  unitStats: Record<string, { steps: number; firstTryCorrect: number; wrong: number; timeout: number }>;
  weakTypes: string[];
  missed: Array<{ questionType: string; promptText: string; unitName: string }>;
  finishedAt: string;
};

export type LearningHistory = {
  totalSessions: number;
  typeStats: Record<string, { shown: number; firstTryCorrect: number; wrong: number; timeout: number; totalSeconds: number }>;
  timeoutCount: number;
  averageResponseSeconds: number;
  recentSessions: SessionResult[];
  weakTypes: string[];
  reviewTypes: string[];
};

const KEY = "hanaMathStepQuizHistory";

export const emptyHistory: LearningHistory = {
  totalSessions: 0,
  typeStats: {},
  timeoutCount: 0,
  averageResponseSeconds: 0,
  recentSessions: [],
  weakTypes: [],
  reviewTypes: [],
};

export function loadHistory(): LearningHistory {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...emptyHistory, ...JSON.parse(raw) } : emptyHistory;
  } catch {
    return emptyHistory;
  }
}

export function saveHistory(history: LearningHistory): void {
  localStorage.setItem(KEY, JSON.stringify(history));
}

export function clearHistory(): void {
  localStorage.removeItem(KEY);
}

export function buildSessionResult(
  id: string,
  attempts: StepAttempt[],
  questionMeta: Array<{ questionType: string; promptText: string; unitName: string }>,
): SessionResult {
  const totalSteps = attempts.length;
  const firstTryCorrectSteps = attempts.filter((a) => a.firstTryCorrect).length;
  const wrongCount = attempts.reduce((sum, a) => sum + a.wrongCount, 0);
  const timeoutCount = attempts.filter((a) => a.timedOut).length;
  const failedTypes = new Set(attempts.filter((a) => !a.firstTryCorrect || a.timedOut).map((a) => a.questionType));
  const unitStats: SessionResult["unitStats"] = {};
  attempts.forEach((a) => {
    const stat = (unitStats[a.unitGroup] ??= { steps: 0, firstTryCorrect: 0, wrong: 0, timeout: 0 });
    stat.steps += 1;
    if (a.firstTryCorrect) stat.firstTryCorrect += 1;
    stat.wrong += a.wrongCount;
    if (a.timedOut) stat.timeout += 1;
  });
  return {
    id,
    completedQuestions: questionMeta.length,
    reachedFinalAnswer: questionMeta.length,
    totalSteps,
    firstTryCorrectSteps,
    wrongCount,
    timeoutCount,
    averageResponseSeconds: totalSteps
      ? Math.round((attempts.reduce((sum, a) => sum + a.responseSeconds, 0) / totalSteps) * 10) / 10
      : 0,
    unitStats,
    weakTypes: [...failedTypes],
    missed: questionMeta.filter((q) => failedTypes.has(q.questionType)),
    finishedAt: new Date().toISOString(),
  };
}

export function mergeSession(history: LearningHistory, result: SessionResult, attempts: StepAttempt[]): LearningHistory {
  const next: LearningHistory = {
    ...history,
    totalSessions: history.totalSessions + 1,
    timeoutCount: history.timeoutCount + result.timeoutCount,
    recentSessions: [result, ...history.recentSessions].slice(0, 5),
  };
  attempts.forEach((a) => {
    const stat = (next.typeStats[a.questionType] ??= {
      shown: 0,
      firstTryCorrect: 0,
      wrong: 0,
      timeout: 0,
      totalSeconds: 0,
    });
    stat.shown += 1;
    if (a.firstTryCorrect) stat.firstTryCorrect += 1;
    stat.wrong += a.wrongCount;
    if (a.timedOut) stat.timeout += 1;
    stat.totalSeconds += a.responseSeconds;
  });
  const allAttempts = Object.values(next.typeStats).reduce((sum, stat) => sum + stat.shown, 0);
  const allSeconds = Object.values(next.typeStats).reduce((sum, stat) => sum + stat.totalSeconds, 0);
  next.averageResponseSeconds = allAttempts ? Math.round((allSeconds / allAttempts) * 10) / 10 : 0;
  next.weakTypes = Object.entries(next.typeStats)
    .filter(([, stat]) => stat.wrong > 0 || stat.timeout > 0 || stat.firstTryCorrect / stat.shown < 0.75)
    .sort(([, a], [, b]) => b.wrong + b.timeout - (a.wrong + a.timeout))
    .map(([type]) => type)
    .slice(0, 8);
  next.reviewTypes = Array.from(new Set([...result.weakTypes, ...next.weakTypes])).slice(0, 12);
  return next;
}
