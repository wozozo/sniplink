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

async function loadSettings() {
  const result = await chrome.storage.sync.get(["customParams"])
  const customParams = result.customParams || []

  const customParamsEl = document.getElementById("customParams") as HTMLTextAreaElement | null
  if (customParamsEl) {
    customParamsEl.value = customParams.join("\n")
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
  if (!customParamsEl) {
    return
  }
  const customParamsText = customParamsEl.value
  const customParams = customParamsText
    .split("\n")
    .map((param: string) => param.trim())
    .filter((param: string) => param.length > 0)

  await chrome.storage.sync.set({ customParams })

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
})()
