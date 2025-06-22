import { cleanUrl } from "./shared.js";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "cleanLink",
    title: "Copy clean link",
    contexts: ["link"],
  });

  chrome.contextMenus.create({
    id: "cleanPage",
    title: "Copy clean page URL",
    contexts: ["page"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  let urlToClean = "";

  if (info.menuItemId === "cleanLink" && info.linkUrl) {
    urlToClean = info.linkUrl;
  } else if (info.menuItemId === "cleanPage" && tab?.url) {
    urlToClean = tab.url;
  }

  if (!urlToClean) return;

  const result = await cleanUrl(urlToClean);

  if (result.error) {
    console.error("Failed to clean URL:", result.error);
    return;
  }

  // Copy to clipboard using offscreen document
  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["CLIPBOARD"],
    justification: "Copy clean URL to clipboard",
  });

  await chrome.runtime.sendMessage({
    action: "copyToClipboard",
    text: result.cleanUrl,
  });

  await chrome.offscreen.closeDocument();

  // Show notification
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon48.png",
    title: "SnipLink",
    message: `Copied clean URL (removed ${result.removedParams.length} parameters)`,
  });
});

