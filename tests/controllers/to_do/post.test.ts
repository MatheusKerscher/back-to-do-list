import request from 'supertest'
import { app } from '../../../src/app'
import { create_authenticated_user } from '../../helpers/auth_helper'

describe('POST /to-do', () => {
  describe('anonymous user', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app).post('/to-do').send({ text: 'New task' })

      expect(res.status).toBe(401)
      expect(res.body.name).toBe('UnauthorizedError')
    })
  })

  describe('authenticated user', () => {
    it('returns 201 and creates a todo with valid data', async () => {
      const cookie = await create_authenticated_user(app)

      const res = await request(app)
        .post('/to-do')
        .set('Cookie', cookie)
        .send({ text: 'Buy groceries' })

      expect(res.status).toBe(201)
      expect(res.body.todo).toMatchObject({ text: 'Buy groceries', done: false })
      expect(res.body.todo).toHaveProperty('id')
    })

    it('returns 400 when text is empty', async () => {
      const cookie = await create_authenticated_user(app)

      const res = await request(app).post('/to-do').set('Cookie', cookie).send({ text: '' })

      expect(res.status).toBe(400)
      expect(res.body.name).toBe('ValidationError')
      expect(res.body.fields.text).toBeDefined()
    })

    it('returns 400 when text field is missing', async () => {
      const cookie = await create_authenticated_user(app)

      const res = await request(app).post('/to-do').set('Cookie', cookie).send({})

      expect(res.status).toBe(400)
      expect(res.body.name).toBe('ValidationError')
    })
  })
})
