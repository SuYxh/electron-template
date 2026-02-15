export interface FFmpegConvertOptions {
  format?: string
  videoCodec?: string
  audioCodec?: string
  videoBitrate?: string
  audioBitrate?: string
  resolution?: string
  fps?: number
  startTime?: number
  duration?: number
}

export interface FFmpegProgress {
  taskId: string
  percent: number
  currentTime: number
  totalTime: number
  fps: number
  speed: string
}

export interface MediaInfo {
  format: string
  duration: number
  size: number
  bitrate: number
  video?: {
    codec: string
    width: number
    height: number
    fps: number
    bitrate: number
  }
  audio?: {
    codec: string
    channels: number
    sampleRate: number
    bitrate: number
  }
}

export interface FFmpegTask {
  id: string
  input: string
  output: string
  options: FFmpegConvertOptions
  status: 'pending' | 'running' | 'completed' | 'cancelled' | 'error'
  progress: number
  error?: string
}
