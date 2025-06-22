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

    it("should clean Amazon URLs to minimal permalink", async () => {
      const amazonUrl = "https://www.amazon.co.jp/%E3%82%A2%E3%82%A4%E3%83%AA%E3%82%B9%E3%82%AA%E3%83%BC%E3%83%A4%E3%83%9E-%E3%82%B5%E3%83%BC%E3%82%AD%E3%83%A5%E3%83%AC%E3%83%BC%E3%82%BF%E3%83%BC-%E5%B7%A6%E5%8F%B3%E9%A6%96%E6%8C%AF%E3%82%8A-%E3%81%8A%E6%89%8B%E5%85%A5%E3%82%8C%E7%B0%A1%E5%8D%98-PCF-HD15EC-W/dp/B0CW2X9CTJ?pd_rd_w=C0Xti&content-id=amzn1.sym.97d800e4-6ef7-4dc8-ae40-4b5f2aa90944&pf_rd_p=97d800e4-6ef7-4dc8-ae40-4b5f2aa90944&pf_rd_r=QS6BMRQPFTZBP28M5QHZ&pd_rd_wg=jlmBO&pd_rd_r=11a99120-28b5-4576-916d-a6f8df081920&pd_rd_i=B0CW2X9CTJ&ref_=pd_hp_d_btf_unk_B0CW2X9CTJ&th=1"
      
      const result = await cleanUrl(amazonUrl)

      expect(result.cleanUrl).toBe("https://www.amazon.co.jp/dp/B0CW2X9CTJ")
      expect(result.removedParams).toContain("pd_rd_w=C0Xti")
      expect(result.removedParams).toContain("th=1")
      expect(result.error).toBeNull()
    })

    it("should handle Amazon.com URLs", async () => {
      const result = await cleanUrl("https://www.amazon.com/Some-Product-Name/dp/B08N5WRWNW?th=1&psc=1")

      expect(result.cleanUrl).toBe("https://www.amazon.com/dp/B08N5WRWNW")
      expect(result.removedParams).toContain("th=1")
      expect(result.removedParams).toContain("psc=1")
      expect(result.error).toBeNull()
    })

    it("should handle Amazon URLs without dp in path", async () => {
      const result = await cleanUrl("https://www.amazon.co.jp/something?utm_source=test")

      expect(result.cleanUrl).toBe("https://www.amazon.co.jp/something")
      expect(result.removedParams).toEqual(["utm_source=test"])
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
