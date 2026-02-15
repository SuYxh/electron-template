import { ipcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../../shared/constants/channels'
import { FFmpegService } from './ffmpeg.service'

const ffmpegService = new FFmpegService()

export function registerFFmpegHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.FFMPEG_CONVERT,
    async (_event, { input, output, options }) => {
      try {
        const taskId = await ffmpegService.convert(input, output, options, (progress) => {
          const windows = BrowserWindow.getAllWindows()
          windows.forEach((win) => {
            win.webContents.send(IPC_CHANNELS.FFMPEG_PROGRESS, progress)
          })
        })
        return { success: true, taskId }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    }
  )

  ipcMain.handle(IPC_CHANNELS.FFMPEG_CANCEL, async (_event, { taskId }) => {
    try {
      ffmpegService.cancel(taskId)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.FFMPEG_GET_INFO, async (_event, { filePath }) => {
    try {
      const info = await ffmpegService.getMediaInfo(filePath)
      return { success: true, info }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })
}

export { FFmpegService }
