import request from 'supertest'
import { app } from '../../../src/app'

jest.mock('../../../src/services/email_service', () => ({
  send_contact_email: jest.fn().mockResolvedValue(undefined),
}))

describe('POST /contact', () => {
  describe('anonymous user', () => {
    it('returns 200 when all fields are valid', async () => {
      const res = await request(app).post('/contact').send({
        name: 'Jane Doe',
        email: 'kerschermatheus12@gmail.com',
        message: 'Hello, this is a test message with enough characters.',
      })

      expect(res.status).toBe(200)
      expect(res.body.message).toBeDefined()
    })

    it('returns 400 when name is too short', async () => {
      const res = await request(app).post('/contact').send({
        name: 'J',
        email: 'kerschermatheus12@gmail.com',
        message: 'Hello, this is a test message.',
      })

      expect(res.status).toBe(400)
      expect(res.body.name).toBe('ValidationError')
      expect(res.body.fields.name).toBeDefined()
    })

    it('returns 400 when email is invalid', async () => {
      const res = await request(app).post('/contact').send({
        name: 'Jane Doe',
        email: 'not-an-email',
        message: 'Hello, this is a test message.',
      })

      expect(res.status).toBe(400)
      expect(res.body.name).toBe('ValidationError')
      expect(res.body.fields.email).toBeDefined()
    })

    it('returns 400 when message is too short', async () => {
      const res = await request(app).post('/contact').send({
        name: 'Jane Doe',
        email: 'kerschermatheus12@gmail.com',
        message: 'Short',
      })

      expect(res.status).toBe(400)
      expect(res.body.name).toBe('ValidationError')
      expect(res.body.fields.message).toBeDefined()
    })
  })
})
