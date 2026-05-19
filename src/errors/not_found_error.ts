import { AppError } from './app_error'

export class NotFoundError extends AppError {
  constructor(message: string, action: string) {
    super(message, action, 404)
  }
}
