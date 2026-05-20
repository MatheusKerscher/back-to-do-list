import request from 'supertest'
import { app } from '../../../src/app'
import { create_authenticated_user } from '../../helpers/auth_helper'

describe('GET /auth/me', () => {
  describe('anonymous user', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app).get('/auth/me')

      expect(res.status).toBe(401)
      expect(res.body.name).toBe('UnauthorizedError')
    })

    it('returns 401 when token is invalid', async () => {
      const res = await request(app).get('/auth/me').set('Cookie', 'token=invalid_token')

      expect(res.status).toBe(401)
      expect(res.body.name).toBe('UnauthorizedError')
    })
  })

  describe('authenticated user', () => {
    it('returns 200 and the current user data', async () => {
      const cookie = await create_authenticated_user(app)

      const res = await request(app).get('/auth/me').set('Cookie', cookie)

      expect(res.status).toBe(200)
      expect(res.body.user).toMatchObject({ email: 'user@test.com', name: 'Test User' })
      expect(res.body.user).not.toHaveProperty('password_hash')
    })
  })
})
