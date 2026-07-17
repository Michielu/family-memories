import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_ADDRESS!

export async function sendReminderEmail({ to, formUrl, weekOf }: {
  to: string
  formUrl: string
  weekOf: string
}) {
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `📝 Time to write this week's memory letter (${weekOf})`,
    html: `
      <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="font-size:20px;font-weight:normal">Hey — it's Sunday.</h2>
        <p>This week's memory letter is waiting for you. Takes about 5 minutes.</p>
        <p>
          <a href="${formUrl}"
             style="display:inline-block;background:#4F46E5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:16px">
            Write this week's letter →
          </a>
        </p>
        <p style="color:#9CA3AF;font-size:13px;margin-top:24px">
          Week of ${weekOf}
        </p>
      </div>
    `,
  })

  if (error) throw new Error(`Reminder email failed: ${error.message}`)
}

export async function sendFailureNotification({ to, entryId, error: errMsg }: {
  to: string
  entryId: string
  error: string
}) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: '⚠️ Memory letter failed to send',
    html: `<p>Your memory letter (entry ${entryId}) failed to send: ${errMsg}</p>
           <p>Log in to retry: ${process.env.NEXT_PUBLIC_APP_URL}/week/${entryId}</p>`,
  })
}

export async function sendMemoryEmail({ toAddresses, subject, html, photoBuffers }: {
  toAddresses: string[]
  subject: string
  html: string
  photoBuffers: Array<{ filename: string; content: Buffer }>
}) {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: toAddresses,
    subject,
    html,
    attachments: photoBuffers.map(p => ({
      filename: p.filename,
      content: p.content,
    })),
  })

  if (error) throw new Error(error.message)
  return data
}
