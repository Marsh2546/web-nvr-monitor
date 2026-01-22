import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.ts";
import {
  fetchGoogleSheetData,
  transformSheetDataToNVR,
} from "./google-sheets.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono().basePath("/server");

// Enable logger
app.use("*", logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// Get NVR data from Google Sheets
app.get("/nvr-status", async (c) => {
  try {
    // Get configuration from environment variables
    const spreadsheetId = Deno.env.get("GOOGLE_SHEET_ID");
    const apiKey = Deno.env.get("GOOGLE_SHEETS_API_KEY");

    if (!spreadsheetId || !apiKey) {
      console.error("Missing Google Sheets configuration");
      return c.json(
        {
          error:
            "Google Sheets configuration not found. Please set GOOGLE_SHEET_ID and GOOGLE_SHEETS_API_KEY.",
        },
        500,
      );
    }

    // Fetch data from Google Sheets
    // Default range assumes data starts from row 1 with headers
    const range = Deno.env.get("GOOGLE_SHEET_RANGE") || "Sheet1!A:L";

    console.log(
      `Fetching Google Sheets data from spreadsheet: ${spreadsheetId}, range: ${range}`,
    );

    const sheetData = await fetchGoogleSheetData({
      spreadsheetId,
      range,
      apiKey,
    });

    // Transform to application format
    const nvrData = transformSheetDataToNVR(sheetData);

    console.log(`Successfully fetched ${nvrData.length} NVR records`);

    return c.json({
      success: true,
      data: nvrData,
      count: nvrData.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in /nvr-status endpoint:", error);
    return c.json(
      {
        error: "Failed to fetch NVR status data",
        message: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});

// Cache endpoint - stores latest data in KV store
app.post("/nvr-status/cache", async (c) => {
  try {
    const spreadsheetId = Deno.env.get("GOOGLE_SHEET_ID");
    const apiKey = Deno.env.get("GOOGLE_SHEETS_API_KEY");

    if (!spreadsheetId || !apiKey) {
      return c.json(
        {
          error: "Google Sheets configuration not found",
        },
        500,
      );
    }

    const range = Deno.env.get("GOOGLE_SHEET_RANGE") || "Sheet1!A:L";

    const sheetData = await fetchGoogleSheetData({
      spreadsheetId,
      range,
      apiKey,
    });

    const nvrData = transformSheetDataToNVR(sheetData);

    // Store in KV cache
    await kv.set("nvr_data_cache", JSON.stringify(nvrData));
    await kv.set("nvr_data_cache_timestamp", new Date().toISOString());

    console.log(`Cached ${nvrData.length} NVR records`);

    return c.json({
      success: true,
      cached: nvrData.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error caching NVR data:", error);
    return c.json(
      {
        error: "Failed to cache data",
        message: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});

// Get cached data (faster, but may be stale)
app.get("/nvr-status/cached", async (c) => {
  try {
    const cachedData = await kv.get("nvr_data_cache");
    const cacheTimestamp = await kv.get("nvr_data_cache_timestamp");

    if (!cachedData) {
      return c.json(
        {
          error: "No cached data available. Please fetch fresh data first.",
        },
        404,
      );
    }

    const nvrData = JSON.parse(cachedData);

    return c.json({
      success: true,
      data: nvrData,
      count: nvrData.length,
      cachedAt: cacheTimestamp,
      note: "This is cached data. Use /nvr-status endpoint for fresh data.",
    });
  } catch (error) {
    console.error("Error retrieving cached data:", error);
    return c.json(
      {
        error: "Failed to retrieve cached data",
        message: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});

// Logging endpoint - fetches fresh data and stores in nvr_status_logs for historical analysis
app.post("/log-status", async (c) => {
  try {
    const spreadsheetId = Deno.env.get("GOOGLE_SHEET_ID");
    const apiKey = Deno.env.get("GOOGLE_SHEETS_API_KEY");

    if (!spreadsheetId || !apiKey) {
      return c.json({ error: "Google Sheets configuration not found" }, 500);
    }

    const range = Deno.env.get("GOOGLE_SHEET_RANGE") || "Sheet1!A:L";
    const sheetData = await fetchGoogleSheetData({
      spreadsheetId,
      range,
      apiKey,
    });
    const nvrData = transformSheetDataToNVR(sheetData);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // --- CHANGE DETECTION LOGIC ---
    // ดึงสถานะที่บันทึกล่าสุดจาก KV Store มาเปรียบเทียบ
    const lastStatusHash = await kv.get("last_nvr_status_hash");
    const currentStatusHash = JSON.stringify(nvrData); // ใช้ stringify โดยตรง (ไม่ต้องใช้ btoa เพื่อรองรับภาษาไทย)

    if (lastStatusHash === currentStatusHash) {
      console.log("No status changes detected. Skipping database log.");
      return c.json({
        success: true,
        logged: 0,
        message: "No changes detected",
        timestamp: new Date().toISOString(),
      });
    }

    // Prepare logs for insertion
    const logs = nvrData.map((nvr) => {
      return {
        nvr_id: nvr.nvr,
        nvr_name: nvr.nvr,
        location: nvr.location,
        district: nvr.district,
        onu_ip: nvr.onu_ip,
        ping_onu: nvr.ping_onu,
        nvr_ip: nvr.nvr_ip,
        ping_nvr: nvr.ping_nvr,
        hdd_status: nvr.hdd_status,
        normal_view: nvr.normal_view,
        check_login: nvr.check_login,
        camera_count: nvr.camera_count,
        recorded_at: new Date().toISOString(),
        source: "automation",
      };
    });

    // Insert logs in batches
    const { error } = await supabase.from("nvr_status_history").insert(logs);

    if (error) {
      console.error("Database insertion error:", error);
      throw new Error(`Failed to insert logs: ${error.message}`);
    }

    // อัปเดต Hash ล่าสุดเก็บไว้
    await kv.set("last_nvr_status_hash", currentStatusHash);

    console.log(
      `Successfully logged ${logs.length} NVR status snapshots due to detected changes`,
    );

    return c.json({
      success: true,
      logged: logs.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in /log-status endpoint:", error);
    return c.json(
      {
        error: "Failed to log NVR status",
        message: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});

Deno.serve(app.fetch);
