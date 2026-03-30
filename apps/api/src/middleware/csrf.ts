import crypto from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { ApiError } from '../utils/ApiError.js'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export function ensureCsrfCookie(req: Request, res: Response, next: NextFunction) {
  if (!req.cookies.csrf_token) {
    const token = crypto.randomBytes(24).toString('hex')
    res.cookie('csrf_token', token, {
      httpOnly: false,
      sameSite: 'lax',
      secure: false,
      path: '/'
    })
  }

  next()
}

export function csrfProtection(req: Request, _res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) {
    next()
    return
  }

  if (req.path.startsWith('/api/v1/auth/google')) {
    next()
    return
  }

  const cookieToken = req.cookies.csrf_token
  const headerToken = req.headers['x-csrf-token']

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    next(new ApiError(403, 'CSRF_MISMATCH', 'Invalid CSRF token'))
    return
  }

  next()
}
