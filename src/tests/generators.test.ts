import { describe, expect, it } from "vitest";
import { generators, validateQuestion } from "../data/generators";

describe("question generators", () => {
  it("registers all required problem patterns", () => {
    expect(generators.length).toBeGreaterThanOrEqual(44);
    expect(new Set(generators.map((g) => g.unitGroup))).toEqual(
      new Set(["divisors", "radicals", "expressions", "linear", "systems", "quadratic"]),
    );
  });

  it("generates valid question flow data", () => {
    for (const gen of generators) {
      const question = gen.generate("sample-seed");
      validateQuestion(question);
      expect(question.id).toContain(gen.type);
      expect(question.fingerprint).toContain(gen.type);
      expect(question.initialStateLatex).toBe(question.steps[0].stateLatex);
      for (const s of question.steps) {
        expect(s.choices).toHaveLength(3);
        expect(s.choices.filter((c) => c.isCorrect)).toHaveLength(1);
        expect(s.choices.every((c) => c.label.length > 0)).toBe(true);
      }
    }
  });

  it("recreates the same question with the same seed", () => {
    const gen = generators[0];
    expect(gen.generate("fixed")).toEqual(gen.generate("fixed"));
  });

  it("changes parameters for different seeds when possible", () => {
    const gen = generators.find((g) => g.type === "linear-basic")!;
    expect(gen.generate("a").fingerprint).not.toEqual(gen.generate("b").fingerprint);
  });

  it("stress-generates every type without exceptions", () => {
    for (const gen of generators) {
      for (let i = 0; i < 100; i += 1) {
        const q = gen.generate(`stress-${i}`);
        validateQuestion(q);
        expect(q.steps.at(-1)?.afterLatex).toBe(q.finalAnswerLatex);
        expect(q.fingerprint).not.toContain("NaN");
      }
    }
  });
});
