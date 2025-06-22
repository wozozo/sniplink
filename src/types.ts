export interface StorageData {
  customParams?: string[]
  whitelist?: string[]
  darkMode?: boolean
  amazonAssociateId?: string
}

export interface CleanUrlResult {
  cleanUrl: string
  removedParams: string[]
  error: string | null
}
