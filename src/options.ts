import { DEFAULT_TRACKING_PARAMS } from "./constants.js"
import type { StorageData } from "./types.js"

async function loadSettings() {
  const result = (await chrome.storage.sync.get(["customParams", "whitelist", "amazonAssociateId"])) as StorageData
  const customParams = result.customParams || []
  const whitelist = result.whitelist || []
  const amazonAssociateId = result.amazonAssociateId || ""

  const customParamsEl = document.getElementById("customParams") as HTMLTextAreaElement | null
  if (customParamsEl) {
    customParamsEl.value = customParams.join("\n")
  }

  const whitelistEl = document.getElementById("whitelist") as HTMLTextAreaElement | null
  if (whitelistEl) {
    whitelistEl.value = whitelist.join("\n")
  }

  const amazonAssociateIdEl = document.getElementById("amazonAssociateId") as HTMLInputElement | null
  if (amazonAssociateIdEl) {
    amazonAssociateIdEl.value = amazonAssociateId
  }

  // Display default parameters
  const defaultParamsEl = document.getElementById("defaultParams")
  if (defaultParamsEl) {
    defaultParamsEl.innerHTML = `
      <div class="params-grid">
        ${DEFAULT_TRACKING_PARAMS.map((param) => `<span class="param-tag">${param}</span>`).join("")}
      </div>
    `
  }
}

async function saveCustomParams() {
  const customParamsEl = document.getElementById("customParams") as HTMLTextAreaElement | null
  if (!customParamsEl) return

  const customParamsText = customParamsEl.value
  const customParams = customParamsText
    .split("\n")
    .map((param) => param.trim())
    .filter((param) => param.length > 0)

  await chrome.storage.sync.set({ customParams } as StorageData)
  showStatus("customParamsStatus", "✓ Custom parameters saved")
}

async function saveWhitelist() {
  const whitelistEl = document.getElementById("whitelist") as HTMLTextAreaElement | null
  if (!whitelistEl) return

  const whitelistText = whitelistEl.value
  const whitelist = whitelistText
    .split("\n")
    .map((domain) => domain.trim())
    .filter((domain) => domain.length > 0)

  await chrome.storage.sync.set({ whitelist } as StorageData)
  showStatus("whitelistStatus", "✓ Whitelist saved")
}

async function saveAmazonId() {
  const amazonAssociateIdEl = document.getElementById("amazonAssociateId") as HTMLInputElement | null
  if (!amazonAssociateIdEl) return

  const amazonAssociateId = amazonAssociateIdEl.value.trim()

  await chrome.storage.sync.set({ amazonAssociateId } as StorageData)
  showStatus("amazonIdStatus", "✓ Amazon Associate ID saved")
}

function showStatus(statusId: string, message: string) {
  const status = document.getElementById(statusId)
  if (status) {
    status.textContent = message
    status.className = "status success"

    setTimeout(() => {
      status.textContent = ""
      status.className = "status"
    }, 2000)
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadSettings()

  // Add event listeners for save buttons
  const saveCustomParamsBtn = document.getElementById("saveCustomParams")
  if (saveCustomParamsBtn) {
    saveCustomParamsBtn.addEventListener("click", saveCustomParams)
  }

  const saveWhitelistBtn = document.getElementById("saveWhitelist")
  if (saveWhitelistBtn) {
    saveWhitelistBtn.addEventListener("click", saveWhitelist)
  }

  const saveAmazonIdBtn = document.getElementById("saveAmazonId")
  if (saveAmazonIdBtn) {
    saveAmazonIdBtn.addEventListener("click", saveAmazonId)
  }

  // Save with Ctrl+S / Cmd+S (saves the focused section)
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault()
      
      const activeElement = document.activeElement
      if (activeElement?.id === "customParams") {
        saveCustomParams()
      } else if (activeElement?.id === "whitelist") {
        saveWhitelist()
      } else if (activeElement?.id === "amazonAssociateId") {
        saveAmazonId()
      }
    }
  })
})
