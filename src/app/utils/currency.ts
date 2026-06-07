export function formatMXN(amount: number, showDecimals: boolean = false): string {
  const formatted = showDecimals
    ? amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : amount.toLocaleString('es-MX');

  return `$${formatted} MXN`;
}

export function formatMXNShort(amount: number): string {
  return `$${amount.toLocaleString('es-MX')}`;
}
