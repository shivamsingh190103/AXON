import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/axios'

export function useAnalyses() {
  return useQuery({
    queryKey: ['analyses'],
    queryFn: async () => {
      const response = await api.get('/analyses')
      return response.data
    }
  })
}

export function useAnalysis(id?: string) {
  return useQuery({
    queryKey: ['analysis', id],
    queryFn: async () => {
      const response = await api.get(`/analyses/${id}`)
      return response.data
    },
    enabled: Boolean(id)
  })
}

export function useAnalysisStatus(id?: string, enabled = true) {
  return useQuery({
    queryKey: ['analysis-status', id],
    queryFn: async () => {
      const response = await api.get(`/analyses/${id}/status`)
      return response.data
    },
    enabled: Boolean(id && enabled),
    refetchInterval: 3000
  })
}
