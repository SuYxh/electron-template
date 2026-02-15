import { useCallback, useEffect } from 'react'
import type { NotificationOptions } from '../../shared/types/notification'

const isElectron = typeof window !== 'undefined' && !!window.electronAPI

export function useNotification() {
  useEffect(() => {
    if (!isElectron) return

    const unsubscribe = window.electronAPI.notification.onClicked((_, data) => {
      console.log('Notification clicked:', data)
    })
    return unsubscribe
  }, [])

  const showNotification = useCallback(async (options: NotificationOptions) => {
    if (!isElectron) {
      console.log('[Browser Mode] Notification:', options.title, '-', options.body)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(options.title, { body: options.body })
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          new Notification(options.title, { body: options.body })
        }
      }
      return { success: true }
    }

    try {
      const result = await window.electronAPI.notification.show(options)
      return result
    } catch (error) {
      console.error('Failed to show notification:', error)
      return { success: false }
    }
  }, [])

  return { showNotification }
}
