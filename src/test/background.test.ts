import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock chrome APIs
const mockContextMenus = {
  create: vi.fn(),
  onClicked: {
    addListener: vi.fn(),
  },
};

const mockNotifications = {
  create: vi.fn(),
};

const mockOffscreen = {
  createDocument: vi.fn(),
  closeDocument: vi.fn(),
};

const mockRuntime = {
  onInstalled: {
    addListener: vi.fn(),
  },
  sendMessage: vi.fn(),
};

// Set up chrome mock
global.chrome = {
  contextMenus: mockContextMenus,
  notifications: mockNotifications,
  offscreen: mockOffscreen,
  runtime: mockRuntime,
} as unknown as typeof chrome;

// Mock the shared module
vi.mock("../shared.js", () => ({
  cleanUrl: vi.fn(),
}));

describe("background script", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("should create context menus on installation", async () => {
    // Import after mocks are set up
    await import("../background.js");

    // Get the onInstalled callback
    const onInstalledCallback = mockRuntime.onInstalled.addListener.mock.calls[0][0];

    // Execute the callback
    onInstalledCallback();

    // Verify context menus were created
    expect(mockContextMenus.create).toHaveBeenCalledTimes(2);
    expect(mockContextMenus.create).toHaveBeenCalledWith({
      id: "cleanLink",
      title: "Copy clean link",
      contexts: ["link"],
    });
    expect(mockContextMenus.create).toHaveBeenCalledWith({
      id: "cleanPage",
      title: "Copy clean page URL",
      contexts: ["page"],
    });
  });

  it("should handle context menu clicks for links", async () => {
    const { cleanUrl } = await import("../shared.js");
    const mockCleanUrl = cleanUrl as typeof vi.fn;
    mockCleanUrl.mockResolvedValue({
      cleanUrl: "https://example.com/clean",
      removedParams: ["utm_source", "utm_medium"],
      error: null,
    });

    mockRuntime.sendMessage.mockResolvedValue({ success: true });

    await import("../background.js");

    // Get the onClicked callback
    const onClickedCallback = mockContextMenus.onClicked.addListener.mock.calls[0][0];

    // Simulate clicking on a link
    await onClickedCallback(
      {
        menuItemId: "cleanLink",
        linkUrl: "https://example.com?utm_source=test&utm_medium=test",
      },
      {},
    );

    // Verify cleanUrl was called
    expect(mockCleanUrl).toHaveBeenCalledWith(
      "https://example.com?utm_source=test&utm_medium=test",
    );

    // Verify offscreen document was created
    expect(mockOffscreen.createDocument).toHaveBeenCalledWith({
      url: "src/offscreen.html",
      reasons: ["CLIPBOARD"],
      justification: "Copy clean URL to clipboard",
    });

    // Verify message was sent
    expect(mockRuntime.sendMessage).toHaveBeenCalledWith({
      action: "copyToClipboard",
      text: "https://example.com/clean",
    });

    // Verify notification was shown
    expect(mockNotifications.create).toHaveBeenCalledWith({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "SnipLink",
      message: "Copied clean URL (removed 2 parameters)",
    });
  });

  it("should handle context menu clicks for pages", async () => {
    const { cleanUrl } = await import("../shared.js");
    const mockCleanUrl = cleanUrl as typeof vi.fn;
    mockCleanUrl.mockResolvedValue({
      cleanUrl: "https://example.com/page",
      removedParams: [],
      error: null,
    });

    mockRuntime.sendMessage.mockResolvedValue({ success: true });

    await import("../background.js");

    const onClickedCallback = mockContextMenus.onClicked.addListener.mock.calls[0][0];

    // Simulate clicking on a page
    await onClickedCallback(
      {
        menuItemId: "cleanPage",
      },
      {
        url: "https://example.com/page?tracking=123",
      },
    );

    expect(mockCleanUrl).toHaveBeenCalledWith("https://example.com/page?tracking=123");
  });

  it("should handle clipboard copy errors", async () => {
    const { cleanUrl } = await import("../shared.js");
    const mockCleanUrl = cleanUrl as typeof vi.fn;
    mockCleanUrl.mockResolvedValue({
      cleanUrl: "https://example.com/clean",
      removedParams: [],
      error: null,
    });

    mockRuntime.sendMessage.mockResolvedValue({ success: false, error: "Clipboard error" });

    await import("../background.js");

    const onClickedCallback = mockContextMenus.onClicked.addListener.mock.calls[0][0];

    await onClickedCallback(
      {
        menuItemId: "cleanLink",
        linkUrl: "https://example.com",
      },
      {},
    );

    // Verify error notification was shown
    expect(mockNotifications.create).toHaveBeenCalledWith({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "SnipLink Error",
      message: "Failed to copy URL to clipboard",
    });
  });

  it("should handle cleanUrl errors", async () => {
    const { cleanUrl } = await import("../shared.js");
    const mockCleanUrl = cleanUrl as typeof vi.fn;
    mockCleanUrl.mockResolvedValue({
      cleanUrl: "",
      removedParams: [],
      error: "Invalid URL",
    });

    await import("../background.js");

    const onClickedCallback = mockContextMenus.onClicked.addListener.mock.calls[0][0];

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await onClickedCallback(
      {
        menuItemId: "cleanLink",
        linkUrl: "not-a-url",
      },
      {},
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to clean URL:", "Invalid URL");
    expect(mockNotifications.create).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("should handle missing URLs gracefully", async () => {
    await import("../background.js");

    const onClickedCallback = mockContextMenus.onClicked.addListener.mock.calls[0][0];

    // No linkUrl provided
    await onClickedCallback(
      {
        menuItemId: "cleanLink",
      },
      {},
    );

    expect(mockOffscreen.createDocument).not.toHaveBeenCalled();
    expect(mockNotifications.create).not.toHaveBeenCalled();
  });

  it("should handle existing offscreen document", async () => {
    const { cleanUrl } = await import("../shared.js");
    const mockCleanUrl = cleanUrl as typeof vi.fn;
    mockCleanUrl.mockResolvedValue({
      cleanUrl: "https://example.com/clean",
      removedParams: [],
      error: null,
    });

    mockOffscreen.createDocument.mockRejectedValueOnce(new Error("Document already exists"));
    mockRuntime.sendMessage.mockResolvedValue({ success: true });

    await import("../background.js");

    const onClickedCallback = mockContextMenus.onClicked.addListener.mock.calls[0][0];

    await onClickedCallback(
      {
        menuItemId: "cleanLink",
        linkUrl: "https://example.com",
      },
      {},
    );

    // Should still send message even if document creation failed
    expect(mockRuntime.sendMessage).toHaveBeenCalled();
    expect(mockNotifications.create).toHaveBeenCalled();
  });
});
