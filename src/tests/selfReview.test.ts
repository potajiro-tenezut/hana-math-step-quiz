import katex from "katex";
import { describe, expect, it } from "vitest";
import { generators } from "../data/generators";
import { QuestionFlow, StepChoice } from "../domain/question/types";
import { splitMathText } from "../lib/mathText";

const learnerFacingHardTerms = [
  /\\pmod/i,
  /\\bmod/i,
  /\bmod\b/i,
  /≡/,
  /合同/,
  /剰余/,
  /中国剰余/,
  /\bGCD\b/i,
  /\bLCM\b/i,
  /周期にする/,
];

const vagueChoiceLabels = [
  "整理する",
  "計算する",
  "公式を使う",
  "解の公式を使う",
  "移項する",
  "因数分解する",
  "分母を有理化する",
];

describe("self review: learner-facing math quality", () => {
  const samples = generators.flatMap((generator) =>
    Array.from({ length: 12 }, (_, index) => ({
      generator,
      question: generator.generate(`self-review-${index}`),
    })),
  );

  it("does not show high-abstraction notation to learners", () => {
    const violations = samples.flatMap(({ generator, question }) =>
      learnerTexts(generator.label, question)
        .filter(({ text }) => learnerFacingHardTerms.some((pattern) => pattern.test(text)))
        .map(({ location, text }) => `${question.questionType} ${location}: ${text}`),
    );

    expect(unique(violations)).toEqual([]);
  });

  it("keeps current formula states renderable by KaTeX", () => {
    const violations = samples.flatMap(({ question }) =>
      question.steps
        .filter((step) => !canRenderLatex(step.stateLatex))
        .map((step) => `${question.questionType} ${step.id}: ${step.stateLatex}`),
    );

    expect(unique(violations)).toEqual([]);
  });

  it("keeps inline math snippets renderable by KaTeX", () => {
    const violations = samples.flatMap(({ generator, question }) =>
      learnerTexts(generator.label, question).flatMap(({ location, text }) =>
        splitMathText(text)
          .filter((part) => part.kind === "math" && !canRenderLatex(part.value))
          .map((part) => `${question.questionType} ${location}: ${part.value}`),
      ),
    );

    expect(unique(violations)).toEqual([]);
  });

  it("uses concrete choice labels instead of vague commands", () => {
    const violations = samples.flatMap(({ question }) =>
      question.steps.flatMap((step) =>
        step.choices
          .filter((choice) => isVagueChoice(choice))
          .map((choice) => `${question.questionType} ${step.id}/${choice.id}: ${choice.label}`),
      ),
    );

    expect(unique(violations)).toEqual([]);
  });

  it("keeps choices scan-friendly and avoids one answer being obviously longer", () => {
    const violations = samples.flatMap(({ question }) =>
      question.steps.flatMap((step) => {
        const lengths = step.choices.map((choice) => visibleLength(choice.label));
        const correct = step.choices.find((choice) => choice.id === step.correctChoiceId);
        const wrongMax = Math.max(
          ...step.choices.filter((choice) => choice.id !== step.correctChoiceId).map((choice) => visibleLength(choice.label)),
        );
        const tooLong = step.choices
          .filter((choice) => visibleLength(choice.label) > 95)
          .map((choice) => `${question.questionType} ${step.id}/${choice.id}: ${visibleLength(choice.label)} chars`);
        const lopsided =
          correct && visibleLength(correct.label) > wrongMax + 45
            ? [`${question.questionType} ${step.id}: correct choice is much longer (${lengths.join(", ")})`]
            : [];
        return [...tooLong, ...lopsided];
      }),
    );

    expect(unique(violations)).toEqual([]);
  });
});

function learnerTexts(generatorLabel: string, question: QuestionFlow): Array<{ location: string; text: string }> {
  return [
    { location: "generator label", text: generatorLabel },
    { location: "unit", text: question.unitName },
    { location: "prompt", text: question.promptText },
    ...question.steps.flatMap((step) => [
      { location: `${step.id} explanation`, text: step.correctExplanation },
      ...step.choices.flatMap((choice) => [
        { location: `${step.id}/${choice.id} label`, text: choice.label },
        ...(choice.incorrectReason ? [{ location: `${step.id}/${choice.id} reason`, text: choice.incorrectReason }] : []),
      ]),
    ]),
  ];
}

function canRenderLatex(value: string): boolean {
  try {
    katex.renderToString(value, { throwOnError: true, strict: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function isVagueChoice(choice: StepChoice): boolean {
  const normalized = choice.label.trim();
  return vagueChoiceLabels.includes(normalized);
}

function visibleLength(value: string): number {
  return value.replace(/\\[a-zA-Z]+/g, "").replace(/[{}\\]/g, "").length;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
