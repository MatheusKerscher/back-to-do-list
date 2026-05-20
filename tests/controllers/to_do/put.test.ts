import request from 'supertest'
import { app } from '../../../src/app'
import { create_authenticated_user, TEST_USER } from '../../helpers/auth_helper'

describe('PUT /to-do/:id', () => {
  describe('anonymous user', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app).put('/to-do/some-id').send({ text: 'Updated' })

      expect(res.status).toBe(401)
      expect(res.body.name).toBe('UnauthorizedError')
    })
  })

  describe('authenticated user', () => {
    it('returns 200 and updates the todo text', async () => {
      const cookie = await create_authenticated_user(app)

      const create_res = await request(app)
        .post('/to-do')
        .set('Cookie', cookie)
        .send({ text: 'Original text' })

      const todo_id = create_res.body.todo.id

      const res = await request(app)
        .put(`/to-do/${todo_id}`)
        .set('Cookie', cookie)
        .send({ text: 'Updated text' })

      expect(res.status).toBe(200)
      expect(res.body.todo.text).toBe('Updated text')
    })

    it('returns 404 when todo does not exist', async () => {
      const cookie = await create_authenticated_user(app)

      const res = await request(app)
        .put('/to-do/non-existent-id')
        .set('Cookie', cookie)
        .send({ text: 'Updated text' })

      expect(res.status).toBe(404)
      expect(res.body.name).toBe('NotFoundError')
    })

    it('returns 400 when text is empty', async () => {
      const cookie = await create_authenticated_user(app)

      const create_res = await request(app)
        .post('/to-do')
        .set('Cookie', cookie)
        .send({ text: 'Some task' })

      const todo_id = create_res.body.todo.id

      const res = await request(app)
        .put(`/to-do/${todo_id}`)
        .set('Cookie', cookie)
        .send({ text: '' })

      expect(res.status).toBe(400)
      expect(res.body.name).toBe('ValidationError')
    })

    it('returns 404 when trying to update another user todo', async () => {
      const owner_cookie = await create_authenticated_user(app)

      const create_res = await request(app)
        .post('/to-do')
        .set('Cookie', owner_cookie)
        .send({ text: 'Owner task' })

      const todo_id = create_res.body.todo.id

      await request(app).post('/auth/register').send({
        name: 'Other User',
        email: 'other@test.com',
        password: 'Password@123',
      })
      const other_login = await request(app)
        .post('/auth/login')
        .send({ email: 'other@test.com', password: 'Password@123' })
      const other_cookie = other_login.headers['set-cookie'] as unknown as string[]

      const res = await request(app)
        .put(`/to-do/${todo_id}`)
        .set('Cookie', other_cookie)
        .send({ text: 'Stolen update' })

      expect(res.status).toBe(404)
    })
  })
})
