import { Pool } from "pg";

// Database connection pool
export const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5435"),
  database: process.env.DB_NAME || "cctv_nvr",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

// Helper function for database queries
export async function query<T>(text: string, params?: any[]): Promise<T[]> {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("Executed query", { text, duration, rows: res.rowCount });
    return res.rows;
  } catch (error) {
    console.error("Database query error:", { text, error });
    throw error;
  }
}

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

// Database service functions
export async function fetchNVRStations(): Promise<NVRStation[]> {
  return query<NVRStation>(`
    SELECT id, nvr_name, nvr_ip, nvr_port, username, password, status, created_at, updated_at
    FROM nvr_stations
    ORDER BY nvr_name
  `);
}

export async function fetchCameras(): Promise<Camera[]> {
  return query<Camera>(`
    SELECT id, camera_name, nvr_station_id, camera_channel, status, created_at, updated_at
    FROM cameras
    ORDER BY camera_name
  `);
}

export async function fetchNVRSnapshots(
  nvrName: string,
  startDate?: string,
  endDate?: string,
): Promise<NVRSnapshot[]> {
  try {
    let queryText = `
      SELECT id, camera_name, nvr_ip, nvr_name, snapshot_status, comment, image_url, recorded_at
      FROM nvr_snapshot_history
      WHERE nvr_name = $1
    `;

    const params: any[] = [nvrName];

    if (startDate && endDate) {
      queryText += ` AND recorded_at BETWEEN $2 AND $3`;
      params.push(startDate, endDate);
    }

    queryText += ` ORDER BY recorded_at DESC`;

    const snapshots = await query<NVRSnapshot>(queryText, params);
    return snapshots;
  } catch (error) {
    console.error("Failed to fetch NVR snapshots:", error);
    return [];
  }
}

export async function fetchSnapshotLogs(
  cameraId?: number,
  limit: number = 50,
): Promise<any[]> {
  let queryText = `
    SELECT sl.*, c.camera_name, ns.nvr_name 
    FROM snapshot_logs sl 
    JOIN cameras c ON sl.camera_id = c.id 
    JOIN nvr_stations ns ON c.nvr_station_id = ns.id
  `;

  const params: any[] = [];

  if (cameraId) {
    queryText += ` WHERE sl.camera_id = $1`;
    params.push(cameraId);
  }

  queryText += ` ORDER BY sl.created_at DESC LIMIT $${params.length + 1}`;
  params.push(limit);

  return query(queryText, params);
}

export async function fetchNVRStatusHistory(
  startDate?: string,
  endDate?: string,
  limit?: number,
): Promise<NVRStatusHistory[]> {
  try {
    let queryText = `
      SELECT 
        id,
        nvr_id,
        nvr_name,
        district,
        location,
        onu_ip,
        ping_onu,
        nvr_ip,
        ping_nvr,
        hdd_status,
        normal_view,
        check_login,
        camera_count,
        recorded_at
      FROM nvr_status_history
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (startDate) {
      queryText += ` AND recorded_at >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      queryText += ` AND recorded_at <= $${paramIndex++}`;
      params.push(endDate);
    }

    queryText += ` ORDER BY recorded_at DESC`;

    if (limit) {
      queryText += ` LIMIT $${paramIndex}`;
      params.push(limit);
    }

    return query<NVRStatusHistory>(queryText, params);
  } catch (error) {
    console.error("Error fetching NVR status history:", error);
    throw error;
  }
}

export async function fetchAllNVRHistory(): Promise<NVRStatusHistory[]> {
  try {
    // Query directly from nvr_status_history for actual history
    return query<NVRStatusHistory>(`
      SELECT 
        id,
        nvr_id,
        nvr_name,
        district,
        location,
        onu_ip,
        ping_onu,
        nvr_ip,
        ping_nvr,
        hdd_status,
        normal_view,
        check_login,
        camera_count,
        recorded_at
      FROM nvr_status_history
      ORDER BY recorded_at DESC
    `);
  } catch (error) {
    console.error("Failed to fetch all NVR history:", error);
    return [];
  }
}

export async function fetchAvailableDates(): Promise<string[]> {
  try {
    // Get unique dates from snapshot history
    const snapshots = await query<{ recorded_at: string }>(`
      SELECT DISTINCT recorded_at
      FROM nvr_snapshot_history
      WHERE recorded_at IS NOT NULL
      ORDER BY recorded_at DESC
      LIMIT 100
    `);

    const uniqueDates = [
      ...new Set(
        snapshots
          .filter((s) => s.recorded_at)
          .map((item) => item.recorded_at.split("T")[0]), // Extract date part
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

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await query("SELECT 1");
    return true;
  } catch (error) {
    console.error("Database connection test failed:", error);
    return false;
  }
}
