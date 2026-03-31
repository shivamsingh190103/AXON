import multer from 'multer'
import path from 'node:path'
import type { NextFunction, Request, Response } from 'express'
import { ApiError } from '../utils/ApiError.js'

const allowedMimes = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-matroska',
  'video/x-msvideo',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/aac',
  'audio/flac',
  'audio/ogg',
  'audio/webm',
  'audio/opus',
  'application/ogg'
])

const allowedExtensions = new Set([
  '.mp4',
  '.mov',
  '.mkv',
  '.avi',
  '.webm',
  '.mp3',
  '.wav',
  '.m4a',
  '.aac',
  '.flac',
  '.ogg',
  '.opus'
])

export const MAX_UPLOAD_BYTES = 500 * 1024 * 1024 // 500 MB
export const MAX_AUDIO_UPLOAD_BYTES = 200 * 1024 * 1024 // 200 MB

export const uploadVideoMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_BYTES
  },
  fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase()
    if (!allowedMimes.has(file.mimetype) || !allowedExtensions.has(ext)) {
      cb(new ApiError(422, 'INVALID_MEDIA_TYPE', 'Unsupported media format.'))
      return
    }

    cb(null, true)
  }
})

function isAudioUpload(file?: Express.Multer.File) {
  if (!file) return false
  return file.mimetype.startsWith('audio/')
}

export function enforceUploadTypeLimits(req: Request, _res: Response, next: NextFunction) {
  const file = req.file
  if (!file) {
    next()
    return
  }

  if (isAudioUpload(file) && file.size > MAX_AUDIO_UPLOAD_BYTES) {
    next(new ApiError(413, 'AUDIO_FILE_TOO_LARGE', 'Audio files must be 200 MB or smaller.'))
    return
  }

  next()
}
