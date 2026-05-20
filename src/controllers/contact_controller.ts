import { Request, Response } from 'express'
import { z } from 'zod'
import { send_contact_email } from '../services/email_service'
import { parse_or_throw } from '../utils/validate'

const contact_schema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.'),
  email: z.string().trim().email('Invalid email address.'),
  phone: z
    .string()
    .min(10, 'Phone must be at least 10 characters.')
    .transform((v) => v.replace(/\D/g, '')),
  message: z.string().trim().min(10, 'Message must be at least 10 characters.'),
})

export async function contact(req: Request, res: Response): Promise<void> {
  const { name, email, phone, message } = parse_or_throw(contact_schema, req.body)

  await send_contact_email({ from_name: name, from_email: email, phone, message })

  res.json({ message: 'Message sent successfully.' })
}
