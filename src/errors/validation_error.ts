import { AppError } from './app_error'

export class ValidationError extends AppError {
  readonly fields?: Record<string, string[] | undefined>

  constructor(message: string, action: string, fields?: Record<string, string[] | undefined>) {
    super(message, action, 400)
    this.fields = fields
  }
}
