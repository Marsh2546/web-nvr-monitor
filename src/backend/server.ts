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

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "cctv_nvr",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use("/snapshots", express.static(path.join(__dirname, "../../snapshots")));

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() as current_time");
    res.json({
      status: "healthy",
      timestamp: result.rows[0].current_time,
      database: "connected",
    });
  } catch (error: any) {
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
    });
  }
});

// Get all NVR stations
app.get("/api/nvr-stations", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM nvr_stations ORDER BY nvr_name",
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching NVR stations:", error);
    res.status(500).json({ error: "Failed to fetch NVR stations" });
  }
});

// Get all cameras
app.get("/api/cameras", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, ns.nvr_name 
      FROM cameras c 
      JOIN nvr_stations ns ON c.nvr_station_id = ns.id 
      ORDER BY ns.nvr_name, c.camera_channel
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching cameras:", error);
    res.status(500).json({ error: "Failed to fetch cameras" });
  }
});

// Get snapshot history
app.get("/api/snapshots", async (req, res) => {
  try {
    const { nvrName, startDate, endDate, limit = 50 } = req.query;

    let query = `
      SELECT 
        nsh.id,
        nsh.camera_name,
        nsh.nvr_ip,
        nsh.nvr_name,
        nsh.snapshot_status,
        nsh.comment,
        nsh.image_url,
        nsh.recorded_at,
        nsh.created_at
      FROM nvr_snapshot_history nsh
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (nvrName) {
      query += ` AND nsh.nvr_name = $${paramIndex++}`;
      params.push(nvrName);
    }

    if (startDate) {
      query += ` AND nsh.recorded_at >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND nsh.recorded_at <= $${paramIndex++}`;
      params.push(endDate);
    }

    query += ` ORDER BY nsh.recorded_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching snapshots:", error);
    res.status(500).json({ error: "Failed to fetch snapshots" });
  }
});

// Get snapshot logs
app.get("/api/snapshot-logs", async (req, res) => {
  try {
    const { cameraId, limit = 50 } = req.query;

    let query = `
      SELECT sl.*, c.camera_name, ns.nvr_name 
      FROM snapshot_logs sl 
      JOIN cameras c ON sl.camera_id = c.id 
      JOIN nvr_stations ns ON c.nvr_station_id = ns.id
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (cameraId) {
      query += ` WHERE sl.camera_id = $${paramIndex++}`;
      params.push(cameraId);
    }

    query += ` ORDER BY sl.created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    res.json(result.rows);
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
