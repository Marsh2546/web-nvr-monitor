import { NVRStatus } from "@/app/types/nvr";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/server`;

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
    const endpoint = useCache ? "/nvr-status/cached" : "/nvr-status";
    const url = `${BASE_URL}${endpoint}`;

    console.log(`Fetching NVR status from: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${publicAnonKey}`,
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
    console.error("Error fetching NVR status:", error);
    throw error;
  }
}

export async function cacheNVRStatus(): Promise<void> {
  try {
    const url = `${BASE_URL}/nvr-status/cache`;

    console.log("Caching NVR status data...");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${publicAnonKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Cache error:", errorData);
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      );
    }

    const result = await response.json();
    console.log("Successfully cached NVR data:", result);
  } catch (error) {
    console.error("Error caching NVR status:", error);
    throw error;
  }
}
