import { NVRStatus } from "@/app/types/nvr";

const BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_FALLBACK_URL || 'http://localhost:3001';

interface APIResponse {
  success: boolean;
  data?: NVRStatus[];
  count?: number;
  lastUpdated?: string;
  cachedAt?: string;
  error?: string;
  message?: string;
  note?: string;
}

export async function fetchNVRStatus(useCache = false): Promise<NVRStatus[]> {
  try {
    // Use the correct endpoint for Google Sheets data
    const endpoint = useCache ? "/api/nvr-status/cached" : "/api/nvr-status";
    const url = `${BASE_URL}${endpoint}`;

    console.log(`Fetching NVR status from: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API error:", errorData);
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      );
    }

    const result: APIResponse = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error || "Invalid API response");
    }

    console.log(`Successfully fetched ${result.count} NVR records`);
    if (result.cachedAt) {
      console.log(`Data cached at: ${result.cachedAt}`);
    }

    return result.data;
  } catch (error) {
    console.error("Failed to fetch NVR status:", error);
    throw error;
  }
}

export async function cacheNVRStatus(): Promise<void> {
  try {
    const url = `${BASE_URL}/api/nvr-status/cache`;

    console.log("Caching NVR status data...");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Cache API error:", errorData);
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      );
    }

    const result = await response.json();
    console.log("Cache response:", result);
  } catch (error) {
    console.error("Failed to cache NVR status:", error);
    throw error;
  }
}
