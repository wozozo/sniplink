import { cleanUrl } from "./shared.js";
import { browserAPI } from "./browserCompat.js";

async function getCurrentTab() {
  const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to copy:", err);
    return false;
  }
}

function showStatus(message: string, type: "success" | "error") {
  const status = document.getElementById("status");
  if (status) {
    status.textContent = message;
    status.className = `status-toast ${type} show`;

    // Hide after 3 seconds
    setTimeout(() => {
      status.classList.remove("show");
    }, 3000);
  }
}

async function init() {
  const tab = await getCurrentTab();
  if (!tab.url) {
    return;
  }

  let result = await cleanUrl(tab.url);

  // Update UI elements
  const originalUrlEl = document.getElementById("originalUrl");
  const cleanUrlEl = document.getElementById("cleanUrl");
  const removedParamsEl = document.getElementById("removedParams");
  const settingsBtn = document.getElementById("settingsBtn");
  const copyBtn = document.getElementById("copyBtn");

  // Display URLs
  if (originalUrlEl) {
    originalUrlEl.textContent = tab.url;
  }
  if (cleanUrlEl) {
    cleanUrlEl.textContent = result.cleanUrl;
  }

  // Copy button functionality
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const textToCopy = cleanUrlEl?.textContent || result.cleanUrl;
      const success = await copyToClipboard(textToCopy);

      if (result.error) {
        showStatus(`Error: ${result.error}`, "error");
      } else if (success) {
        const paramCount = result.removedParams.length;
        const message =
          paramCount > 0
            ? `✓ Copied! Removed ${paramCount} tracking parameter${paramCount > 1 ? "s" : ""}`
            : "✓ Copied clean URL";
        showStatus(message, "success");
      } else {
        showStatus("✗ Failed to copy to clipboard", "error");
      }
    });

    // Auto-copy on load
    copyBtn.click();
  }

  // Display URL metadata
  const originalMeta = document.getElementById("originalMeta");
  if (originalMeta) {
    try {
      const url = new URL(tab.url);
      originalMeta.textContent = url.hostname;
    } catch (_e) {
      originalMeta.textContent = "";
    }
  }

  // Display removed parameters
  if (removedParamsEl) {
    if (result.removedParams.length > 0) {
      removedParamsEl.innerHTML = `
        <label>Removed Parameters</label>
        <div class="params-grid">
          ${result.removedParams.map((param) => `<div class="param-tag">${param.split("=")[0]}</div>`).join("")}
        </div>
      `;
    } else {
      removedParamsEl.innerHTML = '<div class="no-params">No tracking parameters detected</div>';
    }
  }

  // Settings button
  if (settingsBtn) {
    settingsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      browserAPI.runtime.openOptionsPage();
    });
  }

  // Edit functionality
  const editBtn = document.getElementById("editBtn") as HTMLButtonElement | null;
  const saveBtn = document.getElementById("saveBtn") as HTMLButtonElement | null;
  const cancelBtn = document.getElementById("cancelBtn") as HTMLButtonElement | null;
  const cleanUrlInput = document.getElementById("cleanUrlInput") as HTMLInputElement | null;
  const editActions = document.getElementById("editActions") as HTMLDivElement | null;

  if (editBtn && saveBtn && cancelBtn && cleanUrlInput && cleanUrlEl && editActions) {
    editBtn.addEventListener("click", () => {
      cleanUrlInput.value = cleanUrlEl.textContent || result.cleanUrl;
      cleanUrlEl.style.display = "none";
      cleanUrlInput.style.display = "block";
      editActions.style.display = "flex";
      if (editBtn.parentElement) {
        editBtn.parentElement.style.display = "none";
      }
      cleanUrlInput.focus();
      cleanUrlInput.select();
    });

    const hideEditMode = () => {
      cleanUrlEl.style.display = "block";
      cleanUrlInput.style.display = "none";
      editActions.style.display = "none";
      if (editBtn.parentElement) {
        editBtn.parentElement.style.display = "flex";
      }
    };

    cancelBtn.addEventListener("click", hideEditMode);

    saveBtn.addEventListener("click", async () => {
      const newUrl = cleanUrlInput.value.trim();
      if (newUrl) {
        cleanUrlEl.textContent = newUrl;
        // Update result to reflect manual edit
        result = {
          ...result,
          cleanUrl: newUrl,
          removedParams: [],
        };
      }
      hideEditMode();
    });

    // Save on Enter key
    cleanUrlInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        saveBtn.click();
      } else if (e.key === "Escape") {
        cancelBtn.click();
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", init);
