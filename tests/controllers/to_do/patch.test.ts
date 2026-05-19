import request from 'supertest'
import { app } from '../../../src/app'
import { create_authenticated_user } from '../../helpers/auth_helper'

describe('PATCH /to-do/:id/check', () => {
  describe('anonymous user', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app).patch('/to-do/some-id/check')

      expect(res.status).toBe(401)
      expect(res.body.name).toBe('UnauthorizedError')
    })
  })

  describe('authenticated user', () => {
    it('returns 200 and toggles done to true', async () => {
      const cookie = await create_authenticated_user(app)

      const create_res = await request(app)
        .post('/to-do')
        .set('Cookie', cookie)
        .send({ text: 'Task to check' })

      const todo_id = create_res.body.todo.id
      expect(create_res.body.todo.done).toBe(false)

      const res = await request(app).patch(`/to-do/${todo_id}/check`).set('Cookie', cookie)

      expect(res.status).toBe(200)
      expect(res.body.todo.done).toBe(true)
    })

    it('returns 200 and toggles done back to false', async () => {
      const cookie = await create_authenticated_user(app)

      const create_res = await request(app)
        .post('/to-do')
        .set('Cookie', cookie)
        .send({ text: 'Task to toggle twice' })

      const todo_id = create_res.body.todo.id

      await request(app).patch(`/to-do/${todo_id}/check`).set('Cookie', cookie)

      const res = await request(app).patch(`/to-do/${todo_id}/check`).set('Cookie', cookie)

      expect(res.status).toBe(200)
      expect(res.body.todo.done).toBe(false)
    })

    it('returns 404 when todo does not exist', async () => {
      const cookie = await create_authenticated_user(app)

      const res = await request(app).patch('/to-do/non-existent-id/check').set('Cookie', cookie)

      expect(res.status).toBe(404)
      expect(res.body.name).toBe('NotFoundError')
    })
  })
})
