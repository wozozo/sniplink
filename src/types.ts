export interface StorageData {
  customParams?: string[]
  whitelist?: string[]
  darkMode?: boolean
  history?: HistoryItem[]
}

export interface HistoryItem {
  originalUrl: string
  cleanUrl: string
  removedParams: string[]
  timestamp: number
}

export interface CleanUrlResult {
  cleanUrl: string
  removedParams: string[]
  error: string | null
}
