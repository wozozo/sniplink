import { beforeEach, describe, expect, it, vi } from "vitest"
import { addToHistory, cleanUrl, getHistory, getTrackingParams } from "../shared"

describe("shared utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getTrackingParams", () => {
    it("should return default params when no custom params", async () => {
      vi.mocked(chrome.storage.sync.get).mockResolvedValue({})

      const params = await getTrackingParams()

      expect(params).toContain("utm_source")
      expect(params).toContain("fbclid")
      expect(params).toContain("gclid")
    })

    it("should include custom params", async () => {
      vi.mocked(chrome.storage.sync.get).mockResolvedValue({
        customParams: ["custom1", "custom2"],
      })

      const params = await getTrackingParams()

      expect(params).toContain("utm_source")
      expect(params).toContain("custom1")
      expect(params).toContain("custom2")
    })
  })

  describe("cleanUrl", () => {
    beforeEach(() => {
      vi.mocked(chrome.storage.sync.get).mockImplementation(async (keys) => {
        if (keys.includes("customParams")) {
          return { customParams: [] }
        }
        if (keys.includes("whitelist")) {
          return { whitelist: [] }
        }
        return {}
      })
    })

    it("should remove tracking parameters", async () => {
      const result = await cleanUrl("https://example.com?utm_source=test&page=1")

      expect(result.cleanUrl).toBe("https://example.com/?page=1")
      expect(result.removedParams).toEqual(["utm_source=test"])
      expect(result.error).toBeNull()
    })

    it("should handle URLs without parameters", async () => {
      const result = await cleanUrl("https://example.com")

      expect(result.cleanUrl).toBe("https://example.com/")
      expect(result.removedParams).toEqual([])
      expect(result.error).toBeNull()
    })

    it("should handle invalid URLs", async () => {
      const result = await cleanUrl("not-a-url")

      expect(result.cleanUrl).toBe("not-a-url")
      expect(result.removedParams).toEqual([])
      expect(result.error).toBeTruthy()
    })

    it("should respect whitelisted domains", async () => {
      vi.mocked(chrome.storage.sync.get).mockImplementation(async (keys) => {
        if (keys.includes("whitelist")) {
          return { whitelist: ["example.com"] }
        }
        return {}
      })

      const result = await cleanUrl("https://example.com?utm_source=test")

      expect(result.cleanUrl).toBe("https://example.com?utm_source=test")
      expect(result.removedParams).toEqual([])
      expect(result.error).toBeNull()
    })

    it("should handle subdomain whitelisting", async () => {
      vi.mocked(chrome.storage.sync.get).mockImplementation(async (keys) => {
        if (keys.includes("whitelist")) {
          return { whitelist: ["example.com"] }
        }
        return {}
      })

      const result = await cleanUrl("https://sub.example.com?utm_source=test")

      expect(result.cleanUrl).toBe("https://sub.example.com?utm_source=test")
      expect(result.removedParams).toEqual([])
      expect(result.error).toBeNull()
    })
  })

  describe("history functions", () => {
    describe("addToHistory", () => {
      it("should add new item to history", async () => {
        vi.mocked(chrome.storage.sync.get).mockResolvedValue({ history: [] })

        await addToHistory("https://example.com?utm_source=test", "https://example.com", [
          "utm_source=test",
        ])

        expect(chrome.storage.sync.set).toHaveBeenCalledWith({
          history: expect.arrayContaining([
            expect.objectContaining({
              originalUrl: "https://example.com?utm_source=test",
              cleanUrl: "https://example.com",
              removedParams: ["utm_source=test"],
              timestamp: expect.any(Number),
            }),
          ]),
        })
      })

      it("should limit history to 10 items", async () => {
        const existingHistory = Array(10)
          .fill(null)
          .map((_, i) => ({
            originalUrl: `https://example${i}.com`,
            cleanUrl: `https://example${i}.com`,
            removedParams: [],
            timestamp: Date.now() - i * 1000,
          }))

        vi.mocked(chrome.storage.sync.get).mockResolvedValue({ history: existingHistory })

        await addToHistory("https://new.com?utm_source=test", "https://new.com", [
          "utm_source=test",
        ])

        const setCall = vi.mocked(chrome.storage.sync.set).mock.calls[0][0] as any
        expect(setCall.history).toHaveLength(10)
        expect(setCall.history[0].originalUrl).toBe("https://new.com?utm_source=test")
      })
    })

    describe("getHistory", () => {
      it("should return empty array when no history", async () => {
        vi.mocked(chrome.storage.sync.get).mockResolvedValue({})

        const history = await getHistory()

        expect(history).toEqual([])
      })

      it("should return stored history", async () => {
        const storedHistory = [
          {
            originalUrl: "https://example.com?utm_source=test",
            cleanUrl: "https://example.com",
            removedParams: ["utm_source=test"],
            timestamp: Date.now(),
          },
        ]

        vi.mocked(chrome.storage.sync.get).mockResolvedValue({ history: storedHistory })

        const history = await getHistory()

        expect(history).toEqual(storedHistory)
      })
    })
  })
})
