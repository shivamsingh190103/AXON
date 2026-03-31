import { useMutation } from '@tanstack/react-query'
import type { ContentType } from '@axon/shared'
import { api } from '@/lib/axios'

export function useUploadFile() {
  return useMutation({
    mutationFn: async (payload: { file: File; contentType: ContentType; durationSeconds?: number }) => {
      const formData = new FormData()
      formData.append('video', payload.file)
      formData.append('contentType', payload.contentType)
      if (payload.durationSeconds && Number.isFinite(payload.durationSeconds)) {
        formData.append('durationSeconds', String(payload.durationSeconds))
      }
      const response = await api.post('/analyses/upload', formData)
      return response.data
    }
  })
}

export function useUploadYoutube() {
  return useMutation({
    mutationFn: async (payload: { url: string; contentType: ContentType }) => {
      const response = await api.post('/analyses/youtube', payload)
      return response.data
    }
  })
}
