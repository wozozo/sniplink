/**
 * Clipboard helper for Firefox
 * This script runs in a temporary tab to handle clipboard operations
 */

import { browserAPI } from "./browserCompat.js";

browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "copy") {
    const textarea = document.getElementById("clipboard-helper") as HTMLTextAreaElement;
    textarea.value = request.text;
    textarea.select();
    document.execCommand("copy");
    sendResponse({ success: true });
  }
  return true;
});