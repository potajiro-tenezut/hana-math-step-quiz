export type SimpleRadical = { coefficient: number; radicand: number };

export function simplifyRadical(n: number): SimpleRadical {
  if (n < 0) throw new Error("radicand must not be negative");
  if (n === 0) return { coefficient: 0, radicand: 1 };
  let coefficient = 1;
  let rest = n;
  for (let p = 2; p * p <= rest; p += 1) {
    while (rest % (p * p) === 0) {
      coefficient *= p;
      rest /= p * p;
    }
  }
  return { coefficient, radicand: rest };
}

export function radicalLatex(value: SimpleRadical): string {
  if (value.coefficient === 0) return "0";
  if (value.radicand === 1) return `${value.coefficient}`;
  if (value.coefficient === 1) return `\\sqrt{${value.radicand}}`;
  if (value.coefficient === -1) return `-\\sqrt{${value.radicand}}`;
  return `${value.coefficient}\\sqrt{${value.radicand}}`;
}
