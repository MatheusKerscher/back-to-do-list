import { AppError } from './app_error'

export class UnauthorizedError extends AppError {
  constructor(message: string, action: string) {
    super(message, action, 401)
  }
}
