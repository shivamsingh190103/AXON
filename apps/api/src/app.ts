import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import passport from './lib/passport.js'
import { isAllowedOrigin } from './lib/origins.js'
import apiRouter from './routes/index.js'
import { ensureCsrfCookie, csrfProtection } from './middleware/csrf.js'
import { defaultRateLimit } from './middleware/rateLimit.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { logger } from './utils/logger.js'

export function createApp() {
  const app = express()

  app.set('trust proxy', 1)

  app.use((req, _res, next) => {
    logger.info({ method: req.method, path: req.path }, 'incoming_request')
    next()
  })

  app.use(
    cors({
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true)
          return
        }

        callback(new Error(`Origin "${origin ?? 'unknown'}" is not allowed by CORS`))
      },
      credentials: true
    })
  )

  app.use(
    helmet({
      crossOriginResourcePolicy: false
    })
  )

  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(cookieParser())
  app.use(ensureCsrfCookie)
  app.use(defaultRateLimit)
  app.use(passport.initialize())

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api/v1', csrfProtection, apiRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
