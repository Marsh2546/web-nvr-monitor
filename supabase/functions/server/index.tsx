import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { fetchGoogleSheetData, transformSheetDataToNVR } from "./google-sheets.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

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
app.get("/make-server-8a981ca6/health", (c) => {
  return c.json({ status: "ok" });
});

// Get NVR data from Google Sheets
app.get("/make-server-8a981ca6/nvr-status", async (c) => {
  try {
    // Get configuration from environment variables
    const spreadsheetId = Deno.env.get("GOOGLE_SHEET_ID");
    const apiKey = Deno.env.get("GOOGLE_SHEETS_API_KEY");
    
    if (!spreadsheetId || !apiKey) {
      console.error('Missing Google Sheets configuration');
      return c.json({ 
        error: "Google Sheets configuration not found. Please set GOOGLE_SHEET_ID and GOOGLE_SHEETS_API_KEY." 
      }, 500);
    }
    
    // Fetch data from Google Sheets
    // Default range assumes data starts from row 1 with headers
    const range = Deno.env.get("GOOGLE_SHEET_RANGE") || "Sheet1!A:L";
    
    console.log(`Fetching Google Sheets data from spreadsheet: ${spreadsheetId}, range: ${range}`);
    
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
    console.error('Error in /nvr-status endpoint:', error);
    return c.json({ 
      error: "Failed to fetch NVR status data",
      message: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Cache endpoint - stores latest data in KV store
app.post("/make-server-8a981ca6/nvr-status/cache", async (c) => {
  try {
    const spreadsheetId = Deno.env.get("GOOGLE_SHEET_ID");
    const apiKey = Deno.env.get("GOOGLE_SHEETS_API_KEY");
    
    if (!spreadsheetId || !apiKey) {
      return c.json({ 
        error: "Google Sheets configuration not found" 
      }, 500);
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
    console.error('Error caching NVR data:', error);
    return c.json({ 
      error: "Failed to cache data",
      message: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Get cached data (faster, but may be stale)
app.get("/make-server-8a981ca6/nvr-status/cached", async (c) => {
  try {
    const cachedData = await kv.get("nvr_data_cache");
    const cacheTimestamp = await kv.get("nvr_data_cache_timestamp");
    
    if (!cachedData) {
      return c.json({ 
        error: "No cached data available. Please fetch fresh data first." 
      }, 404);
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
    console.error('Error retrieving cached data:', error);
    return c.json({ 
      error: "Failed to retrieve cached data",
      message: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

Deno.serve(app.fetch);