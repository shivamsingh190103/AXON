import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireAuth } from '../middleware/auth.js'
import { uploadRateLimit, youtubeRateLimit } from '../middleware/rateLimit.js'
import { uploadVideoMiddleware } from '../middleware/upload.js'
import { analysisController } from '../controllers/analysisController.js'

const router = Router()

router.use(requireAuth)

router.get('/', asyncHandler(analysisController.list))
router.post('/upload', uploadRateLimit, uploadVideoMiddleware.single('video'), asyncHandler(analysisController.upload))
router.post('/youtube', youtubeRateLimit, asyncHandler(analysisController.youtube))
router.get('/:id', asyncHandler(analysisController.getById))
router.patch('/:id', asyncHandler(analysisController.update))
router.delete('/:id', asyncHandler(analysisController.remove))
router.post('/:id/retry', asyncHandler(analysisController.retry))
router.get('/:id/status', asyncHandler(analysisController.status))
router.get('/:id/export', asyncHandler(analysisController.export))
router.post('/:id/share', asyncHandler(analysisController.share))

export default router
