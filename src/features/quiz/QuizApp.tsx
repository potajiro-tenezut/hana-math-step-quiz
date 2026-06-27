import { useCallback, useMemo, useState } from "react";
import { Latex } from "../../components/Latex";
import { QuestionFlow, SolutionStep, UnitGroup, unitLabels } from "../../domain/question/types";
import { generators, generateSession } from "../../data/generators";
import { useStepTimer } from "../../hooks/useStepTimer";
import {
  buildSessionResult,
  clearHistory,
  loadHistory,
  mergeSession,
  saveHistory,
  SessionResult,
  StepAttempt,
} from "../../lib/storage/history";
import "./quiz.css";

type Screen = "home" | "unit" | "quiz" | "result" | "settings";

const sessionSize = 10;
const unitGroups: UnitGroup[] = ["divisors", "radicals", "expressions", "linear", "systems", "quadratic"];

export function QuizApp() {
  const [screen, setScreen] = useState<Screen>("home");
  const [questions, setQuestions] = useState<QuestionFlow[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [disabledChoices, setDisabledChoices] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ kind: "correct" | "wrong" | "timeout"; text: string } | null>(null);
  const [attemptStart, setAttemptStart] = useState(() => Date.now());
  const [attemptWrongCount, setAttemptWrongCount] = useState(0);
  const [firstTry, setFirstTry] = useState(true);
  const [attempts, setAttempts] = useState<StepAttempt[]>([]);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [history, setHistory] = useState(loadHistory);
  const [animateKey, setAnimateKey] = useState(0);

  const current = questions[questionIndex];
  const currentStep = current?.steps[stepIndex];
  const timerActive = screen === "quiz" && Boolean(currentStep) && feedback?.kind !== "timeout";

  const recordAttempt = useCallback(
    (timedOut: boolean, wrongCount = attemptWrongCount) => {
      if (!current) return null;
      const attempt = {
        questionType: current.questionType,
        unitGroup: current.unitGroup,
        firstTryCorrect: firstTry && !timedOut,
        wrongCount,
        timedOut,
        responseSeconds: Math.min(20, Math.round((Date.now() - attemptStart) / 1000)),
      };
      setAttempts((items) => [...items, attempt]);
      return attempt;
    },
    [attemptStart, attemptWrongCount, current, firstTry],
  );

  const handleTimeout = useCallback(() => {
    if (!currentStep || feedback) return;
    recordAttempt(true);
    const correct = currentStep.choices.find((c) => c.id === currentStep.correctChoiceId);
    setFeedback({
      kind: "timeout",
      text: `時間切れ。正しい打ち手は「${correct?.label ?? ""}」です。${currentStep.correctExplanation}`,
    });
  }, [currentStep, feedback, recordAttempt]);

  const remaining = useStepTimer(timerActive, `${questionIndex}-${stepIndex}-${animateKey}`, handleTimeout);

  const start = (unitGroup?: UnitGroup, review = false) => {
    const reviewTypes = review ? history.reviewTypes : [];
    const seed = `hana-${Date.now()}-${unitGroup ?? "all"}-${reviewTypes.join(",")}`;
    const next = generateSession(seed, sessionSize, unitGroup, reviewTypes);
    setQuestions(next);
    setQuestionIndex(0);
    setStepIndex(0);
    setDisabledChoices([]);
    setFeedback(null);
    setAttemptStart(Date.now());
    setAttemptWrongCount(0);
    setFirstTry(true);
    setAttempts([]);
    setResult(null);
    setAnimateKey((k) => k + 1);
    setScreen("quiz");
  };

  const advance = (completedAttempts = attempts) => {
    if (!current || !currentStep) return;
    setFeedback(null);
    setDisabledChoices([]);
    setAttemptWrongCount(0);
    setFirstTry(true);
    setAttemptStart(Date.now());
    setAnimateKey((k) => k + 1);
    if (stepIndex < current.steps.length - 1) {
      setStepIndex((i) => i + 1);
      return;
    }
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((i) => i + 1);
      setStepIndex(0);
      return;
    }
    finish(completedAttempts);
  };

  const choose = (choiceId: string) => {
    if (!currentStep || disabledChoices.includes(choiceId) || feedback?.kind === "timeout") return;
    const picked = currentStep.choices.find((c) => c.id === choiceId);
    if (!picked) return;
    if (picked.isCorrect) {
      const attempt = recordAttempt(false);
      setFeedback({ kind: "correct", text: `正解。${currentStep.correctExplanation}` });
      const nextAttempts = attempt ? [...attempts, attempt] : attempts;
      window.setTimeout(() => advance(nextAttempts), currentStep.isFinalStep ? 650 : 850);
    } else {
      setFirstTry(false);
      setAttemptWrongCount((n) => n + 1);
      setDisabledChoices((items) => [...items, picked.id]);
      setFeedback({ kind: "wrong", text: picked.incorrectReason ?? "この操作では現在の式の条件を保てません。" });
    }
  };

  const followCorrectRoute = () => {
    if (!currentStep) return;
    advance();
  };

  const finish = (finalAttempts: StepAttempt[]) => {
    const meta = questions.map((q) => ({ questionType: q.questionType, promptText: q.promptText, unitName: q.unitName }));
    const sessionResult = buildSessionResult(`session-${Date.now()}`, finalAttempts, meta);
    const nextHistory = mergeSession(history, sessionResult, finalAttempts);
    saveHistory(nextHistory);
    setHistory(nextHistory);
    setResult(sessionResult);
    setScreen("result");
  };

  const clear = () => {
    if (window.confirm("学習履歴を削除します。よろしいですか？")) {
      clearHistory();
      setHistory(loadHistory());
    }
  };

  const weakLabels = useMemo(
    () => history.reviewTypes.map((type) => generators.find((g) => g.type === type)?.label ?? type),
    [history.reviewTypes],
  );

  if (screen === "unit") {
    return (
      <main className="appShell">
        <Header onSettings={() => setScreen("settings")} />
        <section className="panel">
          <button className="ghostButton" type="button" onClick={() => setScreen("home")}>← 戻る</button>
          <h1>単元を選んで練習</h1>
          <div className="unitGrid">
            {unitGroups.map((unit) => (
              <button className="unitButton" key={unit} type="button" onClick={() => start(unit)}>
                <span>{unitLabels[unit]}</span>
                <small>{generators.filter((g) => g.unitGroup === unit).length}タイプ</small>
              </button>
            ))}
          </div>
        </section>
      </main>
    );
  }

  if (screen === "settings") {
    return (
      <main className="appShell">
        <Header onSettings={() => setScreen("settings")} />
        <section className="panel">
          <button className="ghostButton" type="button" onClick={() => setScreen("home")}>← 戻る</button>
          <h1>設定</h1>
          <p className="muted">総学習回数: {history.totalSessions}回 / 平均回答時間: {history.averageResponseSeconds}秒</p>
          <button className="dangerButton" type="button" onClick={clear}>履歴を削除</button>
        </section>
      </main>
    );
  }

  if (screen === "result" && result) {
    const firstRate = result.totalSteps ? Math.round((result.firstTryCorrectSteps / result.totalSteps) * 100) : 0;
    return (
      <main className="appShell">
        <Header onSettings={() => setScreen("settings")} />
        <section className="panel">
          <h1>結果</h1>
          <div className="statsGrid">
            <Stat label="完了問題" value={`${result.completedQuestions}/${sessionSize}`} />
            <Stat label="最終回答到達" value={`${result.reachedFinalAnswer}`} />
            <Stat label="全ステップ" value={`${result.totalSteps}`} />
            <Stat label="初回正答率" value={`${firstRate}%`} />
            <Stat label="不正解" value={`${result.wrongCount}`} />
            <Stat label="時間切れ" value={`${result.timeoutCount}`} />
            <Stat label="平均回答時間" value={`${result.averageResponseSeconds}秒`} />
          </div>
          <h2>苦手な問題タイプ</h2>
          <ul className="missList">
            {(result.weakTypes.length ? result.weakTypes : ["今回は大きな苦手タイプはありません"]).map((item) => (
              <li key={item}>{generators.find((g) => g.type === item)?.label ?? item}</li>
            ))}
          </ul>
          <div className="actionRow">
            <button type="button" onClick={() => start()}>もう一度挑戦</button>
            <button type="button" onClick={() => start(undefined, true)} disabled={history.reviewTypes.length === 0}>
              間違えた問題タイプを復習
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (screen === "quiz" && current && currentStep) {
    const progress = ((questionIndex + 1) / questions.length) * 100;
    return (
      <main className="quizShell">
        <header className="quizTop">
          <div>
            <span className="badge">{current.unitName}</span>
            <p>{questionIndex + 1}/{questions.length}問 ・ ステップ {stepIndex + 1}/{current.steps.length}</p>
          </div>
          <div className="timer" aria-label={`残り${remaining}秒`}>
            <span aria-hidden="true">⏱</span>
            <strong>{remaining}</strong>
          </div>
        </header>
        <div className="progressTrack"><span style={{ width: `${progress}%` }} /></div>
        {remaining === 5 && <p className="srOnly" aria-live="polite">残り5秒です</p>}
        <section className="questionArea">
          <p className="prompt">{current.promptText}</p>
          <div className="formulaCard formulaChange" key={`${currentStep.id}-${animateKey}`}>
            <Latex value={currentStep.stateLatex} block />
          </div>
        </section>
        <ChoiceList step={currentStep} disabledChoices={disabledChoices} feedback={feedback} onChoose={choose} />
        {feedback && (
          <section className={`feedback ${feedback.kind}`} aria-live="polite" role="status">
            <strong>{feedback.kind === "correct" ? "✓ 正解" : feedback.kind === "wrong" ? "× もう一度" : "時間切れ"}</strong>
            <p>{feedback.text}</p>
            {feedback.kind === "timeout" && <button type="button" onClick={followCorrectRoute}>正しい手順で進む</button>}
          </section>
        )}
      </main>
    );
  }

  return (
    <main className="appShell">
      <Header onSettings={() => setScreen("settings")} />
      <section className="homeHero">
        <div className="flowerMark" aria-hidden="true"><span /><span /><span /><span /><i /></div>
        <h1>Hana 数学ステップクイズ</h1>
        <p>最終答えではなく、次に行う式変形を3択で選びながら解き進めます。</p>
        <div className="actionGrid">
          <button type="button" onClick={() => start()}>全範囲ランダム</button>
          <button type="button" onClick={() => setScreen("unit")}>単元を選んで練習</button>
          <button type="button" onClick={() => start(undefined, true)} disabled={history.reviewTypes.length === 0}>
            間違えた問題を復習
          </button>
        </div>
        <p className="muted">復習候補: {weakLabels.length ? weakLabels.join("、") : "まだありません"}</p>
      </section>
    </main>
  );
}

function ChoiceList({
  step,
  disabledChoices,
  feedback,
  onChoose,
}: {
  step: SolutionStep;
  disabledChoices: string[];
  feedback: { kind: string; text: string } | null;
  onChoose: (id: string) => void;
}) {
  return (
    <section className="choices" aria-label="次に行うべき打ち手">
      {step.choices.map((choice) => {
        const disabled = disabledChoices.includes(choice.id) || feedback?.kind === "timeout" || feedback?.kind === "correct";
        const state = disabledChoices.includes(choice.id) ? "wrongChoice" : feedback?.kind === "timeout" && choice.isCorrect ? "correctChoice" : "";
        return (
          <button
            className={`choice ${state}`}
            key={choice.id}
            type="button"
            disabled={disabled}
            data-correct={choice.isCorrect ? "true" : "false"}
            onClick={() => onChoose(choice.id)}
          >
            <span>{state === "wrongChoice" ? "×" : state === "correctChoice" ? "✓" : "○"}</span>
            <span>{choice.label}</span>
            {choice.labelLatex && <Latex value={choice.labelLatex} />}
          </button>
        );
      })}
    </section>
  );
}

function Header({ onSettings }: { onSettings: () => void }) {
  return (
    <header className="appHeader">
      <div className="brand"><span className="miniFlower" aria-hidden="true" />Hana</div>
      <button className="iconButton" type="button" aria-label="設定" onClick={onSettings}>⚙</button>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
