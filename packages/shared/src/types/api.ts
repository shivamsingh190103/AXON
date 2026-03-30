export interface ApiMeta {
  page?: number
  limit?: number
  total?: number
}

export interface ApiError {
  code: string
  message: string
  details?: unknown
}

export type ApiSuccess<T> = {
  success: true
  data: T
  meta?: ApiMeta
}

export type ApiFailure = {
  success: false
  error: ApiError
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure
