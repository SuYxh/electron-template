import Store from 'electron-store'
import type { AppConfig } from '../../../shared/types/database'
import { defaultAppConfig } from '../../../shared/types/database'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let store: any = null

interface StoreInterface {
  get: <K extends keyof AppConfig>(key: K, defaultValue?: AppConfig[K]) => AppConfig[K]
  set: <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => void
  delete: (key: keyof AppConfig) => void
  clear: () => void
  store: AppConfig
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const memoryStore: any = { ...defaultAppConfig }

const fallbackStore: StoreInterface = {
  get: (key, defaultValue) => {
    return memoryStore[key] ?? defaultValue ?? defaultAppConfig[key]
  },
  set: (key, value) => {
    memoryStore[key] = value
  },
  delete: (key) => {
    delete memoryStore[key]
  },
  clear: () => {
    Object.keys(memoryStore).forEach(key => {
      delete memoryStore[key]
    })
    Object.assign(memoryStore, defaultAppConfig)
  },
  store: memoryStore,
}

export function getAppStore(): StoreInterface {
  if (store) return store

  try {
    store = new Store<AppConfig>({
      name: 'config',
      defaults: defaultAppConfig,
    })
    return store as StoreInterface
  } catch (error) {
    console.warn('Failed to initialize electron-store, using memory store:', (error as Error).message)
    return fallbackStore
  }
}
