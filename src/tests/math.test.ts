import { describe, expect, it } from "vitest";
import { frac } from "../lib/math/fraction";
import { gcd, isPrime, lcm, primeFactorization } from "../lib/math/numberTheory";
import { simplifyRadical } from "../lib/math/radical";
import { SeededRandom } from "../lib/random/seededRandom";

describe("math utilities", () => {
  it("calculates gcd and lcm", () => {
    expect(gcd(48, 72)).toBe(24);
    expect(lcm(48, 72)).toBe(144);
  });

  it("checks primes", () => {
    expect(isPrime(2)).toBe(true);
    expect(isPrime(59)).toBe(true);
    expect(isPrime(60)).toBe(false);
  });

  it("factorizes integers", () => {
    expect(primeFactorization(252)).toEqual({ 2: 2, 3: 2, 7: 1 });
  });

  it("reduces fractions", () => {
    expect(frac(18, -24)).toEqual({ n: -3, d: 4 });
  });

  it("simplifies radicals", () => {
    expect(simplifyRadical(75)).toEqual({ coefficient: 5, radicand: 3 });
  });

  it("is deterministic for the same seed", () => {
    const a = new SeededRandom("hana");
    const b = new SeededRandom("hana");
    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()]);
  });
});
