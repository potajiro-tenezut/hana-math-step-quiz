import { describe, expect, it } from "vitest";
import { splitMathText } from "../lib/mathText";

describe("splitMathText", () => {
  it("renders a formula at the beginning of Japanese prompt text", () => {
    expect(splitMathText("x^2+3x-7=0を解の公式で解く")).toEqual([
      { kind: "math", value: "x^2+3x-7=0" },
      { kind: "text", value: "を解の公式で解く" },
    ]);
  });

  it("renders formulas embedded in a choice label", () => {
    expect(
      splitMathText("a=1、b=3、c=-7と見立てて、x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}に代入する"),
    ).toEqual([
      { kind: "math", value: "a=1" },
      { kind: "text", value: "、" },
      { kind: "math", value: "b=3" },
      { kind: "text", value: "、" },
      { kind: "math", value: "c=-7" },
      { kind: "text", value: "と見立てて、" },
      { kind: "math", value: "x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}" },
      { kind: "text", value: "に代入する" },
    ]);
  });
});
