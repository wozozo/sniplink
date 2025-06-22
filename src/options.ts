import { DEFAULT_TRACKING_PARAMS } from "./constants.js"
import type { StorageData } from "./types.js"

async function loadSettings() {
  const result = (await chrome.storage.sync.get(["customParams", "whitelist"])) as StorageData
  const customParams = result.customParams || []
  const whitelist = result.whitelist || []

  const customParamsEl = document.getElementById("customParams") as HTMLTextAreaElement | null
  if (customParamsEl) {
    customParamsEl.value = customParams.join("\n")
  }

  const whitelistEl = document.getElementById("whitelist") as HTMLTextAreaElement | null
  if (whitelistEl) {
    whitelistEl.value = whitelist.join("\n")
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

async function saveSettings() {
  const customParamsEl = document.getElementById("customParams") as HTMLTextAreaElement | null
  const whitelistEl = document.getElementById("whitelist") as HTMLTextAreaElement | null

  if (!customParamsEl) {
    return
  }

  const customParamsText = customParamsEl.value
  const customParams = customParamsText
    .split("\n")
    .map((param) => param.trim())
    .filter((param) => param.length > 0)

  const whitelistText = whitelistEl?.value || ""
  const whitelist = whitelistText
    .split("\n")
    .map((domain) => domain.trim())
    .filter((domain) => domain.length > 0)

  await chrome.storage.sync.set({ customParams, whitelist } as StorageData)

  const status = document.getElementById("status")
  if (status) {
    status.textContent = "✓ Settings saved"
    status.className = "status success"

    setTimeout(() => {
      status.textContent = ""
      status.className = "status"
    }, 2000)
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadSettings()

  const saveBtn = document.getElementById("saveBtn")
  if (saveBtn) {
    saveBtn.addEventListener("click", saveSettings)
  }

  // Save with Ctrl+S / Cmd+S
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault()
      saveSettings()
    }
  })
})
