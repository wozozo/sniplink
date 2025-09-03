import { DEFAULT_TRACKING_PARAMS } from "./constants.js";
import type { DomainParamConfig, StorageData } from "./types.js";

// Track editing state
let editingIndex: number | null = null;

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
    "disabledDefaultParams",
    "domainParams",
  ])) as StorageData;
  const customParams = result.customParams || [];
  const whitelist = result.whitelist || [];
  const amazonAssociateId = result.amazonAssociateId || "";
  const disabledDefaultParams = result.disabledDefaultParams || [];
  const domainParams = result.domainParams || [];

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

  // Display default parameters with toggles
  const defaultParamsEl = document.getElementById("defaultParams");
  if (defaultParamsEl) {
    defaultParamsEl.innerHTML = DEFAULT_TRACKING_PARAMS.map((param) => {
      const isDisabled = disabledDefaultParams.includes(param);
      return `
        <div class="param-toggle ${isDisabled ? "disabled" : ""}" data-param="${param}">
          <input 
            type="checkbox" 
            id="param-${param}" 
            ${isDisabled ? "" : "checked"}
          />
          <label for="param-${param}">${param}</label>
        </div>
      `;
    }).join("");

    // Add event listeners to toggles
    defaultParamsEl.querySelectorAll(".param-toggle").forEach((toggle) => {
      const checkbox = toggle.querySelector('input[type="checkbox"]') as HTMLInputElement;
      const param = toggle.getAttribute("data-param");

      if (checkbox && param) {
        checkbox.addEventListener("change", () => {
          toggleDefaultParam(param, checkbox.checked);
          toggle.classList.toggle("disabled", !checkbox.checked);
        });
      }
    });
  }

  // Load domain-specific parameters
  loadDomainParams(domainParams);
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

async function toggleDefaultParam(param: string, enabled: boolean) {
  const result = (await chrome.storage.sync.get(["disabledDefaultParams"])) as StorageData;
  let disabledDefaultParams = result.disabledDefaultParams || [];

  if (enabled) {
    // Remove from disabled list
    disabledDefaultParams = disabledDefaultParams.filter((p) => p !== param);
  } else {
    // Add to disabled list
    if (!disabledDefaultParams.includes(param)) {
      disabledDefaultParams.push(param);
    }
  }

  try {
    await chrome.storage.sync.set({ disabledDefaultParams } as StorageData);
    showStatus("defaultParamsStatus", "✓ Updated", "success");
  } catch (_error) {
    showStatus("defaultParamsStatus", "✗ Failed to update", "error");
  }
}

async function toggleAllParams() {
  const checkboxes = document.querySelectorAll(
    '#defaultParams input[type="checkbox"]',
  ) as NodeListOf<HTMLInputElement>;
  const allChecked = Array.from(checkboxes).every((cb) => cb.checked);

  if (allChecked) {
    // Disable all
    await chrome.storage.sync.set({
      disabledDefaultParams: [...DEFAULT_TRACKING_PARAMS],
    } as StorageData);
  } else {
    // Enable all
    await chrome.storage.sync.set({
      disabledDefaultParams: [],
    } as StorageData);
  }

  // Reload to update UI
  loadSettings();
}

function loadDomainParams(domainParams: DomainParamConfig[]) {
  const listEl = document.getElementById("domainParamsList");
  if (!listEl) return;

  listEl.innerHTML = domainParams
    .map(
      (config, index) => `
      <div class="domain-param-item" data-index="${index}">
        <div class="domain-param-header">
          <div class="domain-names">
            ${config.domains.map((domain) => `<span class="domain-tag">${domain}</span>`).join("")}
          </div>
          <div class="domain-actions">
            <button class="btn-edit" data-action="edit" data-index="${index}">
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.146 0.146a.5.5 0 0 1 .708 0L14.5 1.793a.5.5 0 0 1 0 .708L5.707 11.293a.5.5 0 0 1-.168.11l-3.5 1.5a.5.5 0 0 1-.65-.65l1.5-3.5a.5.5 0 0 1 .11-.168L12.146.146z" fill="currentColor"/>
                <path d="M11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5z" fill="currentColor"/>
              </svg>
            </button>
            <button class="btn-remove" data-action="remove" data-index="${index}">
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="domain-param-list">
          ${config.params.map((param) => `<span class="param-tag">${param}</span>`).join("")}
        </div>
      </div>
    `,
    )
    .join("");

  // Add event listeners for action buttons
  listEl.querySelectorAll("[data-action]").forEach((button) => {
    const action = button.getAttribute("data-action");
    const index = parseInt(button.getAttribute("data-index") || "0");

    button.addEventListener("click", () => {
      if (action === "remove") {
        removeDomainParam(index);
      } else if (action === "edit") {
        editDomainParam(index, domainParams);
      }
    });
  });
}

function extractDomain(input: string): string {
  const trimmed = input.trim();

  // Check if it looks like a URL
  if (trimmed.includes("://") || trimmed.startsWith("www.")) {
    try {
      // Add protocol if missing
      const urlString = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
      const url = new URL(urlString);
      return url.hostname;
    } catch (_error) {
      // If URL parsing fails, treat as plain domain
      return trimmed.replace(/^https?:\/\//, "").split("/")[0];
    }
  }

  // Return as-is for plain domains and wildcards
  return trimmed;
}

async function addDomainParam() {
  const domainsEl = document.getElementById("newDomains") as HTMLTextAreaElement | null;
  const paramsEl = document.getElementById("newDomainParams") as HTMLTextAreaElement | null;

  if (!domainsEl || !paramsEl) return;

  const domainsText = domainsEl.value.trim();
  const paramsText = paramsEl.value.trim();

  if (!domainsText || !paramsText) {
    showStatus("domainParamsStatus", "✗ Please enter both domains and parameters", "error");
    return;
  }

  const domains = domainsText
    .split("\n")
    .map((domain) => extractDomain(domain.trim()))
    .filter((domain) => domain.length > 0);

  const params = paramsText
    .split("\n")
    .map((param) => param.trim())
    .filter((param) => param.length > 0);

  if (domains.length === 0) {
    showStatus("domainParamsStatus", "✗ Please enter at least one domain", "error");
    return;
  }

  if (params.length === 0) {
    showStatus("domainParamsStatus", "✗ Please enter at least one parameter", "error");
    return;
  }

  try {
    const result = (await chrome.storage.sync.get(["domainParams"])) as StorageData;
    const domainParams = result.domainParams || [];

    if (editingIndex !== null) {
      // Update existing rule at specific index
      if (editingIndex >= 0 && editingIndex < domainParams.length) {
        domainParams[editingIndex] = { domains, params };
      }
    } else {
      // Add new rule
      domainParams.push({ domains, params });
    }

    await chrome.storage.sync.set({ domainParams } as StorageData);

    // Clear inputs and reset form state
    resetDomainForm();

    // Reload display
    loadDomainParams(domainParams);
    showStatus("domainParamsStatus", "✓ Domain rule saved");
  } catch (_error) {
    showStatus("domainParamsStatus", "✗ Failed to save domain rule", "error");
  }
}

async function removeDomainParam(index: number) {
  try {
    const result = (await chrome.storage.sync.get(["domainParams"])) as StorageData;
    const domainParams = result.domainParams || [];

    if (index >= 0 && index < domainParams.length) {
      domainParams.splice(index, 1);
      await chrome.storage.sync.set({ domainParams } as StorageData);
      loadDomainParams(domainParams);
      showStatus("domainParamsStatus", "✓ Domain rule removed");
    }
  } catch (_error) {
    showStatus("domainParamsStatus", "✗ Failed to remove domain rule", "error");
  }
}

function resetDomainForm() {
  const domainsEl = document.getElementById("newDomains") as HTMLTextAreaElement | null;
  const paramsEl = document.getElementById("newDomainParams") as HTMLTextAreaElement | null;
  const addBtn = document.getElementById("addDomainParam");

  if (domainsEl) domainsEl.value = "";
  if (paramsEl) paramsEl.value = "";

  if (addBtn) {
    addBtn.textContent = "Add Rule";
    addBtn.classList.remove("editing");
  }

  // Reset editing state
  editingIndex = null;
}

function editDomainParam(index: number, domainParams: DomainParamConfig[]) {
  if (index < 0 || index >= domainParams.length) return;

  const config = domainParams[index];
  const domainsEl = document.getElementById("newDomains") as HTMLTextAreaElement | null;
  const paramsEl = document.getElementById("newDomainParams") as HTMLTextAreaElement | null;
  const addBtn = document.getElementById("addDomainParam");

  if (!domainsEl || !paramsEl || !addBtn) return;

  // Set editing state
  editingIndex = index;

  // Populate form with existing values
  domainsEl.value = config.domains.join("\n");
  paramsEl.value = config.params.join("\n");

  // Update button text to indicate editing
  addBtn.textContent = "Update Rule";
  addBtn.classList.add("editing");

  // Scroll to form
  domainsEl.scrollIntoView({ behavior: "smooth", block: "center" });
  domainsEl.focus();

  // Show status indicating edit mode
  const domainCount = config.domains.length;
  const domainText = domainCount === 1 ? config.domains[0] : `${domainCount} domains`;
  showStatus("domainParamsStatus", `Editing rule for ${domainText}`, "success");
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

  const toggleAllBtn = document.getElementById("toggleAllParams");
  if (toggleAllBtn) {
    toggleAllBtn.addEventListener("click", toggleAllParams);
  }

  const addDomainParamBtn = document.getElementById("addDomainParam");
  if (addDomainParamBtn) {
    addDomainParamBtn.addEventListener("click", addDomainParam);
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
