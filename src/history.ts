import { getHistory } from "./shared.js"
import type { HistoryItem } from "./types.js"

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error("Failed to copy:", err)
    return false
  }
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`

  return date.toLocaleDateString()
}

function renderHistory(items: HistoryItem[]): void {
  const container = document.getElementById("historyContainer")
  if (!container) return

  if (items.length === 0) {
    container.innerHTML = '<div class="no-history">No history yet. Start cleaning URLs!</div>'
    return
  }

  const html = items
    .map(
      (item) => `
    <div class="history-item">
      <div class="history-timestamp">${formatTimestamp(item.timestamp)}</div>
      <div class="history-urls">
        <div>
          <span class="history-url-label">Original:</span>
          <div class="history-url">${item.originalUrl}</div>
        </div>
        <div style="margin-top: 8px;">
          <span class="history-url-label">Clean:</span>
          <div class="history-url">${item.cleanUrl}</div>
        </div>
      </div>
      <div class="history-params">
        Removed ${item.removedParams.length} parameter${item.removedParams.length === 1 ? "" : "s"}
      </div>
      <div class="history-actions">
        <button class="history-btn copy-btn" data-url="${item.cleanUrl}">Copy Clean URL</button>
      </div>
    </div>
  `,
    )
    .join("")

  const clearButton =
    items.length > 0
      ? `
    <button class="history-btn clear-history-btn" style="margin-bottom: 20px;">Clear History</button>
  `
      : ""

  container.innerHTML = clearButton + html

  // Add event listeners
  container.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const target = e.target as HTMLButtonElement
      const url = target.dataset.url
      if (url) {
        const success = await copyToClipboard(url)
        if (success) {
          target.textContent = "✓ Copied!"
          setTimeout(() => {
            target.textContent = "Copy Clean URL"
          }, 2000)
        }
      }
    })
  })

  const clearBtn = container.querySelector(".clear-history-btn")
  if (clearBtn) {
    clearBtn.addEventListener("click", async () => {
      if (confirm("Are you sure you want to clear all history?")) {
        await chrome.storage.sync.set({ history: [] })
        renderHistory([])
      }
    })
  }
}

async function init() {
  const history = await getHistory()
  renderHistory(history)
}

document.addEventListener("DOMContentLoaded", init)
