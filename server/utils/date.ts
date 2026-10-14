const TZ = 'Asia/Ho_Chi_Minh'

export const vnDate = (d = new Date()): string =>
  d.toLocaleDateString('sv-SE', { timeZone: TZ }) // format YYYY-MM-DD

export const vnYesterday = (): string =>
  vnDate(new Date(Date.now() - 24 * 3600 * 1000))

