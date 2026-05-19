import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface ContactEmailParams {
  from_name: string
  from_email: string
  message: string
}

export async function send_contact_email({
  from_name,
  from_email,
  message,
}: ContactEmailParams): Promise<void> {
  const { error } = await resend.emails.send({
    from: process.env.CONTACT_EMAIL_FROM!,
    to: from_email,
    subject: `We received your message`,
    html: `
      <h2>We received your message</h2>
      <p><strong>Name:</strong> ${from_name}</p>
      <p><strong>Email:</strong> ${from_email}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `,
  })

  if (error) {
    throw new Error(error.message)
  }
}
