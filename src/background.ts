import { cleanUrl } from "./shared.js";
import { browserAPI, copyToClipboard } from "./browserCompat.js";

browserAPI.runtime.onInstalled.addListener(() => {
  browserAPI.contextMenus.create({
    id: "cleanLink",
    title: "Copy clean link",
    contexts: ["link"],
  });

  browserAPI.contextMenus.create({
    id: "cleanPage",
    title: "Copy clean page URL",
    contexts: ["page"],
  });
});

browserAPI.contextMenus.onClicked.addListener(async (info, tab) => {
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

  // Copy to clipboard
  try {
    await copyToClipboard(result.cleanUrl);
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    // Show error notification
    browserAPI.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "SnipLink Error",
      message: "Failed to copy URL to clipboard",
    });
    return;
  }

  // Show notification
  browserAPI.notifications.create({
    type: "basic",
    iconUrl: "icons/icon48.png",
    title: "SnipLink",
    message: `Copied clean URL (removed ${result.removedParams.length} parameters)`,
  });
});
