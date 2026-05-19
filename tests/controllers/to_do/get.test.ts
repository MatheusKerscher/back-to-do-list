import request from 'supertest'
import { app } from '../../../src/app'
import { create_authenticated_user } from '../../helpers/auth_helper'

describe('GET /to-do', () => {
  describe('anonymous user', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app).get('/to-do')

      expect(res.status).toBe(401)
      expect(res.body.name).toBe('UnauthorizedError')
    })
  })

  describe('authenticated user', () => {
    it('returns 200 and an empty list when no todos exist', async () => {
      const cookie = await create_authenticated_user(app)

      const res = await request(app).get('/to-do').set('Cookie', cookie)

      expect(res.status).toBe(200)
      expect(res.body.todos).toEqual([])
    })

    it('returns 200 and the list of todos belonging to the user', async () => {
      const cookie = await create_authenticated_user(app)

      await request(app).post('/to-do').set('Cookie', cookie).send({ text: 'First task' })
      await request(app).post('/to-do').set('Cookie', cookie).send({ text: 'Second task' })

      const res = await request(app).get('/to-do').set('Cookie', cookie)

      expect(res.status).toBe(200)
      expect(res.body.todos).toHaveLength(2)
      expect(res.body.todos[0]).toHaveProperty('text')
      expect(res.body.todos[0]).toHaveProperty('done')
    })
  })
})
