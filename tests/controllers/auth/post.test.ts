import request from 'supertest'
import setCookieParser from 'set-cookie-parser'
import { app } from '../../../src/app'
import { notify_auth } from '../../../src/services/discord_service'

jest.mock('../../../src/services/discord_service', () => ({
  notify_auth: jest.fn(),
  notify_alert: jest.fn(),
  notify_error: jest.fn(),
}))
jest.mock('axios', () => ({ post: jest.fn() }))

describe('POST /auth/register', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('anonymous user', () => {
    it('returns 201 and creates user with valid data', async () => {
      const res = await request(app).post('/auth/register').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password@123',
      })

      expect(res.status).toBe(201)
      expect(res.body.user).toMatchObject({ name: 'John Doe' })
      expect(res.body.user).not.toHaveProperty('email')
      expect(res.body.user).not.toHaveProperty('password_hash')
      const parsedSetCookie = setCookieParser(res, { map: true })
      expect(parsedSetCookie.token.name).toBe('token')
      expect(parsedSetCookie.token.httpOnly).toBe(true)
      expect(parsedSetCookie.token.path).toBe('/')
      expect(parsedSetCookie.token.maxAge).toBe(3600)
      expect(parsedSetCookie.token.sameSite).toBe('Lax')
      expect(notify_auth).toHaveBeenCalledWith('register', 'john@example.com')
    })

    it('returns 400 when name is too short', async () => {
      const res = await request(app).post('/auth/register').send({
        name: 'J',
        email: 'john@example.com',
        password: 'Password@123',
      })

      expect(res.status).toBe(400)
      expect(res.body.name).toBe('ValidationError')
      expect(res.body.fields.name).toBeDefined()
    })

    it('returns 400 when email is invalid', async () => {
      const res = await request(app).post('/auth/register').send({
        name: 'John Doe',
        email: 'not-an-email',
        password: 'Password@123',
      })

      expect(res.status).toBe(400)
      expect(res.body.name).toBe('ValidationError')
      expect(res.body.fields.email).toBeDefined()
    })

    it('returns 400 when password is too short', async () => {
      const res = await request(app).post('/auth/register').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Ab@1',
      })

      expect(res.status).toBe(400)
      expect(res.body.name).toBe('ValidationError')
      expect(res.body.fields.password).toBeDefined()
    })

    it('returns 400 when password has no lowercase letter', async () => {
      const res = await request(app).post('/auth/register').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'PASSWORD@123',
      })

      expect(res.status).toBe(400)
      expect(res.body.name).toBe('ValidationError')
      expect(res.body.fields.password).toBeDefined()
    })

    it('returns 400 when password has no uppercase letter', async () => {
      const res = await request(app).post('/auth/register').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password@123',
      })

      expect(res.status).toBe(400)
      expect(res.body.name).toBe('ValidationError')
      expect(res.body.fields.password).toBeDefined()
    })

    it('returns 400 when password has no number', async () => {
      const res = await request(app).post('/auth/register').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password@abc',
      })

      expect(res.status).toBe(400)
      expect(res.body.name).toBe('ValidationError')
      expect(res.body.fields.password).toBeDefined()
    })

    it('returns 400 when password has no special character', async () => {
      const res = await request(app).post('/auth/register').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
      })

      expect(res.status).toBe(400)
      expect(res.body.name).toBe('ValidationError')
      expect(res.body.fields.password).toBeDefined()
    })

    it('returns 409 when email is already in use', async () => {
      await request(app).post('/auth/register').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password@123',
      })

      const res = await request(app).post('/auth/register').send({
        name: 'Another User',
        email: 'john@example.com',
        password: 'Password@456',
      })

      expect(res.status).toBe(409)
      expect(res.body.name).toBe('ConflictError')
      expect(notify_auth).toHaveBeenCalledWith(
        'register_conflict',
        'john@example.com',
        expect.any(String),
      )
    })
  })
})

describe('POST /auth/login', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await request(app).post('/auth/register').send({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password@123',
    })
  })

  describe('anonymous user', () => {
    it('returns 200 and sets cookie with valid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'john@example.com', password: 'Password@123' })

      expect(res.status).toBe(200)
      expect(res.body.user).toMatchObject({ email: 'john@example.com' })
      const parsedSetCookie = setCookieParser(res, { map: true })
      expect(parsedSetCookie.token.name).toBe('token')
      expect(parsedSetCookie.token.httpOnly).toBe(true)
      expect(parsedSetCookie.token.path).toBe('/')
      expect(parsedSetCookie.token.maxAge).toBe(3600)
      expect(parsedSetCookie.token.sameSite).toBe('Lax')
      expect(notify_auth).toHaveBeenCalledWith('login', 'john@example.com')
    })

    it('returns 401 with wrong password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'john@example.com', password: 'wrong_password' })

      expect(res.status).toBe(401)
      expect(res.body.name).toBe('UnauthorizedError')
      expect(notify_auth).toHaveBeenCalledWith(
        'login_failed',
        'john@example.com',
        expect.any(String),
      )
    })

    it('returns 401 with non-existent email', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: 'Password@123' })

      expect(res.status).toBe(401)
      expect(res.body.name).toBe('UnauthorizedError')
      expect(notify_auth).toHaveBeenCalledWith(
        'login_failed',
        'nobody@example.com',
        expect.any(String),
      )
    })

    it('returns 400 when email is invalid', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'not-an-email', password: 'Password@123' })

      expect(res.status).toBe(400)
      expect(res.body.name).toBe('ValidationError')
    })
  })
})

describe('POST /auth/logout', () => {
  describe('anonymous user', () => {
    it('returns 200 and clears the cookie', async () => {
      const res = await request(app).post('/auth/logout')

      expect(res.status).toBe(200)
      expect(res.body.message).toBeDefined()
    })
  })
})
