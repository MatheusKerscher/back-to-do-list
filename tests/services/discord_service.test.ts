jest.unmock('axios')

import axios from 'axios'
import { Request } from 'express'
import { notify_auth, notify_alert, notify_error } from '../../src/services/discord_service'
import { UnauthorizedError, NotFoundError } from '../../src/errors'

let spy: jest.SpyInstance

const WEBHOOKS = {
  alerts: process.env.DISCORD_WEBHOOK_ALERTS,
  errors: process.env.DISCORD_WEBHOOK_ERRORS,
  auth: process.env.DISCORD_WEBHOOK_AUTH,
}

type DiscordField = { name: string; value: string; inline?: boolean }
type DiscordPayload = { embeds: Array<{ title: string; color: number; fields: DiscordField[]; timestamp: string }> }

function make_request(method = 'GET', path = '/test'): Request {
  return { method, path } as unknown as Request
}

function get_payload(): DiscordPayload {
  return spy.mock.calls[0][1] as DiscordPayload
}

describe('discord_service', () => {
  beforeEach(() => {
    spy = jest.spyOn(axios, 'post')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('notify_auth', () => {
    it('calls auth webhook with green embed on register', () => {
      notify_auth('register', 'user@example.com')

      expect(spy).toHaveBeenCalledWith(
        WEBHOOKS.auth,
        expect.objectContaining({
          embeds: [expect.objectContaining({ title: 'User Registered', color: 0x57f287 })],
        }),
      )
    })

    it('calls auth webhook with green embed on login', () => {
      notify_auth('login', 'user@example.com')

      expect(spy).toHaveBeenCalledWith(
        WEBHOOKS.auth,
        expect.objectContaining({
          embeds: [expect.objectContaining({ title: 'User Logged In', color: 0x57f287 })],
        }),
      )
    })

    it('calls auth webhook with red embed on login_failed', () => {
      notify_auth('login_failed', 'user@example.com', 'Invalid credentials.')

      expect(spy).toHaveBeenCalledWith(
        WEBHOOKS.auth,
        expect.objectContaining({
          embeds: [expect.objectContaining({ title: 'Failed Login Attempt', color: 0xed4245 })],
        }),
      )
    })

    it('calls auth webhook with yellow embed on register_conflict', () => {
      notify_auth('register_conflict', 'user@example.com', 'Email already in use.')

      expect(spy).toHaveBeenCalledWith(
        WEBHOOKS.auth,
        expect.objectContaining({
          embeds: [expect.objectContaining({ title: 'Registration Conflict', color: 0xfee75c })],
        }),
      )
    })

    it('embed includes email in fields', () => {
      notify_auth('register', 'user@example.com')

      const { embeds } = get_payload()
      expect(embeds[0].fields).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'Email', value: 'user@example.com' })]),
      )
    })

    it('embed includes reason in fields when detail is provided', () => {
      notify_auth('login_failed', 'user@example.com', 'Invalid credentials.')

      const { embeds } = get_payload()
      expect(embeds[0].fields).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'Reason', value: 'Invalid credentials.' })]),
      )
    })

    it('embed includes an ISO timestamp', () => {
      notify_auth('login', 'user@example.com')

      const { embeds } = get_payload()
      expect(new Date(embeds[0].timestamp).toISOString()).toBe(embeds[0].timestamp)
    })

    it('does not throw when axios rejects', () => {
      spy.mockRejectedValueOnce(new Error('Network error'))

      expect(() => notify_auth('register', 'user@example.com')).not.toThrow()
    })
  })

  describe('notify_alert', () => {
    it('calls alerts webhook and not the others', () => {
      const err = new UnauthorizedError('Invalid credentials.', 'Check your email and password.')
      notify_alert(err, make_request('POST', '/auth/login'))

      expect(spy).toHaveBeenCalledWith(WEBHOOKS.alerts, expect.anything())
      expect(spy).not.toHaveBeenCalledWith(WEBHOOKS.errors, expect.anything())
      expect(spy).not.toHaveBeenCalledWith(WEBHOOKS.auth, expect.anything())
    })

    it('embed includes status code, error name, message, action, and route', () => {
      const err = new NotFoundError('Resource not found.', 'Check the ID and try again.')
      notify_alert(err, make_request('GET', '/to-do/999'))

      const { embeds } = get_payload()
      expect(embeds[0].fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Status', value: '404' }),
          expect.objectContaining({ name: 'Type', value: 'NotFoundError' }),
          expect.objectContaining({ name: 'Route', value: 'GET /to-do/999' }),
          expect.objectContaining({ name: 'Message', value: 'Resource not found.' }),
          expect.objectContaining({ name: 'Action', value: 'Check the ID and try again.' }),
        ]),
      )
    })

    it('does not throw when axios rejects', () => {
      spy.mockRejectedValueOnce(new Error('Network error'))
      const err = new UnauthorizedError('Unauthorized.', 'Log in.')

      expect(() => notify_alert(err, make_request())).not.toThrow()
    })
  })

  describe('notify_error', () => {
    it('calls errors webhook and not the others', () => {
      notify_error(new Error('Boom'), make_request())

      expect(spy).toHaveBeenCalledWith(WEBHOOKS.errors, expect.anything())
      expect(spy).not.toHaveBeenCalledWith(WEBHOOKS.alerts, expect.anything())
      expect(spy).not.toHaveBeenCalledWith(WEBHOOKS.auth, expect.anything())
    })

    it('embed includes route and error message', () => {
      notify_error(new Error('Unexpected failure'), make_request('DELETE', '/to-do/1'))

      const { embeds } = get_payload()
      expect(embeds[0].fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Route', value: 'DELETE /to-do/1' }),
          expect.objectContaining({ name: 'Message', value: 'Unexpected failure' }),
        ]),
      )
    })

    it('truncates stack trace to 1000 characters', () => {
      const err = new Error('Big error')
      err.stack = 'E: '.padEnd(2000, 'x')
      notify_error(err, make_request())

      const { embeds } = get_payload()
      const stack_field = embeds[0].fields.find((f) => f.name === 'Stack')

      expect(stack_field?.value.length).toBeLessThanOrEqual(1000)
    })

    it('handles non-Error objects without throwing', () => {
      expect(() => notify_error('string error', make_request())).not.toThrow()
    })

    it('does not throw when axios rejects', () => {
      spy.mockRejectedValueOnce(new Error('Network error'))

      expect(() => notify_error(new Error('Boom'), make_request())).not.toThrow()
    })
  })
})
