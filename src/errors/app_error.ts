export class AppError extends Error {
  readonly action: string
  readonly status_code: number

  constructor(message: string, action: string, status_code: number) {
    super(message)
    this.name = this.constructor.name
    this.action = action
    this.status_code = status_code
  }
}
