import { DEFAULT_TRACKING_PARAMS } from "./constants.js"
import type { CleanUrlResult, HistoryItem, StorageData } from "./types.js"

export async function getTrackingParams(): Promise<string[]> {
  const result = (await chrome.storage.sync.get(["customParams"])) as StorageData
  const customParams = result.customParams || []
  return [...DEFAULT_TRACKING_PARAMS, ...customParams]
}

export async function cleanUrl(urlString: string): Promise<CleanUrlResult> {
  try {
    const url = new URL(urlString)

    // Check if domain is whitelisted
    const result = (await chrome.storage.sync.get(["whitelist"])) as StorageData
    const whitelist = result.whitelist || []

    const hostname = url.hostname.toLowerCase()
    const isWhitelisted = whitelist.some((domain) => {
      const domainLower = domain.toLowerCase()
      return hostname === domainLower || hostname.endsWith(`.${domainLower}`)
    })

    if (isWhitelisted) {
      return { cleanUrl: urlString, removedParams: [], error: null }
    }

    const params = new URLSearchParams(url.search)
    const trackingParams = await getTrackingParams()
    const removedParams: string[] = []

    trackingParams.forEach((param) => {
      if (params.has(param)) {
        removedParams.push(`${param}=${params.get(param)}`)
        params.delete(param)
      }
    })

    url.search = params.toString()
    return { cleanUrl: url.toString(), removedParams, error: null }
  } catch (error) {
    console.error("Failed to clean URL:", error)
    return {
      cleanUrl: urlString,
      removedParams: [],
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

const MAX_HISTORY_ITEMS = 10

export async function addToHistory(
  originalUrl: string,
  cleanUrl: string,
  removedParams: string[],
): Promise<void> {
  const result = (await chrome.storage.sync.get(["history"])) as StorageData
  const history = result.history || []

  const newItem: HistoryItem = {
    originalUrl,
    cleanUrl,
    removedParams,
    timestamp: Date.now(),
  }

  // Add to beginning and limit to MAX_HISTORY_ITEMS
  const updatedHistory = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS)

  await chrome.storage.sync.set({ history: updatedHistory })
}

export async function getHistory(): Promise<HistoryItem[]> {
  const result = (await chrome.storage.sync.get(["history"])) as StorageData
  return result.history || []
}
