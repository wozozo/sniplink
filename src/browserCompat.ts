/**
 * Browser compatibility layer for Chrome/Firefox extension APIs
 */

// Type definitions for browser API
type BrowserAPI = typeof chrome;

// Declare global browser for Firefox
declare global {
  const browser: BrowserAPI | undefined;
}

// Detect browser type
export const isFirefox = typeof browser !== "undefined" && browser?.runtime?.getURL !== undefined;
export const isChrome = typeof chrome !== "undefined" && chrome?.runtime?.getURL !== undefined && !isFirefox;

// Get the appropriate browser API object
export function getBrowserAPI(): BrowserAPI {
  if (isFirefox && typeof browser !== "undefined") {
    return browser;
  }
  if (isChrome && typeof chrome !== "undefined") {
    return chrome;
  }
  throw new Error("No compatible browser API found");
}

// Export a unified browser object
export const browserAPI = getBrowserAPI();

// Check if Offscreen API is supported (Chrome only)
export const supportsOffscreenAPI = isChrome && "offscreen" in chrome;

// Clipboard copy function that works across browsers
export async function copyToClipboard(text: string): Promise<void> {
  if (isFirefox) {
    // Firefox: Use tabs API to create a temporary tab for clipboard access
    const tab = await browserAPI.tabs.create({
      url: browserAPI.runtime.getURL("src/clipboard.html"),
      active: false,
    });
    
    // Wait for tab to load and send message
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    await browserAPI.tabs.sendMessage(tab.id!, {
      action: "copy",
      text: text,
    });
    
    // Close the tab
    await browserAPI.tabs.remove(tab.id!);
  } else if (isChrome && supportsOffscreenAPI) {
    // Chrome: Use offscreen API
    try {
      // @ts-ignore - offscreen is Chrome-specific
      await chrome.offscreen.createDocument({
        url: "src/offscreen.html",
        reasons: ["CLIPBOARD"],
        justification: "Write URL to clipboard",
      });
    } catch (e) {
      // Document already exists
    }
    
    await chrome.runtime.sendMessage({
      action: "copyToClipboard",
      text: text,
    });
  } else {
    throw new Error("Clipboard API not supported in this browser");
  }
}