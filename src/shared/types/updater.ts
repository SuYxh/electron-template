export type UpdaterStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error'

export interface UpdateProgress {
  percent: number
  bytesPerSecond: number
  total: number
  transferred: number
}

export interface UpdateInfo {
  version: string
  releaseDate: string
  releaseNotes?: string
}
