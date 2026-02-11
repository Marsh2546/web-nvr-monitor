import { NVRStatus } from "../types/nvr";

// API base URL - use relative URL for Nginx proxy, fallback for development
const API_BASE_URL =
  import.meta.env?.VITE_API_URL ||
  import.meta.env?.VITE_API_FALLBACK_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:3001";

console.log("🔍 API_BASE_URL:", API_BASE_URL);

export interface NVRStatusHistory {
  id: number;
  nvr_id: string;
  nvr_name: string;
  district: string;
  location: string;
  onu_ip: string;
  ping_onu: boolean;
  nvr_ip: string;
  ping_nvr: boolean;
  hdd_status: boolean;
  normal_view: boolean;
  check_login: boolean;
  camera_count: number;
  recorded_at: string;
  source: string;
}

export interface NVRSnapshot {
  id: number;
  camera_name: string;
  nvr_ip: string;
  nvr_name: string;
  snapshot_status: string;
  comment: string;
  image_url: string;
  recorded_at: string;
}

export interface NVRStation {
  id: number;
  nvr_name: string;
  nvr_ip: string;
  nvr_port: number;
  username: string;
  password: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Camera {
  id: number;
  camera_name: string;
  nvr_station_id: number;
  camera_channel: number;
  status: string;
  created_at: string;
  updated_at: string;
}

// Helper function for API calls with better error handling
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `📡 API Call attempt ${attempt}/${maxRetries}: ${API_BASE_URL}${endpoint}`,
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...options?.headers,
        },
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error ${response.status}:`, errorText);
        throw new Error(
          `API Error: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const data = await response.json();
      console.log(`✅ API Success: ${endpoint}`, data);
      return data;
    } catch (error) {
      console.error(
        `❌ API call failed for ${endpoint} (attempt ${attempt}/${maxRetries}):`,
        error,
      );

      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
    }
  }

  throw new Error("Max retries exceeded");
}

export async function fetchNVRStatusHistory(
  startDate: string,
  endDate: string,
): Promise<NVRStatus[]> {
  try {
    console.log("Fetching NVR status history between:", { startDate, endDate });

    // Fetch NVR status history data from the new table
    const statusHistory = await apiCall<any[]>(
      `/api/snapshots?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
    );

    // Transform the data to match NVRStatus interface
    const transformedData: NVRStatus[] = statusHistory.map((record) => ({
      id: record.nvr_id || record.id.toString(),
      nvr: record.nvr_name,
      district: record.district,
      location: record.location,
      onu_ip: record.onu_ip || "",
      ping_onu: record.ping_onu,
      nvr_ip: record.nvr_ip,
      ping_nvr: record.ping_nvr,
      hdd_status: record.hdd_status,
      normal_view: record.normal_view,
      check_login: record.check_login,
      camera_count: record.camera_count || 0,
      date_updated: record.recorded_at,
    }));

    console.log(`Found ${transformedData.length} NVR status records`);
    return transformedData;
  } catch (error) {
    console.error("Error fetching NVR status history:", error);
    throw error;
  }
}

export async function fetchNVRSnapshots(
  nvrName: string,
  startDate?: string,
  endDate?: string,
): Promise<NVRSnapshot[]> {
  try {
    let endpoint = `/api/snapshots?nvrName=${encodeURIComponent(nvrName)}`;

    if (startDate && endDate) {
      endpoint += `&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
    }

    const snapshots = await apiCall<NVRSnapshot[]>(endpoint);
    return snapshots;
  } catch (error) {
    console.error("Failed to fetch NVR snapshots:", error);
    return [];
  }
}

export async function fetchAllNVRHistory(): Promise<NVRStatusHistory[]> {
  try {
    // Fetch directly from nvr-status-history endpoint
    const history = await apiCall<any[]>("/api/nvr-status-history");

    return history.map((record: any) => ({
      id: record.id,
      nvr_id: record.nvr_id || record.id.toString(),
      nvr_name: record.nvr_name,
      district: record.district || "Unknown",
      location: record.location || "Unknown",
      onu_ip: record.onu_ip || "",
      ping_onu: record.ping_onu,
      nvr_ip: record.nvr_ip,
      ping_nvr: record.ping_nvr,
      hdd_status: record.hdd_status,
      normal_view: record.normal_view,
      check_login: record.check_login,
      camera_count: record.camera_count || 0,
      recorded_at: record.recorded_at,
      source: record.source || "postgresql",
    }));
  } catch (error) {
    console.error("Failed to fetch all NVR history:", error);
    return [];
  }
}

export async function fetchAvailableDates(): Promise<string[]> {
  try {
    // Get unique dates from snapshot history
    // Since we don't have nvrName here, the backend will currently hit nvr_status_history.
    // However, for snapshot viewing, we might want snapshots dates.
    // For now, let's stick to snapshots endpoint but handle the mapping.
    const snapshots = await apiCall<any[]>("/api/snapshots?limit=100");

    const uniqueDates = [
      ...new Set(
        snapshots
          .filter((s) => s.recorded_at)
          .map((item: any) => item.recorded_at.split("T")[0]), // Extract date part
      ),
    ];

    return uniqueDates.sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    );
  } catch (error) {
    console.error("Failed to fetch available dates:", error);
    return [];
  }
}

// Additional functions for PostgreSQL-specific operations
export async function fetchNVRStations(): Promise<NVRStation[]> {
  // Use status history as a proxy for stations if dedicated endpoint is missing
  return apiCall<NVRStation[]>("/api/nvr-status-history");
}

export async function fetchCameras(): Promise<Camera[]> {
  return apiCall<Camera[]>("/api/cameras");
}

export async function fetchSnapshotLogs(
  cameraId?: number,
  limit: number = 3000,
): Promise<any[]> {
  let endpoint = `/api/snapshot-logs?limit=${limit}`;
  if (cameraId) {
    endpoint += `&cameraId=${cameraId}`;
  }
  return apiCall<any[]>(endpoint);
}

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await apiCall("/health");
    return true;
  } catch (error) {
    console.error("Database connection test failed:", error);
    return false;
  }
}
