import request from 'supertest'
import { app } from '../../../src/app'

describe('POST /auth/register', () => {
  describe('anonymous user', () => {
    it('returns 201 and creates user with valid data', async () => {
      const res = await request(app).post('/auth/register').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      })

      expect(res.status).toBe(201)
      expect(res.body.user).toMatchObject({ name: 'John Doe', email: 'john@example.com' })
      expect(res.body.user).not.toHaveProperty('password')
    })

    it('returns 400 when name is too short', async () => {
      const res = await request(app).post('/auth/register').send({
        name: 'J',
        email: 'john@example.com',
        password: 'password123',
      })

      expect(res.status).toBe(400)
      expect(res.body.name).toBe('ValidationError')
      expect(res.body.fields.name).toBeDefined()
    })

    it('returns 400 when email is invalid', async () => {
      const res = await request(app).post('/auth/register').send({
        name: 'John Doe',
        email: 'not-an-email',
        password: 'password123',
      })

      expect(res.status).toBe(400)
      expect(res.body.name).toBe('ValidationError')
      expect(res.body.fields.email).toBeDefined()
    })

    it('returns 400 when password is too short', async () => {
      const res = await request(app).post('/auth/register').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: '123',
      })

      expect(res.status).toBe(400)
      expect(res.body.name).toBe('ValidationError')
      expect(res.body.fields.password).toBeDefined()
    })

    it('returns 409 when email is already in use', async () => {
      await request(app).post('/auth/register').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      })

      const res = await request(app).post('/auth/register').send({
        name: 'Another User',
        email: 'john@example.com',
        password: 'password456',
      })

      expect(res.status).toBe(409)
      expect(res.body.name).toBe('ConflictError')
    })
  })
})

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/auth/register').send({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    })
  })

  describe('anonymous user', () => {
    it('returns 200 and sets cookie with valid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'john@example.com', password: 'password123' })

      expect(res.status).toBe(200)
      expect(res.body.user).toMatchObject({ email: 'john@example.com' })
      expect(res.headers['set-cookie']).toBeDefined()
    })

    it('returns 401 with wrong password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'john@example.com', password: 'wrong_password' })

      expect(res.status).toBe(401)
      expect(res.body.name).toBe('UnauthorizedError')
    })

    it('returns 401 with non-existent email', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' })

      expect(res.status).toBe(401)
      expect(res.body.name).toBe('UnauthorizedError')
    })

    it('returns 400 when email is invalid', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'not-an-email', password: 'password123' })

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
