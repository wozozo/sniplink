import { DEFAULT_TRACKING_PARAMS } from "./constants.js";
import type { CleanUrlResult, StorageData } from "./types.js";

function matchesDomain(hostname: string, domainPattern: string): boolean {
  const normalizedHostname = hostname.toLowerCase();
  const normalizedPattern = domainPattern.toLowerCase();

  // Handle wildcard subdomains (*.example.com)
  if (normalizedPattern.startsWith("*.")) {
    const baseDomain = normalizedPattern.slice(2);
    return normalizedHostname === baseDomain || normalizedHostname.endsWith(`.${baseDomain}`);
  }

  // Exact domain match or subdomain
  return (
    normalizedHostname === normalizedPattern || normalizedHostname.endsWith(`.${normalizedPattern}`)
  );
}

export async function getTrackingParams(): Promise<string[]> {
  const result = (await chrome.storage.sync.get([
    "customParams",
    "disabledDefaultParams",
  ])) as StorageData;
  const customParams = result.customParams || [];
  const disabledDefaultParams = result.disabledDefaultParams || [];

  // Filter out disabled default parameters
  const activeDefaultParams = DEFAULT_TRACKING_PARAMS.filter(
    (param) => !disabledDefaultParams.includes(param),
  );

  return [...activeDefaultParams, ...customParams];
}

export async function getDomainSpecificParams(hostname: string): Promise<string[]> {
  const result = (await chrome.storage.sync.get(["domainParams"])) as StorageData;
  const domainParams = result.domainParams || [];

  const matchingParams: string[] = [];

  for (const config of domainParams) {
    // Check if hostname matches any of the domains in the config
    const hasMatch = config.domains.some((domain) => matchesDomain(hostname, domain));
    if (hasMatch) {
      matchingParams.push(...config.params);
    }
  }

  return matchingParams;
}

export async function cleanUrl(urlString: string): Promise<CleanUrlResult> {
  try {
    const url = new URL(urlString);

    // Check if domain is whitelisted
    const result = (await chrome.storage.sync.get(["whitelist"])) as StorageData;
    const whitelist = result.whitelist || [];

    const hostname = url.hostname.toLowerCase();
    const isWhitelisted = whitelist.some((domain) => {
      const domainLower = domain.toLowerCase();
      return hostname === domainLower || hostname.endsWith(`.${domainLower}`);
    });

    if (isWhitelisted) {
      return { cleanUrl: urlString, removedParams: [], error: null };
    }

    // Special handling for Amazon URLs
    if (hostname.includes("amazon.")) {
      const dpMatch = url.pathname.match(/\/dp\/([A-Z0-9]+)/i);
      if (dpMatch) {
        const asin = dpMatch[1];
        let cleanAmazonUrl = `https://${url.hostname}/dp/${asin}`;
        const removedParams: string[] = [];

        // Get Amazon Associate ID from storage
        const storageResult = (await chrome.storage.sync.get(["amazonAssociateId"])) as StorageData;
        const amazonAssociateId = storageResult.amazonAssociateId;

        // Collect all removed parameters
        url.searchParams.forEach((value, key) => {
          removedParams.push(`${key}=${value}`);
        });

        // Also note if we removed path components
        if (url.pathname !== `/dp/${asin}`) {
          removedParams.push(`path=${url.pathname}`);
        }

        // Add Associate ID if configured
        if (amazonAssociateId) {
          cleanAmazonUrl += `?tag=${amazonAssociateId}`;
        }

        return { cleanUrl: cleanAmazonUrl, removedParams, error: null };
      }
    }

    const params = new URLSearchParams(url.search);
    const trackingParams = await getTrackingParams();
    const domainSpecificParams = await getDomainSpecificParams(hostname);
    const allParams = [...trackingParams, ...domainSpecificParams];
    const removedParams: string[] = [];

    allParams.forEach((param) => {
      if (params.has(param)) {
        removedParams.push(`${param}=${params.get(param)}`);
        params.delete(param);
      }
    });

    url.search = params.toString();
    return { cleanUrl: url.toString(), removedParams, error: null };
  } catch (error) {
    console.error("Failed to clean URL:", error);
    return {
      cleanUrl: urlString,
      removedParams: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
