import type { Request, Response } from 'express'
import { createUploadAnalysisSchema, createYoutubeAnalysisSchema, exportQuerySchema, updateAnalysisSchema } from '@axon/shared'
import { AnalysisStatus } from '@prisma/client'
import { StatusCodes } from 'http-status-codes'
import { analysisService } from '../services/analysisService.js'
import { ApiError } from '../utils/ApiError.js'
import { ok, noContent } from '../utils/http.js'

function parseStatus(status?: string) {
  if (!status) return undefined
  if (Object.values(AnalysisStatus).includes(status as AnalysisStatus)) {
    return status as AnalysisStatus
  }

  return undefined
}

export const analysisController = {
  async list(req: Request, res: Response) {
    const page = Number(req.query.page ?? 1)
    const limit = Number(req.query.limit ?? 20)
    const status = parseStatus(req.query.status as string | undefined)
    const sortBy = (req.query.sortBy as 'createdAt' | 'updatedAt') || 'createdAt'
    const sortDir = (req.query.sortDir as 'asc' | 'desc') || 'desc'

    const result = await analysisService.listAnalyses({
      userId: req.userId!,
      page,
      limit,
      status,
      sortBy,
      sortDir
    })

    ok(res, result.items, 200, result.meta)
  },

  async upload(req: Request, res: Response) {
    const file = req.file
    if (!file) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'FILE_REQUIRED', 'Please upload a file.')
    }

    const body = createUploadAnalysisSchema.parse(req.body ?? {})

    const data = await analysisService.createUploadAnalysis({
      userId: req.userId!,
      file,
      userPlan: req.user!.plan,
      contentType: body.contentType,
      durationSeconds: body.durationSeconds
    })

    ok(res, data, 202)
  },

  async youtube(req: Request, res: Response) {
    const body = createYoutubeAnalysisSchema.parse(req.body)

    const data = await analysisService.createYoutubeAnalysis({
      userId: req.userId!,
      url: body.url,
      userPlan: req.user!.plan,
      contentType: body.contentType
    })

    ok(res, data, 202)
  },

  async getById(req: Request, res: Response) {
    const analysisId = String(req.params.id)
    const data = await analysisService.getAnalysisById(req.userId!, analysisId)
    ok(res, data)
  },

  async update(req: Request, res: Response) {
    const analysisId = String(req.params.id)
    const body = updateAnalysisSchema.parse(req.body)
    const data = await analysisService.updateAnalysis(req.userId!, analysisId, body.title)
    ok(res, data)
  },

  async remove(req: Request, res: Response) {
    const analysisId = String(req.params.id)
    await analysisService.deleteAnalysis(req.userId!, analysisId)
    noContent(res)
  },

  async status(req: Request, res: Response) {
    const analysisId = String(req.params.id)
    const data = await analysisService.getStatus(req.userId!, analysisId)
    ok(res, data)
  },

  async export(req: Request, res: Response) {
    const analysisId = String(req.params.id)
    const query = exportQuerySchema.parse(req.query)
    const data = await analysisService.exportAnalysis(req.userId!, analysisId, query.format)

    res.setHeader('Content-Type', data.mimeType)
    res.setHeader('Content-Disposition', `attachment; filename=\"${data.filename}\"`)
    res.status(200).send(data.content)
  },

  async share(req: Request, res: Response) {
    const analysisId = String(req.params.id)
    const data = await analysisService.createShareLink(req.userId!, analysisId)
    ok(res, data)
  },

  async retry(req: Request, res: Response) {
    const analysisId = String(req.params.id)
    const data = await analysisService.retryAnalysis(req.userId!, analysisId)
    ok(res, data)
  },

  async getShare(req: Request, res: Response) {
    const data = await analysisService.getSharedAnalysis(String(req.params.token))
    ok(res, data)
  }
}
