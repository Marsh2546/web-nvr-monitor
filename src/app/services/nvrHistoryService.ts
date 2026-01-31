import { supabase } from "../lib/supabase";
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

export async function fetchNVRStatusHistory(
  startDate: string,
  endDate: string,
): Promise<NVRStatus[]> {
  try {
    console.log("Fetching NVR status history between:", { startDate, endDate });

    let allData: NVRStatus[] = [];
    let offset = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("nvr_status_history")
        .select("*")
        .gte("recorded_at", startDate)
        .lte("recorded_at", endDate)
        .order("recorded_at", { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) {
        console.error("Supabase query error:", error);
        throw error;
      }

      if (data && data.length > 0) {
        // Get the latest record for each NVR
        const latestRecords = new Map<string, any>();

        data.forEach((record) => {
          const existing = latestRecords.get(record.nvr_id);
          if (
            !existing ||
            new Date(record.recorded_at) > new Date(existing.recorded_at)
          ) {
            latestRecords.set(record.nvr_id, record);
          }
        });

        const transformedData: NVRStatus[] = Array.from(
          latestRecords.values(),
        ).map((record) => ({
          id: record.nvr_id,
          nvr: record.nvr_name,
          district: record.district,
          location: record.location,
          onu_ip: record.onu_ip,
          ping_onu: record.ping_onu,
          nvr_ip: record.nvr_ip,
          ping_nvr: record.ping_nvr,
          hdd_status: record.hdd_status,
          normal_view: record.normal_view,
          check_login: record.check_login,
          camera_count: record.camera_count,
          date_updated: record.recorded_at,
        }));

        allData = allData.concat(transformedData);

        if (data.length < pageSize) {
          hasMore = false;
        } else {
          offset += pageSize;
        }
      } else {
        hasMore = false;
      }
    }

    console.log(`Found ${allData.length} unique NVR records`);
    return allData;
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
    let query = supabase
      .from("nvr_snapshot_history")
      .select("*")
      .eq("nvr_name", nvrName);

    if (startDate && endDate) {
      query = query.gte("recorded_at", startDate).lte("recorded_at", endDate);
    }

    const { data, error } = await query
      .order("recorded_at", { ascending: false })
      .limit(20); // Assumption: max 20 cameras per NVR usually

    if (error) {
      console.error("Error fetching NVR snapshots:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Failed to fetch NVR snapshots:", error);
    return [];
  }
}

export async function fetchAllNVRHistory(): Promise<NVRStatusHistory[]> {
  try {
    const { data, error } = await supabase
      .from("nvr_status_history")
      .select("*")
      .order("recorded_at", { ascending: false })
      .limit(10); // Get only 10 records for debugging

    if (error) {
      console.error("Error fetching all NVR history:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Failed to fetch all NVR history:", error);
    return [];
  }
}

export async function fetchAvailableDates(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("nvr_status_history")
      .select("recorded_at")
      .order("recorded_at", { ascending: false });

    if (error) {
      console.error("Error fetching available dates:", error);
      return [];
    }

    // Get unique dates
    const uniqueDates = [
      ...new Set(
        data?.map((item: { recorded_at: string }) => item.recorded_at) || [],
      ),
    ];
    return uniqueDates;
  } catch (error) {
    console.error("Failed to fetch available dates:", error);
    return [];
  }
}
