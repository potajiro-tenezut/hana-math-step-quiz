import { gcd, lcm } from "./numberTheory";

export function verifyLinear(a: number, b: number, c: number, x: number): boolean {
  return a * x + b === c;
}

export function verifySystem2(
  eq1: [number, number, number],
  eq2: [number, number, number],
  x: number,
  y: number,
): boolean {
  return eq1[0] * x + eq1[1] * y === eq1[2] && eq2[0] * x + eq2[1] * y === eq2[2];
}

export function verifyQuadratic(a: number, b: number, c: number, x: number): boolean {
  return a * x * x + b * x + c === 0;
}

export function verifyGcdLcm(a: number, b: number, expectedGcd: number, expectedLcm: number): boolean {
  return gcd(a, b) === expectedGcd && lcm(a, b) === expectedLcm;
}
