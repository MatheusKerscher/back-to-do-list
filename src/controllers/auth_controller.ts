import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { ValidationError, ConflictError, UnauthorizedError } from '../errors'

const PEPPER = process.env.PASSWORD_PEPPER ?? ''
const JWT_SECRET = process.env.JWT_SECRET!
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000

const register_schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
})

const login_schema = z.object({
  email: z.email('Invalid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

export async function register(req: Request, res: Response): Promise<void> {
  const parsed = register_schema.safeParse(req.body)

  if (!parsed.success) {
    throw new ValidationError(
      'Invalid input data.',
      'Fix the highlighted fields and try again.',
      parsed.error.flatten().fieldErrors,
    )
  }

  const { name, email, password } = parsed.data

  const existing_user = await prisma.user.findUnique({ where: { email } })

  if (existing_user) {
    throw new ConflictError('Email already in use.', 'Use a different email or sign in.')
  }

  const hashed_password = await bcrypt.hash(PEPPER + password, 10)

  const user = await prisma.user.create({
    data: { name, email, password: hashed_password },
    select: { id: true, name: true, email: true, created_at: true },
  })

  res.status(201).json({ user })
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = login_schema.safeParse(req.body)

  if (!parsed.success) {
    throw new ValidationError(
      'Invalid input data.',
      'Fix the highlighted fields and try again.',
      parsed.error.flatten().fieldErrors,
    )
  }

  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || !(await bcrypt.compare(PEPPER + password, user.password))) {
    throw new UnauthorizedError('Invalid credentials.', 'Check your email and password.')
  }

  const token = jwt.sign({ user_id: user.id }, JWT_SECRET, { expiresIn: '7d' })

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
  })

  res.json({ user: { id: user.id, name: user.name, email: user.email } })
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  })
  res.json({ message: 'Logged out successfully.' })
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.user_id },
    select: { id: true, name: true, email: true, created_at: true },
  })

  res.json({ user })
}
