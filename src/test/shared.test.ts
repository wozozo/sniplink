import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanUrl, getTrackingParams } from "../shared.js";

describe("shared utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getTrackingParams", () => {
    it("should return default params when no custom params", async () => {
      vi.mocked(chrome.storage.sync.get).mockResolvedValue({});

      const params = await getTrackingParams();

      expect(params).toContain("utm_source");
      expect(params).toContain("fbclid");
      expect(params).toContain("gclid");
    });

    it("should include custom params", async () => {
      vi.mocked(chrome.storage.sync.get).mockResolvedValue({
        customParams: ["custom1", "custom2"],
      });

      const params = await getTrackingParams();

      expect(params).toContain("utm_source");
      expect(params).toContain("custom1");
      expect(params).toContain("custom2");
    });
  });

  describe("cleanUrl", () => {
    beforeEach(() => {
      vi.mocked(chrome.storage.sync.get).mockImplementation(async (keys) => {
        const keysArray = Array.isArray(keys) ? keys : [keys];

        if (keysArray.includes("customParams")) {
          return { customParams: [] };
        }
        if (keysArray.includes("whitelist")) {
          return { whitelist: [] };
        }
        return {};
      });
    });

    it("should remove tracking parameters", async () => {
      const result = await cleanUrl("https://example.com?utm_source=test&page=1");

      expect(result.cleanUrl).toBe("https://example.com/?page=1");
      expect(result.removedParams).toEqual(["utm_source=test"]);
      expect(result.error).toBeNull();
    });

    it("should handle URLs without parameters", async () => {
      const result = await cleanUrl("https://example.com");

      expect(result.cleanUrl).toBe("https://example.com/");
      expect(result.removedParams).toEqual([]);
      expect(result.error).toBeNull();
    });

    it("should handle invalid URLs", async () => {
      const result = await cleanUrl("not-a-url");

      expect(result.cleanUrl).toBe("not-a-url");
      expect(result.removedParams).toEqual([]);
      expect(result.error).toBeTruthy();
    });

    it("should respect whitelisted domains", async () => {
      vi.mocked(chrome.storage.sync.get).mockImplementation(async (keys) => {
        if (keys.includes("whitelist")) {
          return { whitelist: ["example.com"] };
        }
        return {};
      });

      const result = await cleanUrl("https://example.com?utm_source=test");

      expect(result.cleanUrl).toBe("https://example.com?utm_source=test");
      expect(result.removedParams).toEqual([]);
      expect(result.error).toBeNull();
    });

    it("should handle subdomain whitelisting", async () => {
      vi.mocked(chrome.storage.sync.get).mockImplementation(async (keys) => {
        if (keys.includes("whitelist")) {
          return { whitelist: ["example.com"] };
        }
        return {};
      });

      const result = await cleanUrl("https://sub.example.com?utm_source=test");

      expect(result.cleanUrl).toBe("https://sub.example.com?utm_source=test");
      expect(result.removedParams).toEqual([]);
      expect(result.error).toBeNull();
    });

    it("should clean Amazon URLs to minimal permalink", async () => {
      const amazonUrl =
        "https://www.amazon.co.jp/%E3%82%A2%E3%82%A4%E3%83%AA%E3%82%B9%E3%82%AA%E3%83%BC%E3%83%A4%E3%83%9E-%E3%82%B5%E3%83%BC%E3%82%AD%E3%83%A5%E3%83%AC%E3%83%BC%E3%82%BF%E3%83%BC-%E5%B7%A6%E5%8F%B3%E9%A6%96%E6%8C%AF%E3%82%8A-%E3%81%8A%E6%89%8B%E5%85%A5%E3%82%8C%E7%B0%A1%E5%8D%98-PCF-HD15EC-W/dp/B0CW2X9CTJ?pd_rd_w=C0Xti&content-id=amzn1.sym.97d800e4-6ef7-4dc8-ae40-4b5f2aa90944&pf_rd_p=97d800e4-6ef7-4dc8-ae40-4b5f2aa90944&pf_rd_r=QS6BMRQPFTZBP28M5QHZ&pd_rd_wg=jlmBO&pd_rd_r=11a99120-28b5-4576-916d-a6f8df081920&pd_rd_i=B0CW2X9CTJ&ref_=pd_hp_d_btf_unk_B0CW2X9CTJ&th=1";

      const result = await cleanUrl(amazonUrl);

      expect(result.cleanUrl).toBe("https://www.amazon.co.jp/dp/B0CW2X9CTJ");
      expect(result.removedParams).toContain("pd_rd_w=C0Xti");
      expect(result.removedParams).toContain("th=1");
      expect(result.error).toBeNull();
    });

    it("should handle Amazon.com URLs", async () => {
      const result = await cleanUrl(
        "https://www.amazon.com/Some-Product-Name/dp/B08N5WRWNW?th=1&psc=1",
      );

      expect(result.cleanUrl).toBe("https://www.amazon.com/dp/B08N5WRWNW");
      expect(result.removedParams).toContain("th=1");
      expect(result.removedParams).toContain("psc=1");
      expect(result.error).toBeNull();
    });

    it("should handle Amazon URLs without dp in path", async () => {
      const result = await cleanUrl("https://www.amazon.co.jp/something?utm_source=test");

      expect(result.cleanUrl).toBe("https://www.amazon.co.jp/something");
      expect(result.removedParams).toEqual(["utm_source=test"]);
      expect(result.error).toBeNull();
    });

    it("should add Amazon Associate ID to cleaned Amazon URLs", async () => {
      // Override the beforeEach mock for this specific test
      (chrome.storage.sync.get as ReturnType<typeof vi.fn>) = vi
        .fn()
        .mockImplementation(async (keys: string | string[]) => {
          const keysArray = Array.isArray(keys) ? keys : [keys];

          if (keysArray.includes("whitelist")) {
            return { whitelist: [] };
          }
          if (keysArray.includes("amazonAssociateId")) {
            return { amazonAssociateId: "myassociate-22" };
          }
          if (keysArray.includes("customParams")) {
            return { customParams: [] };
          }

          return {};
        });

      const result = await cleanUrl("https://www.amazon.co.jp/Some-Product/dp/B08N5WRWNW?th=1");

      expect(result.cleanUrl).toBe("https://www.amazon.co.jp/dp/B08N5WRWNW?tag=myassociate-22");
      expect(result.removedParams).toContain("th=1");
      expect(result.error).toBeNull();
    });

    it("should remove s and t params on x.com", async () => {
      const result = await cleanUrl("https://x.com/user/status/123?s=20&t=abc");

      expect(result.cleanUrl).toBe("https://x.com/user/status/123");
      expect(result.removedParams).toContain("s=20");
      expect(result.removedParams).toContain("t=abc");
      expect(result.error).toBeNull();
    });

    it("should keep s param on other domains", async () => {
      const result = await cleanUrl("https://example.com/?s=query");

      expect(result.cleanUrl).toBe("https://example.com/?s=query");
      expect(result.removedParams).toEqual([]);
      expect(result.error).toBeNull();
    });

    it("should remove Substack tracking params", async () => {
      const result = await cleanUrl(
        "https://example.substack.com/p/sample-post?utm_source=post-email-title&publication_id=1234567&post_id=987654&utm_campaign=email-post-title&isFreemail=true&r=abc12&triedRedirect=true&utm_medium=email",
      );

      expect(result.cleanUrl).toBe("https://example.substack.com/p/sample-post");
      expect(result.removedParams).toContain("publication_id=1234567");
      expect(result.removedParams).toContain("post_id=987654");
      expect(result.removedParams).toContain("r=abc12");
      expect(result.error).toBeNull();
    });

    it("should keep r param on other domains", async () => {
      const result = await cleanUrl("https://example.com/?r=value");

      expect(result.cleanUrl).toBe("https://example.com/?r=value");
      expect(result.removedParams).toEqual([]);
      expect(result.error).toBeNull();
    });

    it("should remove Instagram tracking params", async () => {
      const result = await cleanUrl(
        "https://www.instagram.com/p/ABC123abc/?img_index=1&igsh=c2FtcGxlaWdzaA%3D%3D",
      );

      expect(result.cleanUrl).toBe("https://www.instagram.com/p/ABC123abc/");
      expect(result.removedParams).toContain("img_index=1");
      expect(result.removedParams).toContain("igsh=c2FtcGxlaWdzaA==");
      expect(result.error).toBeNull();
    });

    it("should not add tag parameter when Amazon Associate ID is not set", async () => {
      vi.mocked(chrome.storage.sync.get).mockImplementation(async () => ({}));

      const result = await cleanUrl("https://www.amazon.com/Product/dp/B08N5WRWNW?ref=test");

      expect(result.cleanUrl).toBe("https://www.amazon.com/dp/B08N5WRWNW");
      expect(result.removedParams).toContain("ref=test");
      expect(result.error).toBeNull();
    });
  });
});
