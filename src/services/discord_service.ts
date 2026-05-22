import axios from 'axios'
import { Request } from 'express'
import { AppError } from '../errors'

const WEBHOOKS = {
  alerts: process.env.DISCORD_WEBHOOK_ALERTS!,
  errors: process.env.DISCORD_WEBHOOK_ERRORS!,
  auth: process.env.DISCORD_WEBHOOK_AUTH!,
}

const COLORS = {
  success: 0x57f287,
  warning: 0xfee75c,
  error: 0xed4245,
  alert: 0xff8c00,
}

interface DiscordField {
  name: string
  value: string
  inline?: boolean
}

interface DiscordEmbed {
  title: string
  color: number
  fields?: DiscordField[]
  timestamp: string
}

function send(url: string, embed: DiscordEmbed): void {
  axios.post(url, { embeds: [embed] }).catch(console.error)
}

export function notify_auth(
  event: 'register' | 'login' | 'login_failed' | 'register_conflict',
  email: string,
  detail?: string,
): void {
  const config = {
    register: { title: 'User Registered', color: COLORS.success },
    login: { title: 'User Logged In', color: COLORS.success },
    login_failed: { title: 'Failed Login Attempt', color: COLORS.error },
    register_conflict: { title: 'Registration Conflict', color: COLORS.warning },
  }[event]

  const fields: DiscordField[] = [{ name: 'Email', value: email, inline: true }]

  if (detail) {
    fields.push({ name: 'Reason', value: detail, inline: true })
  }

  send(WEBHOOKS.auth, {
    title: config.title,
    color: config.color,
    fields,
    timestamp: new Date().toISOString(),
  })
}

export function notify_alert(err: AppError, req: Request): void {
  send(WEBHOOKS.alerts, {
    title: 'Application Error',
    color: COLORS.alert,
    fields: [
      { name: 'Status', value: String(err.status_code), inline: true },
      { name: 'Type', value: err.name, inline: true },
      { name: 'Route', value: `${req.method} ${req.path}`, inline: true },
      { name: 'Message', value: err.message },
      { name: 'Action', value: err.action },
    ],
    timestamp: new Date().toISOString(),
  })
}

export function notify_error(err: unknown, req: Request): void {
  const error = err instanceof Error ? err : new Error(String(err))
  const stack = error.stack?.slice(0, 1000) ?? 'No stack trace available'

  send(WEBHOOKS.errors, {
    title: 'Internal Server Error',
    color: COLORS.error,
    fields: [
      { name: 'Route', value: `${req.method} ${req.path}`, inline: true },
      { name: 'Message', value: error.message },
      { name: 'Stack', value: stack },
    ],
    timestamp: new Date().toISOString(),
  })
}
