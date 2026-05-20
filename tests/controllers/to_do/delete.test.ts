import request from 'supertest'
import { app } from '../../../src/app'
import { create_authenticated_user } from '../../helpers/auth_helper'

describe('DELETE /to-do/:id', () => {
  describe('anonymous user', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app).delete('/to-do/some-id')

      expect(res.status).toBe(401)
      expect(res.body.name).toBe('UnauthorizedError')
    })
  })

  describe('authenticated user', () => {
    it('returns 204 and removes the todo', async () => {
      const cookie = await create_authenticated_user(app)

      const create_res = await request(app)
        .post('/to-do')
        .set('Cookie', cookie)
        .send({ text: 'Task to delete' })

      const todo_id = create_res.body.todo.id

      const res = await request(app).delete(`/to-do/${todo_id}`).set('Cookie', cookie)

      expect(res.status).toBe(204)

      const list_res = await request(app).get('/to-do').set('Cookie', cookie)
      expect(list_res.body.todos).toHaveLength(0)
    })

    it('returns 404 when todo does not exist', async () => {
      const cookie = await create_authenticated_user(app)

      const res = await request(app).delete('/to-do/non-existent-id').set('Cookie', cookie)

      expect(res.status).toBe(404)
      expect(res.body.name).toBe('NotFoundError')
    })

    it('returns 404 when trying to delete another user todo', async () => {
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

      const res = await request(app).delete(`/to-do/${todo_id}`).set('Cookie', other_cookie)

      expect(res.status).toBe(404)
    })
  })
})
