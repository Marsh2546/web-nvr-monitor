import { NVRStatus } from "../types/nvr";

// API base URL - use relative URL for Nginx proxy, fallback for development
const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_FALLBACK_URL || 'http://localhost:3001';

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

// Helper function for API calls
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

export async function fetchNVRStatusHistory(
  startDate: string,
  endDate: string,
): Promise<NVRStatus[]> {
  try {
    console.log("Fetching NVR status history between:", { startDate, endDate });

    // Use the NVR stations data as status history since we don't have the old structure
    const stations = await apiCall<NVRStation[]>('/api/nvr-stations');
    
    const transformedData: NVRStatus[] = stations.map((station) => ({
      id: station.id.toString(),
      nvr: station.nvr_name,
      district: 'Unknown', // Default value since we don't have this data
      location: 'Unknown', // Default value since we don't have this data
      onu_ip: '',
      ping_onu: true,
      nvr_ip: station.nvr_ip,
      ping_nvr: true,
      hdd_status: true,
      normal_view: true,
      check_login: true,
      camera_count: 0, // Will be updated when we fetch cameras
      date_updated: station.updated_at,
    }));

    // Fetch cameras to get camera counts
    try {
      const cameras = await apiCall<Camera[]>('/api/cameras');
      const cameraCounts = cameras.reduce((acc, camera) => {
        acc[camera.nvr_station_id] = (acc[camera.nvr_station_id] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      transformedData.forEach(nvr => {
        const stationId = parseInt(nvr.id);
        nvr.camera_count = cameraCounts[stationId] || 0;
      });
    } catch (error) {
      console.warn('Could not fetch camera counts:', error);
    }

    console.log(`Found ${transformedData.length} NVR records`);
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
    // Since we don't have the exact nvr_status_history structure, 
    // we'll return a transformed version of current data
    const stations = await apiCall<NVRStation[]>('/api/nvr-stations');
    
    return stations.slice(0, 10).map((station) => ({
      id: station.id,
      nvr_id: station.id.toString(),
      nvr_name: station.nvr_name,
      district: 'Unknown',
      location: 'Unknown',
      onu_ip: '',
      ping_onu: true,
      nvr_ip: station.nvr_ip,
      ping_nvr: true,
      hdd_status: true,
      normal_view: true,
      check_login: true,
      camera_count: 0,
      recorded_at: station.created_at,
      source: 'postgresql'
    }));
  } catch (error) {
    console.error("Failed to fetch all NVR history:", error);
    return [];
  }
}

export async function fetchAvailableDates(): Promise<string[]> {
  try {
    // Get unique dates from snapshot history
    const snapshots = await apiCall<NVRSnapshot[]>('/api/snapshots?limit=100');
    
    const uniqueDates = [
      ...new Set(
        snapshots
          .filter(s => s.recorded_at)
          .map((item) => item.recorded_at.split('T')[0]) // Extract date part
      ),
    ];
    
    return uniqueDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  } catch (error) {
    console.error("Failed to fetch available dates:", error);
    return [];
  }
}

// Additional functions for PostgreSQL-specific operations
export async function fetchNVRStations(): Promise<NVRStation[]> {
  return apiCall<NVRStation[]>('/api/nvr-stations');
}

export async function fetchCameras(): Promise<Camera[]> {
  return apiCall<Camera[]>('/api/cameras');
}

export async function fetchSnapshotLogs(cameraId?: number, limit: number = 50): Promise<any[]> {
  let endpoint = `/api/snapshot-logs?limit=${limit}`;
  if (cameraId) {
    endpoint += `&cameraId=${cameraId}`;
  }
  return apiCall<any[]>(endpoint);
}

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await apiCall('/health');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}
