import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { deleteObject, getSignedReadUrl, putObject } from '../lib/s3.js'
import { redis } from '../lib/redis.js'

const PRESIGNED_TTL_SECONDS = 55 * 60

export class StorageService {
  async uploadVideo(params: { analysisId: string; originalFilename: string; contentType?: string; buffer: Buffer }) {
    const ext = path.extname(params.originalFilename) || '.mp4'
    const key = `raw/${params.analysisId}/${randomUUID()}${ext}`

    await putObject({
      key,
      body: params.buffer,
      contentType: params.contentType
    })

    return key
  }

  async getPlaybackUrl(s3Key: string) {
    const cacheKey = `presigned:${s3Key}`
    const cached = await redis.get(cacheKey)
    if (cached) {
      return cached
    }

    const url = await getSignedReadUrl(s3Key, 60 * 60)
    await redis.set(cacheKey, url, 'EX', PRESIGNED_TTL_SECONDS)

    return url
  }

  async deleteKeys(keys: string[]) {
    for (const key of keys) {
      if (!key) continue
      await deleteObject(key).catch(() => null)
      await redis.del(`presigned:${key}`)
    }
  }
}

export const storageService = new StorageService()
