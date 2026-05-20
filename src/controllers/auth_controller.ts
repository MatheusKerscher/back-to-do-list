import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { CookieOptions } from 'express'
import { prisma } from '../lib/prisma'
import { ConflictError, UnauthorizedError } from '../errors'
import { parse_or_throw } from '../utils/validate'

const PEPPER = process.env.PASSWORD_PEPPER ?? ''
const JWT_SECRET = process.env.JWT_SECRET!
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: COOKIE_MAX_AGE,
}

function set_auth_cookie(res: Response, token: string): void {
  res.cookie('token', token, COOKIE_OPTIONS)
}

const register_schema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.'),
  email: z.string().trim().email('Invalid email address.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character.'),
})

const login_schema = z.object({
  email: z.string().trim().email('Invalid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password } = parse_or_throw(register_schema, req.body)

  const existing_user = await prisma.user.findUnique({ where: { email } })

  if (existing_user) {
    throw new ConflictError('Email already in use.', 'Use a different email or sign in.')
  }

  const hashed_password = await bcrypt.hash(PEPPER + password, 10)

  const user = await prisma.user.create({
    data: { name, email, password: hashed_password },
    select: { id: true, name: true, email: true, created_at: true },
  })

  const token = jwt.sign({ user_id: user.id }, JWT_SECRET, { expiresIn: '7d' })
  set_auth_cookie(res, token)

  res.status(201).json({ user })
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = parse_or_throw(login_schema, req.body)

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || !(await bcrypt.compare(PEPPER + password, user.password))) {
    throw new UnauthorizedError('Invalid credentials.', 'Check your email and password.')
  }

  const token = jwt.sign({ user_id: user.id }, JWT_SECRET, { expiresIn: '7d' })
  set_auth_cookie(res, token)

  res.json({ user: { id: user.id, name: user.name, email: user.email } })
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie('token', COOKIE_OPTIONS)
  res.json({ message: 'Logged out successfully.' })
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.user_id },
    select: { id: true, name: true, email: true, created_at: true },
  })

  res.json({ user })
}
