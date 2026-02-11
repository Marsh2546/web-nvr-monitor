import express from "express";
import { Pool } from "pg";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

import {
  pool,
  fetchNVRStations,
  fetchCameras,
  fetchNVRSnapshots,
  fetchSnapshotLogs,
  fetchNVRStatusHistory,
  fetchAllNVRHistory,
  query,
  testDatabaseConnection,
} from "./databaseService.js";

// Middleware
app.use(cors());
app.use(express.json());
app.use("/snapshots", express.static(path.join(__dirname, "../../snapshots")));

// Health check endpoint
app.get("/health", async (req, res) => {
  const isHealthy = await testDatabaseConnection();
  if (isHealthy) {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } else {
    res.status(500).json({
      status: "unhealthy",
      database: "disconnected",
    });
  }
});

// Get all NVR stations
app.get("/api/nvr-status-history", async (req, res) => {
  try {
    const history = await fetchAllNVRHistory();
    res.json(history);
  } catch (error) {
    console.error("Error fetching NVR status history:", error);
    res.status(500).json({ error: "Failed to fetch NVR status history" });
  }
});

// Get NVR status (for compatibility with nvrService.ts)
app.get("/api/nvr-status", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const history = await fetchNVRStatusHistory(
      startDate as string,
      endDate as string,
    );

    // Transform to match legacy format if needed by nvrService.ts
    const transformedData = history.map((item) => ({
      id: item.nvr_id?.toString() || "", // Ensure id is string
      nvr: item.nvr_name,
      district: item.district,
      location: item.location,
      onu_ip: item.onu_ip,
      ping_onu: item.ping_onu,
      nvr_ip: item.nvr_ip,
      ping_nvr: item.ping_nvr,
      hdd_status: item.hdd_status,
      normal_view: item.normal_view,
      check_login: item.check_login,
      camera_count: item.camera_count || 0,
      recorded_at: item.recorded_at,
    }));

    res.json({
      success: true,
      data: transformedData,
      count: transformedData.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching NVR status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch NVR status",
    });
  }
});

// Get all cameras
app.get("/api/cameras", async (req, res) => {
  try {
    const cameras = await fetchCameras();
    res.json(cameras);
  } catch (error) {
    console.error("Error fetching cameras:", error);
    res.status(500).json({ error: "Failed to fetch cameras" });
  }
});

// Get NVR status history OR snapshots
app.get("/api/snapshots", async (req, res) => {
  try {
    const { nvrName, startDate, endDate, limit } = req.query;

    if (nvrName) {
      console.log(`Fetching snapshots for NVR: ${nvrName}`);
      const snapshots = await fetchNVRSnapshots(
        nvrName as string,
        startDate as string,
        endDate as string,
      );
      if (limit) {
        res.json(snapshots.slice(0, Number(limit)));
      } else {
        res.json(snapshots);
      }
    } else {
      console.log(`Fetching global NVR status history`);
      const history = await fetchNVRStatusHistory(
        startDate as string,
        endDate as string,
        limit ? Number(limit) : undefined,
      );
      res.json(history);
    }
  } catch (error) {
    console.error("Error fetching NVR data:", error);
    res.status(500).json({ error: "Failed to fetch NVR data" });
  }
});

// Get snapshot logs
app.get("/api/snapshot-logs", async (req, res) => {
  try {
    const { cameraId, limit = 50 } = req.query;
    const logs = await fetchSnapshotLogs(
      cameraId ? Number(cameraId) : undefined,
      Number(limit),
    );
    res.json(logs);
  } catch (error) {
    console.error("Error fetching snapshot logs:", error);
    res.status(500).json({ error: "Failed to fetch snapshot logs" });
  }
});

// Manual snapshot trigger endpoint
app.post("/api/trigger-snapshots", async (req, res) => {
  try {
    const { cameraIds } = req.body;

    // Get cameras to snapshot
    let query = `
      SELECT c.id, c.camera_name, c.camera_channel, ns.nvr_ip, ns.nvr_port, ns.username, ns.password
      FROM cameras c
      JOIN nvr_stations ns ON c.nvr_station_id = ns.id
      WHERE c.status = 'active' AND ns.status = 'active'
    `;
    const params: any[] = [];

    if (cameraIds && cameraIds.length > 0) {
      query += ` AND c.id = ANY($1)`;
      params.push(cameraIds);
    }

    const result = await pool.query(query, params);
    const cameras = result.rows;

    // Log snapshot attempts
    for (const camera of cameras) {
      await pool.query(
        "INSERT INTO snapshot_logs (camera_id, snapshot_status, snapshot_time) VALUES ($1, $2, $3)",
        [camera.id, "triggered", new Date()],
      );

      // Here you would add actual snapshot capture logic
      // For now, we'll just simulate it
      console.log(
        `Triggering snapshot for camera: ${camera.camera_name} (${camera.nvr_ip}:${camera.nvr_port})`,
      );
    }

    res.json({
      message: `Triggered snapshots for ${cameras.length} cameras`,
      cameras: cameras.map((c) => ({ id: c.id, name: c.camera_name })),
    });
  } catch (error) {
    console.error("Error triggering snapshots:", error);
    res.status(500).json({ error: "Failed to trigger snapshots" });
  }
});

// Log snapshots endpoint (for cron job or external calls)
app.post("/api/log-snapshots", async (req, res) => {
  try {
    // This endpoint mimics the Supabase function for compatibility
    const result = await pool.query(`
      SELECT 
        c.id as camera_id,
        c.camera_name,
        ns.nvr_ip,
        ns.nvr_name
      FROM cameras c
      JOIN nvr_stations ns ON c.nvr_station_id = ns.id
      WHERE c.status = 'active' AND ns.status = 'active'
    `);

    for (const camera of result.rows) {
      await pool.query(
        "INSERT INTO snapshot_logs (camera_id, snapshot_status, snapshot_time) VALUES ($1, $2, $3)",
        [camera.camera_id, "scheduled", new Date()],
      );
    }

    res.json({
      message: `Logged ${result.rows.length} cameras for snapshot processing`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error logging snapshots:", error);
    res.status(500).json({ error: "Failed to log snapshots" });
  }
});

// Cleanup old logs endpoint (for cron job)
app.post("/api/cleanup-logs", async (req, res) => {
  try {
    const result = await pool.query(`
      DELETE FROM snapshot_logs 
      WHERE created_at < NOW() - INTERVAL '30 days'
    `);

    console.log(`Cleaned up ${result.rowCount} old log entries`);

    res.json({
      message: `Cleaned up ${result.rowCount} old log entries`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error cleaning up logs:", error);
    res.status(500).json({ error: "Failed to cleanup logs" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`CCTV NVR Backend server running on port ${port}`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Received SIGTERM, shutting down gracefully");
  await pool.end();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Received SIGINT, shutting down gracefully");
  await pool.end();
  process.exit(0);
});
