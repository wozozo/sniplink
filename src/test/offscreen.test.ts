import { JSDOM } from "jsdom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("offscreen script", () => {
  let dom: JSDOM;
  let document: Document;
  let mockSendResponse: ReturnType<typeof vi.fn>;
  let execCommandSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Set up DOM environment
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
      <body>
        <textarea id="clipboard-helper" style="position: fixed; top: -9999px;"></textarea>
      </body>
      </html>
    `);
    document = dom.window.document;
    global.document = document as unknown as Document;

    // Mock chrome.runtime.onMessage
    global.chrome = {
      runtime: {
        onMessage: {
          addListener: vi.fn(),
        },
      },
    } as unknown as typeof chrome;

    // Mock execCommand (JSDOM doesn't have it by default)
    document.execCommand = vi.fn().mockReturnValue(true);
    execCommandSpy = document.execCommand;

    // Mock sendResponse
    mockSendResponse = vi.fn();

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("should register message listener on load", async () => {
    await import("../offscreen.js");

    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledTimes(1);
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledWith(expect.any(Function));
  });

  it("should successfully copy text to clipboard", async () => {
    await import("../offscreen.js");

    const messageListener = (chrome.runtime.onMessage.addListener as ReturnType<typeof vi.fn>).mock
      .calls[0][0];

    const testText = "https://example.com/clean";
    const result = messageListener(
      { action: "copyToClipboard", text: testText },
      {},
      mockSendResponse,
    );

    // Check textarea was updated
    const textarea = document.getElementById("clipboard-helper") as HTMLTextAreaElement;
    expect(textarea.value).toBe(testText);

    // Check execCommand was called
    expect(execCommandSpy).toHaveBeenCalledWith("copy");

    // Check response
    expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
    expect(result).toBe(false); // Should return false for synchronous response
  });

  it("should handle execCommand failure", async () => {
    execCommandSpy.mockReturnValue(false);

    await import("../offscreen.js");

    const messageListener = (chrome.runtime.onMessage.addListener as ReturnType<typeof vi.fn>).mock
      .calls[0][0];

    messageListener({ action: "copyToClipboard", text: "test" }, {}, mockSendResponse);

    expect(mockSendResponse).toHaveBeenCalledWith({
      success: false,
      error: "Failed to copy using execCommand",
    });
  });

  it("should handle execCommand exceptions", async () => {
    const testError = new Error("Copy failed");
    execCommandSpy.mockImplementation(() => {
      throw testError;
    });

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await import("../offscreen.js");

    const messageListener = (chrome.runtime.onMessage.addListener as ReturnType<typeof vi.fn>).mock
      .calls[0][0];

    messageListener({ action: "copyToClipboard", text: "test" }, {}, mockSendResponse);

    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to copy to clipboard:", testError);
    expect(mockSendResponse).toHaveBeenCalledWith({
      success: false,
      error: "Copy failed",
    });

    consoleErrorSpy.mockRestore();
  });

  it("should handle missing clipboard helper element", async () => {
    // Remove the textarea element
    const textarea = document.getElementById("clipboard-helper");
    textarea?.remove();

    await import("../offscreen.js");

    const messageListener = (chrome.runtime.onMessage.addListener as ReturnType<typeof vi.fn>).mock
      .calls[0][0];

    messageListener({ action: "copyToClipboard", text: "test" }, {}, mockSendResponse);

    expect(mockSendResponse).toHaveBeenCalledWith({
      success: false,
      error: "Clipboard helper element not found",
    });
  });

  it("should ignore non-copyToClipboard messages", async () => {
    await import("../offscreen.js");

    const messageListener = (chrome.runtime.onMessage.addListener as ReturnType<typeof vi.fn>).mock
      .calls[0][0];

    const result = messageListener(
      { action: "someOtherAction", data: "test" },
      {},
      mockSendResponse,
    );

    expect(mockSendResponse).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it("should select text in textarea before copying", async () => {
    await import("../offscreen.js");

    const messageListener = (chrome.runtime.onMessage.addListener as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    const textarea = document.getElementById("clipboard-helper") as HTMLTextAreaElement;
    const selectSpy = vi.spyOn(textarea, "select");

    messageListener({ action: "copyToClipboard", text: "test text" }, {}, mockSendResponse);

    expect(selectSpy).toHaveBeenCalled();
    selectSpy.mockRestore();
  });
});
