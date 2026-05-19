import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'
import { UnauthorizedError } from '../errors'

interface JwtPayload {
  user_id: string
}

declare module 'express-serve-static-core' {
  interface Request {
    user_id?: string
  }
}

export async function auth_middleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.cookies?.token

  if (!token) {
    throw new UnauthorizedError('Token not provided.', 'Sign in to continue.')
  }

  let payload: JwtPayload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
  } catch {
    throw new UnauthorizedError('Invalid or expired token.', 'Sign in again.')
  }

  const user = await prisma.user.findUnique({ where: { id: payload.user_id } })

  if (!user) {
    throw new UnauthorizedError('User not found.', 'Sign in again.')
  }

  req.user_id = payload.user_id
  next()
}
