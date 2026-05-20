import request from 'supertest'
import type { Application } from 'express'

export const TEST_USER = {
  name: 'Test User',
  email: 'user@test.com',
  password: 'Password@123',
}

export async function create_authenticated_user(app: Application): Promise<string[]> {
  await request(app).post('/auth/register').send(TEST_USER)
  const login_res = await request(app).post('/auth/login').send({
    email: TEST_USER.email,
    password: TEST_USER.password,
  })
  return login_res.headers['set-cookie'] as unknown as string[]
}
