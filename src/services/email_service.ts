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
  await resend.emails.send({
    from: process.env.CONTACT_EMAIL_FROM!,
    to: from_email,
    subject: `Nova mensagem de ${from_name}`,
    html: `
      <h2>Nova mensagem pelo formulário de contato</h2>
      <p><strong>Nome:</strong> ${from_name}</p>
      <p><strong>E-mail:</strong> ${from_email}</p>
      <p><strong>Mensagem:</strong></p>
      <p>${message}</p>
    `,
  })
}
