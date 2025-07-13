import { describe, it, expect, vi, beforeEach } from "vitest";
import { isFirefox, isChrome, getBrowserAPI, copyToClipboard } from "../browserCompat";

describe("browserCompat", () => {
  beforeEach(() => {
    // Reset global browser APIs
    vi.restoreAllMocks();
    // @ts-ignore
    global.browser = undefined;
    // @ts-ignore
    global.chrome = undefined;
  });

  describe("Browser Detection", () => {
    it("should detect Firefox when browser global exists", () => {
      // @ts-ignore
      global.browser = {
        runtime: { getURL: vi.fn() },
      };
      
      expect(isFirefox).toBe(true);
      expect(isChrome).toBe(false);
    });

    it("should detect Chrome when only chrome global exists", () => {
      // @ts-ignore
      global.chrome = {
        runtime: { getURL: vi.fn() },
      };
      
      expect(isFirefox).toBe(false);
      expect(isChrome).toBe(true);
    });
  });

  describe("getBrowserAPI", () => {
    it("should return browser API for Firefox", () => {
      const mockBrowserAPI = {
        runtime: { getURL: vi.fn() },
      };
      // @ts-ignore
      global.browser = mockBrowserAPI;
      
      const api = getBrowserAPI();
      expect(api).toBe(mockBrowserAPI);
    });

    it("should return chrome API for Chrome", () => {
      const mockChromeAPI = {
        runtime: { getURL: vi.fn() },
      };
      // @ts-ignore
      global.chrome = mockChromeAPI;
      
      const api = getBrowserAPI();
      expect(api).toBe(mockChromeAPI);
    });

    it("should throw error when no browser API is available", () => {
      expect(() => getBrowserAPI()).toThrow("No compatible browser API found");
    });
  });

  describe("copyToClipboard", () => {
    it("should use tabs API for Firefox", async () => {
      const mockTab = { id: 123 };
      const mockBrowserAPI = {
        runtime: { getURL: vi.fn().mockReturnValue("moz-extension://123/src/clipboard.html") },
        tabs: {
          create: vi.fn().mockResolvedValue(mockTab),
          sendMessage: vi.fn().mockResolvedValue(undefined),
          remove: vi.fn().mockResolvedValue(undefined),
        },
      };
      // @ts-ignore
      global.browser = mockBrowserAPI;
      
      await copyToClipboard("test text");
      
      expect(mockBrowserAPI.tabs.create).toHaveBeenCalledWith({
        url: "moz-extension://123/src/clipboard.html",
        active: false,
      });
      expect(mockBrowserAPI.tabs.sendMessage).toHaveBeenCalledWith(123, {
        action: "copy",
        text: "test text",
      });
      expect(mockBrowserAPI.tabs.remove).toHaveBeenCalledWith(123);
    });

    it("should use offscreen API for Chrome", async () => {
      const mockChromeAPI = {
        runtime: { 
          getURL: vi.fn(),
          sendMessage: vi.fn().mockResolvedValue({ success: true }),
        },
        offscreen: {
          createDocument: vi.fn().mockResolvedValue(undefined),
        },
      };
      // @ts-ignore
      global.chrome = mockChromeAPI;
      
      await copyToClipboard("test text");
      
      expect(mockChromeAPI.offscreen.createDocument).toHaveBeenCalledWith({
        url: "src/offscreen.html",
        reasons: ["CLIPBOARD"],
        justification: "Write URL to clipboard",
      });
      expect(mockChromeAPI.runtime.sendMessage).toHaveBeenCalledWith({
        action: "copyToClipboard",
        text: "test text",
      });
    });
  });
});