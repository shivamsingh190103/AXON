import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireAuth } from '../middleware/auth.js'
import { userController } from '../controllers/userController.js'

const router = Router()

router.use(requireAuth)

router.get('/me/usage', asyncHandler(userController.usage))
router.patch('/me', asyncHandler(userController.updateMe))
router.patch('/me/password', asyncHandler(userController.changePassword))

export default router
