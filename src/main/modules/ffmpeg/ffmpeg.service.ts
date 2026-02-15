import ffmpeg from 'fluent-ffmpeg'
import { getFFmpegPath, getFFprobePath } from '../../utils/path'
import type { FFmpegConvertOptions, FFmpegProgress, MediaInfo, FFmpegTask } from '../../../shared/types/ffmpeg'

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

export class FFmpegService {
  private tasks: Map<string, FFmpegTask> = new Map()
  private commands: Map<string, ffmpeg.FfmpegCommand> = new Map()

  constructor() {
    ffmpeg.setFfmpegPath(getFFmpegPath())
    ffmpeg.setFfprobePath(getFFprobePath())
  }

  async convert(
    input: string,
    output: string,
    options: FFmpegConvertOptions = {},
    onProgress?: (progress: FFmpegProgress) => void
  ): Promise<string> {
    const taskId = generateId()
    
    const task: FFmpegTask = {
      id: taskId,
      input,
      output,
      options,
      status: 'pending',
      progress: 0,
    }
    this.tasks.set(taskId, task)

    return new Promise((resolve, reject) => {
      let totalTime = 0

      const command = ffmpeg(input)
        .on('start', () => {
          task.status = 'running'
          this.tasks.set(taskId, task)
        })
        .on('codecData', (data) => {
          const timeParts = data.duration.split(':')
          totalTime =
            parseFloat(timeParts[0]) * 3600 +
            parseFloat(timeParts[1]) * 60 +
            parseFloat(timeParts[2])
        })
        .on('progress', (progress) => {
          const currentTime = progress.timemark
            ? this.parseTimemark(progress.timemark)
            : 0
          const percent = totalTime > 0 ? (currentTime / totalTime) * 100 : 0

          task.progress = percent
          this.tasks.set(taskId, task)

          if (onProgress) {
            onProgress({
              taskId,
              percent,
              currentTime,
              totalTime,
              fps: progress.currentFps || 0,
              speed: progress.currentKbps ? `${progress.currentKbps}kbps` : 'N/A',
            })
          }
        })
        .on('end', () => {
          task.status = 'completed'
          task.progress = 100
          this.tasks.set(taskId, task)
          this.commands.delete(taskId)
          resolve(taskId)
        })
        .on('error', (err, _stdout, _stderr) => {
          if (err.message.includes('SIGKILL')) {
            task.status = 'cancelled'
          } else {
            task.status = 'error'
            task.error = err.message
          }
          this.tasks.set(taskId, task)
          this.commands.delete(taskId)
          
          if (task.status === 'cancelled') {
            resolve(taskId)
          } else {
            reject(new Error(err.message))
          }
        })

      if (options.format) {
        command.format(options.format)
      }
      if (options.videoCodec) {
        command.videoCodec(options.videoCodec)
      }
      if (options.audioCodec) {
        command.audioCodec(options.audioCodec)
      }
      if (options.videoBitrate) {
        command.videoBitrate(options.videoBitrate)
      }
      if (options.audioBitrate) {
        command.audioBitrate(options.audioBitrate)
      }
      if (options.resolution) {
        command.size(options.resolution)
      }
      if (options.fps) {
        command.fps(options.fps)
      }
      if (options.startTime !== undefined) {
        command.seekInput(options.startTime)
      }
      if (options.duration !== undefined) {
        command.duration(options.duration)
      }

      this.commands.set(taskId, command)
      command.save(output)
    })
  }

  cancel(taskId: string): void {
    const command = this.commands.get(taskId)
    if (command) {
      command.kill('SIGKILL')
    }
  }

  getTask(taskId: string): FFmpegTask | undefined {
    return this.tasks.get(taskId)
  }

  async getMediaInfo(filePath: string): Promise<MediaInfo> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err)
          return
        }

        const format = metadata.format
        const videoStream = metadata.streams.find((s) => s.codec_type === 'video')
        const audioStream = metadata.streams.find((s) => s.codec_type === 'audio')

        const info: MediaInfo = {
          format: format.format_name || 'unknown',
          duration: format.duration || 0,
          size: format.size || 0,
          bitrate: format.bit_rate ? parseInt(String(format.bit_rate)) : 0,
        }

        if (videoStream) {
          const fpsStr = videoStream.r_frame_rate || '0/1'
          const fpsParts = fpsStr.split('/')
          const fps = fpsParts.length === 2 
            ? parseInt(fpsParts[0]) / parseInt(fpsParts[1]) 
            : 0

          info.video = {
            codec: videoStream.codec_name || 'unknown',
            width: videoStream.width || 0,
            height: videoStream.height || 0,
            fps,
            bitrate: videoStream.bit_rate
              ? parseInt(String(videoStream.bit_rate))
              : 0,
          }
        }

        if (audioStream) {
          info.audio = {
            codec: audioStream.codec_name || 'unknown',
            channels: audioStream.channels || 0,
            sampleRate: audioStream.sample_rate
              ? parseInt(String(audioStream.sample_rate))
              : 0,
            bitrate: audioStream.bit_rate
              ? parseInt(String(audioStream.bit_rate))
              : 0,
          }
        }

        resolve(info)
      })
    })
  }

  private parseTimemark(timemark: string): number {
    const parts = timemark.split(':')
    if (parts.length === 3) {
      return (
        parseFloat(parts[0]) * 3600 +
        parseFloat(parts[1]) * 60 +
        parseFloat(parts[2])
      )
    }
    return 0
  }
}
