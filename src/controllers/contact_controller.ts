import { Request, Response } from 'express'
import { z } from 'zod'
import { send_contact_email } from '../services/email_service'
import { ValidationError } from '../errors'

const contact_schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.email('Invalid email address.'),
  message: z.string().min(10, 'Message must be at least 10 characters.'),
})

export async function contact(req: Request, res: Response): Promise<void> {
  const parsed = contact_schema.safeParse(req.body)

  if (!parsed.success) {
    throw new ValidationError(
      'Invalid input data.',
      'Fix the highlighted fields and try again.',
      parsed.error.flatten().fieldErrors,
    )
  }

  const { name, email, message } = parsed.data

  await send_contact_email({ from_name: name, from_email: email, message })

  res.json({ message: 'Message sent successfully.' })
}
