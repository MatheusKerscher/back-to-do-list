import { AppError } from './app_error'

export class ForbiddenError extends AppError {
  constructor(message: string, action: string) {
    super(message, action, 403)
  }
}
