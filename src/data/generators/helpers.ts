import { QuestionFlow, SolutionStep, StepChoice, UnitGroup } from "../../domain/question/types";
import { SeededRandom } from "../../lib/random/seededRandom";

export function choice(
  id: string,
  label: string,
  isCorrect: boolean,
  incorrectReason?: string,
  labelLatex?: string,
): StepChoice {
  return { id, label, isCorrect, incorrectReason, labelLatex };
}

export function step(
  random: SeededRandom,
  id: string,
  stateLatex: string,
  correct: StepChoice,
  wrongA: StepChoice,
  wrongB: StepChoice,
  afterLatex: string,
  correctExplanation: string,
  isFinalStep = false,
): SolutionStep {
  const choices = random.shuffle([correct, wrongA, wrongB]) as [StepChoice, StepChoice, StepChoice];
  return {
    id,
    stateLatex,
    choices,
    correctChoiceId: correct.id,
    afterLatex,
    correctExplanation,
    isFinalStep,
  };
}

export function makeQuestion(args: {
  seed: string;
  type: string;
  unitId: string;
  unitName: string;
  unitGroup: UnitGroup;
  promptText: string;
  promptLatex?: string;
  initialStateLatex: string;
  steps: SolutionStep[];
  finalAnswerLatex: string;
  parameters: Record<string, string | number | boolean>;
}): QuestionFlow {
  const paramKey = Object.entries(args.parameters)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join("|");
  const fingerprint = `${args.type}|${paramKey}`;
  return {
    id: `${args.type}-${hashText(`${args.seed}|${fingerprint}`).toString(36)}`,
    fingerprint,
    unitId: args.unitId,
    unitName: args.unitName,
    unitGroup: args.unitGroup,
    questionType: args.type,
    promptText: args.promptText,
    promptLatex: args.promptLatex,
    initialStateLatex: args.initialStateLatex,
    steps: args.steps,
    finalAnswerLatex: args.finalAnswerLatex,
    parameters: args.parameters,
    answerCheck: { kind: "exactLatex", expected: args.finalAnswerLatex },
  };
}

export function hashText(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = Math.imul(31, h) + text.charCodeAt(i);
  return h >>> 0;
}

export function signed(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

export function term(coef: number, variable: string): string {
  if (coef === 1) return variable;
  if (coef === -1) return `-${variable}`;
  return `${coef}${variable}`;
}

export function nonZero(random: SeededRandom, min: number, max: number): number {
  let value = 0;
  while (value === 0) value = random.int(min, max);
  return value;
}
