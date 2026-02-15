import { app } from 'electron'
import path from 'path'
import fs from 'fs'

export function getResourcePath(filename: string): string {
  const isDev = !app.isPackaged
  
  if (isDev) {
    return path.join(process.cwd(), 'node_modules', filename)
  }
  
  return path.join(process.resourcesPath, filename)
}

export function getFFmpegPath(): string {
  const isDev = !app.isPackaged
  
  if (isDev) {
    const ffmpegStatic = require('ffmpeg-static')
    return ffmpegStatic
  }
  
  const ffmpegPath = path.join(process.resourcesPath, 'ffmpeg')
  return fs.existsSync(ffmpegPath) ? ffmpegPath : 'ffmpeg'
}

export function getFFprobePath(): string {
  const isDev = !app.isPackaged
  
  if (isDev) {
    const ffprobePath = require('@ffprobe-installer/ffprobe').path
    return ffprobePath
  }
  
  const ffprobePath = path.join(process.resourcesPath, 'ffprobe')
  return fs.existsSync(ffprobePath) ? ffprobePath : 'ffprobe'
}

export function getUserDataPath(filename?: string): string {
  const userDataPath = app.getPath('userData')
  return filename ? path.join(userDataPath, filename) : userDataPath
}

export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}
