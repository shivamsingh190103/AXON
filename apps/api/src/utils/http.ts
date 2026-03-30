import type { Response } from 'express'
import type { ApiMeta } from '@axon/shared'

export function ok<T>(res: Response, data: T, status = 200, meta?: ApiMeta) {
  res.status(status).json({
    success: true,
    data,
    ...(meta ? { meta } : {})
  })
}

export function noContent(res: Response) {
  res.status(204).send()
}
