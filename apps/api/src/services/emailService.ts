import { Resend } from 'resend'
import { env } from '../lib/env.js'
import { logger } from '../utils/logger.js'

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

async function sendEmail(params: { to: string; subject: string; html: string }) {
  if (!resend) {
    logger.info({ to: params.to, subject: params.subject }, 'Email skipped (RESEND_API_KEY not configured)')
    return
  }

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: params.to,
    subject: params.subject,
    html: params.html
  })
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await sendEmail({
    to: email,
    subject: 'Reset your AXON password',
    html: `<p>Click to reset your password. This link expires in 1 hour.</p><p><a href=\"${resetUrl}\">Reset password</a></p>`
  })
}

export async function sendAnalysisFailedEmail(email: string, analysisId: string, reason: string) {
  await sendEmail({
    to: email,
    subject: 'Your AXON analysis failed',
    html: `<p>Your analysis ${analysisId} failed.</p><p>Reason: ${reason}</p><p>Please retry from your dashboard.</p>`
  })
}
