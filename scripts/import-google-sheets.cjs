#!/usr/bin/env node

/**
 * Google Sheets Import Script for CCTV NVR Monitor
 * This script imports NVR data from Google Sheets into PostgreSQL database
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Google Sheets API configuration
const GOOGLE_SHEETS_API_KEY = process.env.GOOGLE_SHEETS_API_KEY || 'AIzaSyDVzORyM9lgn2u_r5tYJd2gSd2FbO_Flbw';
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1QgB6wB2QSdxXuj1JbmjfM8qqN7hgQ-rKnpdVqdWc_28';
const SHEET_NAME = ['NVRData', 'Snapshot'] // หรือชื่อ sheet ที่ต้องการ

// PostgreSQL configuration
const PG_CONFIG = {
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5435,  // ใช้ port 5435 ตาม docker-compose
  database: process.env.PG_DATABASE || 'cctv_nvr',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'password',
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000
};

/**
 * ดึงข้อมูลจาก Google Sheets API สำหรับหลาย sheets
 */
async function fetchGoogleSheetsData() {
  try {
    console.log('กำลังดึงข้อมูลจาก Google Sheets...');
    
    const allData = {};
    
    // ดึงข้อมูลจากทุก sheet
    for (const sheetName of SHEET_NAME) {
      console.log(`กำลังดึงข้อมูลจาก sheet: ${sheetName}`);
      
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}?key=${GOOGLE_SHEETS_API_KEY}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`⚠️ ไม่สามารถดึงข้อมูลจาก sheet ${sheetName}: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      const rows = data.values || [];
      
      console.log(`พบข้อมูล ${rows.length} แถวจาก sheet ${sheetName}`);
      allData[sheetName] = rows;
    }
    
    return allData;
  } catch (error) {
    console.error('❌ ไม่สามารถดึงข้อมูลจาก Google Sheets:', error.message);
    return null;
  }
}

/**
 * แปลงข้อมูลจาก Google Sheets เป็นรูปแบบที่ตรงกับ tables ต่างๆ
 */
function parseDateTime(dateStr) {
  if (!dateStr) return new Date().toISOString();
  
  try {
    // ลอง parse หลาย format
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
    
    // ถ้าไม่สำเร็จ ลองแยกวันที่และเวลา
    const parts = dateStr.split(' ');
    if (parts.length >= 2) {
      const datePart = parts[0];
      const timePart = parts[1];
      
      // แปลง format ไทย (2/11/2026) → ISO
      const thaiDateParts = datePart.split('/');
      if (thaiDateParts.length === 3) {
        const day = thaiDateParts[0];
        const month = thaiDateParts[1];
        const year = thaiDateParts[2];
        const isoDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart || '00:00:00'}`;
        const isoDate = new Date(isoDateStr);
        if (!isNaN(isoDate.getTime())) {
          return isoDate.toISOString();
        }
      }
    }
    
    // fallback
    return new Date().toISOString();
  } catch (error) {
    console.warn('⚠️ ไม่สามารถ parse วันที่:', dateStr, error.message);
    return new Date().toISOString();
  }
}

function transformGoogleSheetsData(allData) {
  if (!allData) {
    return { nvrStatusHistory: [], snapshots: [] };
  }
  
  const result = {
    nvrStatusHistory: [],
    snapshots: []
  };
  
  // แปลงข้อมูลจาก NVRData sheet -> nvr_status_history table
  if (allData.NVRData && allData.NVRData.length > 1) {
    const nvrDataRows = allData.NVRData.slice(1); // ข้าม header และเอาทั้งหมด
    
    // Debug: แสดงข้อมูลแถวแรก
    console.log('🔍 Debug - NVRData header row:', allData.NVRData[0]);
    console.log('🔍 Debug - First data row:', allData.NVRData[1]);
    console.log('🔍 Debug - Row length:', allData.NVRData[1] ? allData.NVRData[1].length : 'N/A');
    
    // สมมติว่า header ของ NVRData: 26 columns total
    result.nvrStatusHistory = nvrDataRows.map((row, index) => ({
      id: index + 1,
      nvr_id: row[0] || `NVR_${index + 1}`,
      nvr_name: row[0] || `NVR_${index + 1}`,
      district: row[2] || 'Unknown', // เขต column (index 2)
      location: row[1] || 'Unknown', // ชื่อจุดติดตั้ง column (index 1)
      onu_ip: row[3] || '', // onu_ip column (index 3)
      ping_onu: row[4] === 'TRUE' || row[4] === 'true' || true, // ping_onu column (index 4)
      nvr_ip: row[5] || '', // nvr_ip column (index 5)
      ping_nvr: row[6] === 'TRUE' || row[6] === 'true' || true, // ping_nvr column (index 6)
      hdd_status: row[7] === 'TRUE' || row[7] === 'true' || true, // hdd_status column (index 7)
      normal_view: row[8] === 'TRUE' || row[8] === 'true' || true, // normal_view column (index 8)
      check_login: row[9] === 'TRUE' || row[9] === 'true' || true, // check_login column (index 9)
      camera_count: parseInt(row[10]) || 0, // จำนวนกล้อง column (index 10)
      recorded_at: row[11] ? parseDateTime(row[11]) : new Date().toISOString(), // date_updated column (index 11) - convert to ISO format
      source: 'google_sheets'
    }));
    
    console.log(`แปลงข้อมูล NVR status history ${result.nvrStatusHistory.length} รายการ`);
  }
  
  // แปลงข้อมูลจาก Snapshot sheet -> nvr_snapshot_history table
  if (allData.Snapshot && allData.Snapshot.length > 1) {
    const snapshotRows = allData.Snapshot.slice(1); // ข้าม header และเอาทั้งหมด
    
    // Debug: แสดงข้อมูลแถวแรก
    console.log('🔍 Debug - Snapshot header row:', allData.Snapshot[0]);
    console.log('🔍 Debug - First data row:', allData.Snapshot[1]);
    console.log('🔍 Debug - Row length:', allData.Snapshot[1] ? allData.Snapshot[1].length : 'N/A');
    
    // สมมติว่า header ของ Snapshot: ['camera_name', 'nvr_ip', 'nvr_name', 'snapshot', 'comment', 'image', 'pic_link', 'recorded_at']
    result.snapshots = snapshotRows.map((row, index) => ({
      id: index + 1,
      camera_name: row[0] || `Camera_${index + 1}`,
      nvr_ip: row[1] || '',
      nvr_name: row[2] || `NVR_${index + 1}`,
      snapshot_status: row[3] || 'failed', // 'snapshot' column
      comment: row[4] || 'Imported from Google Sheets',
      image_url: row[6] || null, // 'pic_link' column (index 6)
      recorded_at: row[7] || new Date().toISOString() // 'recorded_at' column (index 7)
    }));
    
    console.log(`แปลงข้อมูล snapshots ${result.snapshots.length} รายการ`);
  }
  
  return result;
}

/**
 * นำเข้าข้อมูลลง PostgreSQL database สำหรับทั้ง nvr_status_history และ nvr_snapshot_history
 */
async function importToDatabase(data) {
  const pgPool = new Pool(PG_CONFIG);
  
  try {
    console.log('กำลังเชื่อมต่อ PostgreSQL...');
    const client = await pgPool.connect();
    
    try {
      // เริ่ม transaction
      await client.query('BEGIN');
      
      // นำเข้าข้อมูล NVR status history
      if (data.nvrStatusHistory && data.nvrStatusHistory.length > 0) {
        console.log('กำลังนำเข้าข้อมูล NVR status history...');
        
        for (const status of data.nvrStatusHistory) {
          const query = `
            INSERT INTO nvr_status_history 
            (nvr_id, nvr_name, district, location, onu_ip, ping_onu, nvr_ip, ping_nvr, hdd_status, normal_view, check_login, camera_count, recorded_at, source) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          `;
          
          await client.query(query, [
            status.nvr_id,
            status.nvr_name,
            status.district,
            status.location,
            status.onu_ip,
            status.ping_onu,
            status.nvr_ip,
            status.ping_nvr,
            status.hdd_status,
            status.normal_view,
            status.check_login,
            status.camera_count,
            status.recorded_at,
            status.source
          ]);
        }
        
        console.log(`✅ นำเข้า NVR status history สำเร็จ ${data.nvrStatusHistory.length} รายการ`);
      }
      
      // นำเข้าข้อมูล snapshots
      if (data.snapshots && data.snapshots.length > 0) {
        console.log('กำลังนำเข้าข้อมูล snapshots...');
        
        for (const snapshot of data.snapshots) {
          const query = `
            INSERT INTO nvr_snapshot_history 
            (camera_name, nvr_ip, nvr_name, snapshot_status, comment, image_url, recorded_at) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `;
          
          await client.query(query, [
            snapshot.camera_name,
            snapshot.nvr_ip,
            snapshot.nvr_name,
            snapshot.snapshot_status,
            snapshot.comment,
            snapshot.image_url,
            snapshot.recorded_at
          ]);
        }
        
        console.log(`✅ นำเข้า snapshots สำเร็จ ${data.snapshots.length} รายการ`);
      }
      
      // Commit transaction
      await client.query('COMMIT');
      console.log(`✅ นำเข้าข้อมูลสำเร็จทั้งหมด!`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ ไม่สามารถนำเข้าข้อมูลลงฐานข้อมูล:', error.message);
    throw error;
  } finally {
    await pgPool.end();
  }
}

/**
 * ฟังก์ชันหลักสำหรับการนำเข้าข้อมูลจาก Google Sheets
 */
async function importFromGoogleSheets() {
  console.log('🚀 เริ่มการนำเข้าข้อมูลจาก Google Sheets...');
  console.log(`📊 Spreadsheet ID: ${SPREADSHEET_ID}`);
  console.log(`📋 Sheets: ${SHEET_NAME.join(', ')}`);
  
  try {
    // ดึงข้อมูลจาก Google Sheets
    const sheetsData = await fetchGoogleSheetsData();
    
    if (!sheetsData) {
      console.error('❌ ไม่สามารถดึงข้อมูลจาก Google Sheets ได้');
      process.exit(1);
    }
    
    // แปลงข้อมูล
    const transformedData = transformGoogleSheetsData(sheetsData);
    
    if (transformedData.nvrStatusHistory.length === 0 && transformedData.snapshots.length === 0) {
      console.log('⚠️ ไม่มีข้อมูลที่จะนำเข้า');
      return;
    }
    
    // นำเข้าลงฐานข้อมูล
    await importToDatabase(transformedData);
    
    console.log('✅ การนำเข้าข้อมูลจาก Google Sheets เสร็จสมบูณ์!');
    console.log(`📈 นำเข้า NVR status history ${transformedData.nvrStatusHistory.length} รายการ`);
    console.log(`📸 นำเข้า snapshots ${transformedData.snapshots.length} รายการ`);
    
  } catch (error) {
    console.error('❌ การนำเข้าข้อมูลล้มเหลว:', error.message);
    process.exit(1);
  }
}

/**
 * แสดงวิธีการใช้งาน
 */
function showUsage() {
  console.log(`
📋 Google Sheets Import Script for CCTV NVR Monitor

การใช้งาน:
  node scripts/import-google-sheets.cjs

Environment Variables ที่ต้องการ:
  - GOOGLE_SHEETS_API_KEY: Google Sheets API Key
  - SPREADSHEET_ID: ID ของ Google Spreadsheet
  - PG_HOST: PostgreSQL host (default: localhost)
  - PG_PORT: PostgreSQL port (default: 5432)
  - PG_DATABASE: Database name (default: cctv_nvr)
  - PG_USER: Database user (default: postgres)
  - PG_PASSWORD: Database password (default: password)

ตัวอย่างการตั้งค่า:
  export GOOGLE_SHEETS_API_KEY="your_api_key_here"
  export SPREADSHEET_ID="your_spreadsheet_id_here"
  node scripts/import-google-sheets.cjs

โครงสร้าง Google Sheets:

📊 Sheet "NVRData":
  - Column A: nvr_name
  - Column B: nvr_ip  
  - Column C: nvr_port
  - Column D: username
  - Column E: password
  - Column F: status (active/maintenance/inactive)
  - Column G: district
  - Column H: location

📸 Sheet "Snapshot":
  - Column A: camera_name
  - Column B: nvr_ip  
  - Column C: nvr_name
  - Column D: snapshot_status (success/failed)
  - Column E: comment
  - Column F: image_url
  - Column G: recorded_at (ISO format)

ตัวอย่างข้อมูลใน Google Sheets:
NVRData sheet:
| nvr_name      | nvr_ip        | nvr_port | username | password | status   | district | location    |
|---------------|---------------|----------|----------|-----------|----------|----------|-------------|
| NVR_Station_1 | 192.168.1.100 | 554      | admin     | password123 | active   | District1 | Location1   |

Snapshot sheet:
| camera_name   | nvr_ip        | nvr_name      | snapshot_status | comment                  | image_url | recorded_at              |
|---------------|---------------|---------------|----------------|--------------------------|-----------|-------------------------|
| Front Entrance | 192.168.1.100 | NVR_Station_1 | success         | Snapshot captured successfully | http://... | 2024-01-30T00:00:00Z |
`);
}

// รัน script ถ้าถูกเรียกโดยตรง
if (require.main === module) {
  // แสดง help ถ้ามี flag --help
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showUsage();
    process.exit(0);
  }
  
  importFromGoogleSheets().catch(console.error);
}

module.exports = { importFromGoogleSheets, fetchGoogleSheetsData, transformGoogleSheetsData };
