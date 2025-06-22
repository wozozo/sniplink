chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "copyToClipboard") {
    // Use the textarea helper for clipboard operations
    const textarea = document.getElementById("clipboard-helper") as HTMLTextAreaElement;
    if (textarea) {
      textarea.value = message.text;
      textarea.select();

      try {
        const result = document.execCommand("copy");
        if (result) {
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: "Failed to copy using execCommand" });
        }
      } catch (error) {
        console.error("Failed to copy to clipboard:", error);
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    } else {
      sendResponse({ success: false, error: "Clipboard helper element not found" });
    }
    return false; // Respond synchronously
  }
});
