(() => {
const DEFAULT_TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "utm_cid",
  "utm_reader",
  "utm_referrer",
  "utm_name",
  "utm_social",
  "utm_social-type",
  "fbclid",
  "gclid",
  "dclid",
  "twclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
  "pk_campaign",
  "pk_kwd",
  "pk_source",
  "pk_medium",
  "piwik_campaign",
  "piwik_kwd",
  "affiliate",
  "ref",
  "referrer",
  "source",
  "spm",
  "partner",
  "promo",
  "campaign",
  "ad",
  "agid",
  "kwid",
  "adid",
  "cid",
  "sid",
  "pid",
  "aid",
  "bid",
  "vid",
] as const

async function getTrackingParams() {
  const result = await chrome.storage.sync.get(["customParams"])
  const customParams = result.customParams || []
  return [...DEFAULT_TRACKING_PARAMS, ...customParams]
}

async function cleanUrl(urlString: string): Promise<{ cleanUrl: string; removedParams: string[] }> {
  try {
    const url = new URL(urlString)
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
    return { cleanUrl: url.toString(), removedParams }
  } catch (_e) {
    return { cleanUrl: urlString, removedParams: [] }
  }
}

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error("Failed to copy:", err)
    return false
  }
}

async function init() {
  const tab = await getCurrentTab()
  if (!tab.url) {
    return
  }
  const result = await cleanUrl(tab.url)

  // Copy to clipboard immediately
  const success = await copyToClipboard(result.cleanUrl)

  // Update UI elements
  const status = document.getElementById("status")
  const originalUrlEl = document.getElementById("originalUrl")
  const cleanUrlEl = document.getElementById("cleanUrl")
  const removedParamsEl = document.getElementById("removedParams")
  const settingsLink = document.getElementById("settingsLink")

  // Display URLs
  if (originalUrlEl) {
    originalUrlEl.textContent = tab.url
  }
  if (cleanUrlEl) {
    cleanUrlEl.textContent = result.cleanUrl
  }

  // Display status
  if (status) {
    if (success) {
      status.textContent = "✓ Copied to clipboard"
      status.className = "status success"
    } else {
      status.textContent = "✗ Failed to copy"
      status.className = "status error"
    }
  }

  // Display removed parameters
  if (removedParamsEl) {
    if (result.removedParams.length > 0) {
      removedParamsEl.innerHTML = `
        <label>Removed parameters:</label>
        <ul class="params-list">
          ${result.removedParams.map((param) => `<li>${param}</li>`).join("")}
        </ul>
      `
    } else {
      removedParamsEl.innerHTML = '<div class="no-params">No parameters were removed</div>'
    }
  }

  // Settings link event
  if (settingsLink) {
    settingsLink.addEventListener("click", (e) => {
      e.preventDefault()
      chrome.runtime.openOptionsPage()
    })
  }
}

document.addEventListener("DOMContentLoaded", init)
})()
