export function npv(rate: number, cashflows: number[]): number {
  return cashflows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0)
}

export function irrPeriodic(cashflows: number[]): number | null {
  // Búsqueda por bisección amplia para flujos típicos de crédito
  const f = (r: number) => npv(r, cashflows)
  let a = -0.9999, b = 2.0
  let fa = f(a), fb = f(b)
  if (!isFinite(fa) || !isFinite(fb) || isNaN(fa) || isNaN(fb)) return null
  let iter = 0
  while (fa * fb > 0 && iter < 20) {
    b += 1
    fb = f(b)
    iter++
    if (!isFinite(fb)) break
  }
  if (fa * fb > 0) return null
  for (let i = 0; i < 100; i++) {
    const m = (a + b) / 2
    const fm = f(m)
    if (Math.abs(fm) < 1e-9) return m
    if (fa * fm < 0) { b = m; fb = fm } else { a = m; fa = fm }
  }
  return (a + b) / 2
}
