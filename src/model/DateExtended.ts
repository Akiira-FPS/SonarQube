export class DateExtended extends Date {
  getWeek() {
    return Math.ceil((this.getTime() - new Date(this.getFullYear(), 0, 1).getTime()) / 86400000 / 7)
  }

  asUTC() {
    return new Date(
      Date.UTC(
        this.getFullYear(),
        this.getMonth(),
        this.getDate(),
        this.getHours(),
        this.getMinutes(),
        this.getSeconds(),
        this.getMilliseconds(),
      ),
    )
  }

  isSameYear(date: DateExtended) {
    const from = new DateExtended(this)
    const to = new DateExtended(date)
    return from.getFullYear() === to.getFullYear()
  }

  isSameMonth(date: DateExtended) {
    const from = new DateExtended(this)
    const to = new DateExtended(date)
    return from.getMonth() === to.getMonth() && from.isSameYear(to)
  }

  isSameWeek(date: DateExtended) {
    const from = new DateExtended(this)
    const to = new DateExtended(date)
    return from.getWeek() === to.getWeek() && from.isSameMonth(to)
  }

  isSameDate(date: DateExtended) {
    const from = new DateExtended(this)
    const to = new DateExtended(date)
    return from.getDate() === to.getDate() && from.isSameWeek(to)
  }

  isSameHour(date: DateExtended) {
    const from = new DateExtended(this)
    const to = new DateExtended(date)
    return from.getHours() === to.getHours() && from.isSameDate(to)
  }

  getNextYear() {
    let date = new Date()
    date.setFullYear(this.getFullYear() + 1)
    date.setMonth(0)
    date.setDate(1)
    date.setHours(0, 0, 0)
    return date
  }

  getNextMonth() {
    let date = new Date()
    date.setFullYear(this.getFullYear())
    date.setMonth(this.getMonth() + 1)
    date.setDate(1)
    date.setHours(0, 0, 0)
    return date
  }

  getNextWeek() {
    let date = new Date()
    date.setFullYear(this.getFullYear())
    date.setMonth(this.getMonth())
    date.setDate(this.getDate() + ((1 + 7 - this.getDay()) % 7 || 7))
    date.setHours(0, 0, 0)
    return date
  }

  getNextDate() {
    let date = new Date()
    date.setFullYear(this.getFullYear())
    date.setMonth(this.getMonth())
    date.setDate(this.getDate() + 1)
    date.setHours(0, 0, 0)
    return date
  }

  getNextHour() {
    let date = new Date()
    date.setFullYear(this.getFullYear())
    date.setMonth(this.getMonth())
    date.setDate(this.getDate())
    date.setHours(this.getHours() + 1, 0, 0)
    return date
  }

  calculateTimeFrame(timeFrame: number, unit = 'mn') {
    let timeAgo
    if (unit === 's') {
      timeAgo = new Date(Date.now() - timeFrame * 1000)
    } else if (unit === 'mn') {
      timeAgo = new Date(Date.now() - timeFrame * 60 * 1000)
    } else if (unit === 'd') {
      timeAgo = new Date(Date.now() - timeFrame * 24 * 60 * 60 * 1000)
    } else {
      throw new Error('Unsupported unit. Use "s" , "mn" or "d".')
    }
    return timeAgo.toISOString().replace('T', ' ').split('.')[0]
  }
}

export enum Granularity {
  Year = 'year',
  Month = 'month',
  Week = 'week',
  Day = 'day',
  Custom = 'custom',
}
