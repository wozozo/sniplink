import { addToHistory, cleanUrl } from "./shared.js"
import type { CleanUrlResult } from "./types.js"

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

  // Add to history if successful and parameters were removed
  if (success && result.removedParams.length > 0) {
    await addToHistory(tab.url, result.cleanUrl, result.removedParams)
  }

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
    if (result.error) {
      status.textContent = `✗ Error: ${result.error}`
      status.className = "status error"
    } else if (success) {
      status.textContent = "✓ Copied to clipboard"
      status.className = "status success"
    } else {
      status.textContent = "✗ Failed to copy to clipboard"
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

  // History link event
  const historyLink = document.getElementById("historyLink")
  if (historyLink) {
    historyLink.addEventListener("click", (e) => {
      e.preventDefault()
      chrome.tabs.create({ url: chrome.runtime.getURL("src/history.html") })
    })
  }

  // Edit functionality
  const editBtn = document.getElementById("editBtn") as HTMLButtonElement | null
  const saveBtn = document.getElementById("saveBtn") as HTMLButtonElement | null
  const cancelBtn = document.getElementById("cancelBtn") as HTMLButtonElement | null
  const cleanUrlInput = document.getElementById("cleanUrlInput") as HTMLInputElement | null

  if (editBtn && saveBtn && cancelBtn && cleanUrlInput && cleanUrlEl) {
    editBtn.addEventListener("click", () => {
      cleanUrlInput.value = result.cleanUrl
      cleanUrlEl.style.display = "none"
      cleanUrlInput.style.display = "block"
      editBtn.style.display = "none"
      saveBtn.style.display = "inline-block"
      cancelBtn.style.display = "inline-block"
      cleanUrlInput.focus()
      cleanUrlInput.select()
    })

    cancelBtn.addEventListener("click", () => {
      cleanUrlEl.style.display = "block"
      cleanUrlInput.style.display = "none"
      editBtn.style.display = "inline-block"
      saveBtn.style.display = "none"
      cancelBtn.style.display = "none"
    })

    saveBtn.addEventListener("click", async () => {
      const newUrl = cleanUrlInput.value.trim()
      if (newUrl) {
        const success = await copyToClipboard(newUrl)
        if (status) {
          if (success) {
            status.textContent = "✓ Copied edited URL to clipboard"
            status.className = "status success"
          } else {
            status.textContent = "✗ Failed to copy edited URL"
            status.className = "status error"
          }
        }
        cleanUrlEl.textContent = newUrl
      }
      cleanUrlEl.style.display = "block"
      cleanUrlInput.style.display = "none"
      editBtn.style.display = "inline-block"
      saveBtn.style.display = "none"
      cancelBtn.style.display = "none"
    })

    // Save on Enter key
    cleanUrlInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        saveBtn.click()
      } else if (e.key === "Escape") {
        cancelBtn.click()
      }
    })
  }
}

document.addEventListener("DOMContentLoaded", init)
