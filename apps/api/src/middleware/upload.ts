import multer from 'multer'
import path from 'node:path'
import { ApiError } from '../utils/ApiError.js'

const allowedMimes = new Set([
  'video/mp4',
  'video/quicktime',
  'video/x-matroska',
  'video/avi',
  'video/webm'
])

const allowedExtensions = new Set(['.mp4', '.mov', '.mkv', '.avi', '.webm'])

export const uploadVideoMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 4 * 1024 * 1024 * 1024 // cap by max plan, exact plan check happens later
  },
  fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase()
    if (!allowedMimes.has(file.mimetype) || !allowedExtensions.has(ext)) {
      cb(new ApiError(422, 'INVALID_VIDEO_TYPE', 'Only MP4, MOV, MKV, AVI, and WebM files are supported.'))
      return
    }

    cb(null, true)
  }
})
