import { Router } from 'express'
import authRoutes from './auth.js'
import analysisRoutes from './analyses.js'
import userRoutes from './users.js'
import webhookRoutes from './webhooks.js'
import { analysisController } from '../controllers/analysisController.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/analyses', analysisRoutes)
router.use('/users', userRoutes)
router.use('/webhooks', webhookRoutes)
router.get('/share/:token', asyncHandler(analysisController.getShare))

export default router
