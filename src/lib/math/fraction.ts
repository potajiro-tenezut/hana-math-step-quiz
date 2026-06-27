import { gcd } from "./numberTheory";

export type Fraction = { n: number; d: number };

export function frac(n: number, d = 1): Fraction {
  if (d === 0) throw new Error("denominator must not be zero");
  const sign = d < 0 ? -1 : 1;
  const g = gcd(n, d);
  return { n: (sign * n) / g, d: Math.abs(d) / g };
}

export function add(a: Fraction, b: Fraction): Fraction {
  return frac(a.n * b.d + b.n * a.d, a.d * b.d);
}

export function sub(a: Fraction, b: Fraction): Fraction {
  return frac(a.n * b.d - b.n * a.d, a.d * b.d);
}

export function mul(a: Fraction, b: Fraction): Fraction {
  return frac(a.n * b.n, a.d * b.d);
}

export function div(a: Fraction, b: Fraction): Fraction {
  return frac(a.n * b.d, a.d * b.n);
}

export function fracLatex(f: Fraction): string {
  if (f.d === 1) return `${f.n}`;
  if (f.n < 0) return `-\\frac{${Math.abs(f.n)}}{${f.d}}`;
  return `\\frac{${f.n}}{${f.d}}`;
}
