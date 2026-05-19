import { Request, Response, NextFunction } from 'express'
import { AppError, ValidationError } from '../errors'

export function error_handler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.status_code).json({
      name: err.name,
      action: err.action,
      message: err.message,
      status_code: err.status_code,
      ...(err instanceof ValidationError && { fields: err.fields }),
    })
    return
  }

  console.error(err)
  res.status(500).json({
    name: 'InternalServerError',
    action: 'Try again later or contact support.',
    message: 'Internal server error.',
    status_code: 500,
  })
}
