import { 
  fetchNVRStatusHistory as fetchNVRStatusHistoryPG, 
  fetchNVRSnapshots as fetchNVRSnapshotsPG,
  fetchAllNVRHistory as fetchAllNVRHistoryPG,
  fetchAvailableDates as fetchAvailableDatesPG
} from "./postgresqlService";
import { NVRStatus } from "../types/nvr";

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

// Re-export functions from PostgreSQL service
export const fetchNVRStatusHistory = fetchNVRStatusHistoryPG;
export const fetchNVRSnapshots = fetchNVRSnapshotsPG;
export const fetchAllNVRHistory = fetchAllNVRHistoryPG;
export const fetchAvailableDates = fetchAvailableDatesPG;
