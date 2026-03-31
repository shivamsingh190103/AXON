import { createServer } from 'node:http'
import jwt from 'jsonwebtoken'
import { Server } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { createApp } from './app.js'
import { allowedFrontendOrigins, isAllowedOrigin } from './lib/origins.js'
import { env } from './lib/env.js'
import { redis, redisSubscriber } from './lib/redis.js'
import { setIo } from './lib/socket.js'
import { startAnalysisWorker } from './jobs/analysisQueue.js'
import { startMaintenanceJobs } from './jobs/maintenance.js'
import { logger } from './utils/logger.js'

interface SocketAuthPayload {
  sub: string
  type: 'access'
}

const app = createApp()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true)
        return
      }

      callback(new Error(`Origin "${origin ?? 'unknown'}" is not allowed by CORS`))
    },
    credentials: true
  }
})

io.adapter(createAdapter(redis, redisSubscriber))

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token as string | undefined
    if (!token) {
      next(new Error('Unauthorized'))
      return
    }

    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as SocketAuthPayload
    if (payload.type !== 'access') {
      next(new Error('Unauthorized'))
      return
    }

    socket.data.userId = payload.sub
    next()
  } catch {
    next(new Error('Unauthorized'))
  }
})

io.on('connection', (socket) => {
  socket.on('subscribe:analysis', ({ analysisId }: { analysisId: string }) => {
    socket.join(`analysis:${analysisId}`)
  })

  socket.on('unsubscribe:analysis', ({ analysisId }: { analysisId: string }) => {
    socket.leave(`analysis:${analysisId}`)
  })
})

setIo(io)
startAnalysisWorker()
const stopMaintenance = startMaintenanceJobs()

httpServer.listen(env.PORT, () => {
  logger.info({ origins: allowedFrontendOrigins }, `API listening on port ${env.PORT}`)
})

const shutdown = async () => {
  logger.info('Shutting down API server...')
  stopMaintenance()
  await redis.quit()
  await redisSubscriber.quit()
  io.close()
  httpServer.close(() => {
    process.exit(0)
  })
}

process.on('SIGTERM', () => void shutdown())
process.on('SIGINT', () => void shutdown())
