chrome.runtime.onMessage.addListener(async (message) => {
  if (message.action === "copyToClipboard") {
    try {
      await navigator.clipboard.writeText(message.text);
      return { success: true };
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }
});
