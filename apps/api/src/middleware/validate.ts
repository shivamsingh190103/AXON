import type { NextFunction, Request, Response } from 'express'
import type { AnyZodObject } from 'zod'

export function validate(schema: AnyZodObject, property: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[property])
    if (!result.success) {
      next(result.error)
      return
    }

    req[property] = result.data as never
    next()
  }
}
