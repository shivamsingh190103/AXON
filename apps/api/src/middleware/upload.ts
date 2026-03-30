import multer from 'multer'
import path from 'node:path'
import { ApiError } from '../utils/ApiError.js'

const allowedMimes = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm'
])

const allowedExtensions = new Set(['.mp4', '.mov', '.webm'])

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024 // 100 MB

export const uploadVideoMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_BYTES
  },
  fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase()
    if (!allowedMimes.has(file.mimetype) || !allowedExtensions.has(ext)) {
      cb(new ApiError(422, 'INVALID_VIDEO_TYPE', 'Only MP4, MOV, and WebM files are supported.'))
      return
    }

    cb(null, true)
  }
})
