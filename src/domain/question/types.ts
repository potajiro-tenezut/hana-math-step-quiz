export type UnitGroup =
  | "divisors"
  | "radicals"
  | "expressions"
  | "linear"
  | "systems"
  | "quadratic";

export type StepChoice = {
  id: string;
  label: string;
  labelLatex?: string;
  isCorrect: boolean;
  incorrectReason?: string;
};

export type SolutionStep = {
  id: string;
  stateLatex: string;
  instruction?: string;
  choices: [StepChoice, StepChoice, StepChoice];
  correctChoiceId: string;
  afterLatex: string;
  correctExplanation: string;
  isFinalStep?: boolean;
};

export type QuestionFlow = {
  id: string;
  fingerprint: string;
  unitId: string;
  unitName: string;
  unitGroup: UnitGroup;
  questionType: string;
  promptText: string;
  promptLatex?: string;
  initialStateLatex: string;
  steps: SolutionStep[];
  finalAnswerLatex: string;
  parameters: Record<string, string | number | boolean>;
  answerCheck: {
    kind: "exactLatex" | "numeric" | "set" | "identity";
    expected: string;
  };
};

export type QuestionGenerator = {
  type: string;
  unitId: string;
  unitName: string;
  unitGroup: UnitGroup;
  label: string;
  generate: (seed: string) => QuestionFlow;
};

export const unitLabels: Record<UnitGroup, string> = {
  divisors: "約数と倍数",
  radicals: "根号を含む式の計算",
  expressions: "式の値",
  linear: "1次方程式・比例式",
  systems: "連立方程式",
  quadratic: "2次方程式",
};
