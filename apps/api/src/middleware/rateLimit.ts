import rateLimit from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import { redis } from '../lib/redis.js'

function createStore(prefix: string) {
  return new RedisStore({
    prefix,
    sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)) as unknown as Promise<any>
  })
}

export const defaultRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  store: createStore('rl:default:'),
  keyGenerator: (req) => req.userId ?? req.ip ?? 'unknown-ip'
})

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  store: createStore('rl:login:'),
  keyGenerator: (req) => req.ip ?? 'unknown-ip',
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_ATTEMPTS',
      message: 'Too many login attempts. Please try again later.'
    }
  }
})

export const uploadRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  store: createStore('rl:upload:'),
  keyGenerator: (req) => req.userId ?? req.ip ?? 'unknown-ip'
})

export const youtubeRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  store: createStore('rl:youtube:'),
  keyGenerator: (req) => req.userId ?? req.ip ?? 'unknown-ip'
})
