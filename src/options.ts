import { DEFAULT_TRACKING_PARAMS } from "./constants.js";
import type { StorageData } from "./types.js";

function showStatus(statusId: string, message: string, type: "success" | "error" = "success") {
  const status = document.getElementById(statusId);
  if (status) {
    status.textContent = message;
    status.className = `status-message ${type} show`;

    setTimeout(() => {
      status.classList.remove("show");
    }, 3000);
  }
}

async function loadSettings() {
  const result = (await chrome.storage.sync.get([
    "customParams",
    "whitelist",
    "amazonAssociateId",
  ])) as StorageData;
  const customParams = result.customParams || [];
  const whitelist = result.whitelist || [];
  const amazonAssociateId = result.amazonAssociateId || "";

  const customParamsEl = document.getElementById("customParams") as HTMLTextAreaElement | null;
  if (customParamsEl) {
    customParamsEl.value = customParams.join("\n");
  }

  const whitelistEl = document.getElementById("whitelist") as HTMLTextAreaElement | null;
  if (whitelistEl) {
    whitelistEl.value = whitelist.join("\n");
  }

  const amazonAssociateIdEl = document.getElementById(
    "amazonAssociateId",
  ) as HTMLInputElement | null;
  if (amazonAssociateIdEl) {
    amazonAssociateIdEl.value = amazonAssociateId;
  }

  // Display default parameters
  const defaultParamsEl = document.getElementById("defaultParams");
  if (defaultParamsEl) {
    defaultParamsEl.innerHTML = DEFAULT_TRACKING_PARAMS.map(
      (param) => `<div class="param-item">${param}</div>`,
    ).join("");
  }
}

async function saveCustomParams() {
  const customParamsEl = document.getElementById("customParams") as HTMLTextAreaElement | null;
  if (!customParamsEl) return;

  const customParamsText = customParamsEl.value;
  const customParams = customParamsText
    .split("\n")
    .map((param) => param.trim())
    .filter((param) => param.length > 0);

  try {
    await chrome.storage.sync.set({ customParams } as StorageData);
    showStatus("customParamsStatus", "✓ Saved successfully");
  } catch (_error) {
    showStatus("customParamsStatus", "✗ Failed to save", "error");
  }
}

async function saveWhitelist() {
  const whitelistEl = document.getElementById("whitelist") as HTMLTextAreaElement | null;
  if (!whitelistEl) return;

  const whitelistText = whitelistEl.value;
  const whitelist = whitelistText
    .split("\n")
    .map((domain) => domain.trim())
    .filter((domain) => domain.length > 0);

  try {
    await chrome.storage.sync.set({ whitelist } as StorageData);
    showStatus("whitelistStatus", "✓ Saved successfully");
  } catch (_error) {
    showStatus("whitelistStatus", "✗ Failed to save", "error");
  }
}

async function saveAmazonId() {
  const amazonAssociateIdEl = document.getElementById(
    "amazonAssociateId",
  ) as HTMLInputElement | null;
  if (!amazonAssociateIdEl) return;

  const amazonAssociateId = amazonAssociateIdEl.value.trim();

  try {
    await chrome.storage.sync.set({ amazonAssociateId } as StorageData);
    showStatus("amazonIdStatus", "✓ Saved successfully");
  } catch (_error) {
    showStatus("amazonIdStatus", "✗ Failed to save", "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadSettings();

  // Add event listeners for save buttons
  const saveCustomParamsBtn = document.getElementById("saveCustomParams");
  if (saveCustomParamsBtn) {
    saveCustomParamsBtn.addEventListener("click", saveCustomParams);
  }

  const saveWhitelistBtn = document.getElementById("saveWhitelist");
  if (saveWhitelistBtn) {
    saveWhitelistBtn.addEventListener("click", saveWhitelist);
  }

  const saveAmazonIdBtn = document.getElementById("saveAmazonId");
  if (saveAmazonIdBtn) {
    saveAmazonIdBtn.addEventListener("click", saveAmazonId);
  }

  // Auto-save on input with debounce
  let saveTimeout: number | null = null;

  const debounceAutoSave = (saveFunction: () => void, statusId: string) => {
    if (saveTimeout) clearTimeout(saveTimeout);
    showStatus(statusId, "...", "success");
    saveTimeout = setTimeout(() => {
      saveFunction();
    }, 1000);
  };

  const customParamsEl = document.getElementById("customParams");
  if (customParamsEl) {
    customParamsEl.addEventListener("input", () => {
      debounceAutoSave(saveCustomParams, "customParamsStatus");
    });
  }

  const whitelistEl = document.getElementById("whitelist");
  if (whitelistEl) {
    whitelistEl.addEventListener("input", () => {
      debounceAutoSave(saveWhitelist, "whitelistStatus");
    });
  }

  const amazonAssociateIdEl = document.getElementById("amazonAssociateId");
  if (amazonAssociateIdEl) {
    amazonAssociateIdEl.addEventListener("input", () => {
      debounceAutoSave(saveAmazonId, "amazonIdStatus");
    });
  }

  // Save with Ctrl+S / Cmd+S (saves the focused section)
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();

      const activeElement = document.activeElement;
      if (activeElement?.id === "customParams") {
        saveCustomParams();
      } else if (activeElement?.id === "whitelist") {
        saveWhitelist();
      } else if (activeElement?.id === "amazonAssociateId") {
        saveAmazonId();
      }
    }
  });
});
