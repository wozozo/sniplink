import { addToHistory, cleanUrl } from "./shared.js"

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "cleanLink",
    title: "Copy clean link",
    contexts: ["link"],
  })

  chrome.contextMenus.create({
    id: "cleanPage",
    title: "Copy clean page URL",
    contexts: ["page"],
  })
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  let urlToClean = ""

  if (info.menuItemId === "cleanLink" && info.linkUrl) {
    urlToClean = info.linkUrl
  } else if (info.menuItemId === "cleanPage" && tab?.url) {
    urlToClean = tab.url
  }

  if (!urlToClean) return

  const result = await cleanUrl(urlToClean)

  if (result.error) {
    console.error("Failed to clean URL:", result.error)
    return
  }

  // Copy to clipboard using offscreen document
  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["CLIPBOARD"],
    justification: "Copy clean URL to clipboard",
  })

  await chrome.runtime.sendMessage({
    action: "copyToClipboard",
    text: result.cleanUrl,
  })

  await chrome.offscreen.closeDocument()

  // Show notification
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon48.png",
    title: "SnipLink",
    message: `Copied clean URL (removed ${result.removedParams.length} parameters)`,
  })
})

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "clean-current-tab") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab.url) return

    const result = await cleanUrl(tab.url)

    if (result.error) {
      console.error("Failed to clean URL:", result.error)
      return
    }

    // Copy to clipboard
    await chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: ["CLIPBOARD"],
      justification: "Copy clean URL to clipboard",
    })

    await chrome.runtime.sendMessage({
      action: "copyToClipboard",
      text: result.cleanUrl,
    })

    await chrome.offscreen.closeDocument()

    // Add to history if parameters were removed
    if (result.removedParams.length > 0) {
      await addToHistory(tab.url, result.cleanUrl, result.removedParams)
    }

    // Show notification
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon48.png",
      title: "SnipLink",
      message:
        result.removedParams.length > 0
          ? `Copied clean URL (removed ${result.removedParams.length} parameters)`
          : "Copied URL (no parameters removed)",
    })
  }
})
