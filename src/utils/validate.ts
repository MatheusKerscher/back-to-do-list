import { ZodSchema } from 'zod'
import { ValidationError } from '../errors'

export function parse_or_throw<T>(schema: ZodSchema<T>, data: unknown): T {
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    throw new ValidationError(
      'Invalid input data.',
      'Fix the highlighted fields and try again.',
      parsed.error.flatten().fieldErrors,
    )
  }
  return parsed.data
}
