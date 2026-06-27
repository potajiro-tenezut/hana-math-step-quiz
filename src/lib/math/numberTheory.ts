export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    [x, y] = [y, x % y];
  }
  return x;
}

export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs((a / gcd(a, b)) * b);
}

export function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

export function primeFactorization(n: number): Record<number, number> {
  const result: Record<number, number> = {};
  let value = Math.abs(n);
  for (let p = 2; p * p <= value; p += p === 2 ? 1 : 2) {
    while (value % p === 0) {
      result[p] = (result[p] ?? 0) + 1;
      value /= p;
    }
  }
  if (value > 1) result[value] = (result[value] ?? 0) + 1;
  return result;
}

export function divisors(n: number): number[] {
  const ds: number[] = [];
  for (let i = 1; i * i <= n; i += 1) {
    if (n % i === 0) {
      ds.push(i);
      if (i * i !== n) ds.push(n / i);
    }
  }
  return ds.sort((a, b) => a - b);
}

export function factorLatex(n: number): string {
  const factors = primeFactorization(n);
  return Object.entries(factors)
    .map(([p, e]) => (e === 1 ? p : `${p}^{${e}}`))
    .join("\\times ");
}
