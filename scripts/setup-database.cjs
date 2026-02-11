#!/usr/bin/env node

/**
 * Data setup script for PostgreSQL database
 * This script initializes the database with sample data and validates the setup
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// PostgreSQL configuration - matching Docker setup
const PG_CONFIG = {
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || 'cctv_nvr',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'password',
  // Add connection timeout and retry
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000
};

// async function setupDatabase() {
//   console.log('Setting up CCTV NVR PostgreSQL database...');
  
//   const pgPool = new Pool(PG_CONFIG);
  
  // try {
  //   // Test connection
  //   console.log('Testing PostgreSQL connection...');
  //   const client = await pgPool.connect();
  //   try {
  //     await client.query('SELECT NOW()');
  //     console.log('✓ PostgreSQL connection successful');
  //   } finally {
  //     client.release();
  //   }

  //   // Check if tables exist and have data
  //   console.log('\nChecking database tables...');
    
  //   const tables = [
  //     'nvr_stations',
  //     'cameras', 
  //     'nvr_snapshot_history',
  //     'snapshot_logs'
  //   ];

  //   for (const table of tables) {
  //     try {
  //       const result = await pgPool.query(`SELECT COUNT(*) as count FROM ${table}`);
  //       console.log(`✓ Table ${table}: ${result.rows[0].count} records`);
  //     } catch (error) {
  //       console.log(`⚠ Table ${table} not found or inaccessible: ${error.message}`);
  //     }
  //   }

  //   // Add sample data if tables are empty
  //   console.log('\nChecking for sample data...');
    
  //   const stationsResult = await pgPool.query('SELECT COUNT(*) as count FROM nvr_stations');
  //   if (stationsResult.rows[0].count === 0) {
  //     console.log('Adding sample NVR stations...');
  //     await pgPool.query(`
  //       INSERT INTO nvr_stations (nvr_name, nvr_ip, nvr_port, username, password, status) VALUES
  //       ('NVR_Station_1', '192.168.1.100', 554, 'admin', 'password123', 'active'),
  //       ('NVR_Station_2', '192.168.1.101', 554, 'admin', 'password456', 'active'),
  //       ('NVR_Station_3', '192.168.1.102', 554, 'admin', 'password789', 'maintenance')
  //     `);
  //     console.log('✓ Sample NVR stations added');
  //   }

  //   const camerasResult = await pgPool.query('SELECT COUNT(*) as count FROM cameras');
  //   if (camerasResult.rows[0].count === 0) {
  //     console.log('Adding sample cameras...');
  //     await pgPool.query(`
  //       INSERT INTO cameras (camera_name, nvr_station_id, camera_channel, status) VALUES
  //       ('Front Entrance', 1, 1, 'active'),
  //       ('Parking Lot A', 1, 2, 'active'),
  //       ('Main Hall', 1, 3, 'active'),
  //       ('Back Door', 2, 1, 'active'),
  //       ('Storage Room', 2, 2, 'inactive'),
  //       ('Reception', 3, 1, 'active')
  //     `);
  //     console.log('✓ Sample cameras added');
  //   }

  //   const snapshotsResult = await pgPool.query('SELECT COUNT(*) as count FROM nvr_snapshot_history');
  //   if (snapshotsResult.rows[0].count === 0) {
  //     console.log('Adding sample snapshot history...');
  //     await pgPool.query(`
  //       INSERT INTO nvr_snapshot_history (camera_name, nvr_ip, nvr_name, snapshot_status, comment, image_url, recorded_at) VALUES
  //       ('Front Entrance', '192.168.1.100', 'NVR_Station_1', 'success', 'Snapshot captured successfully', 'http://example.com/snapshots/front_entrance_20240130_000000.jpg', '2024-01-30 00:00:00+00'),
  //       ('Parking Lot A', '192.168.1.100', 'NVR_Station_1', 'success', 'Snapshot captured successfully', 'http://example.com/snapshots/parking_a_20240130_000000.jpg', '2024-01-30 00:00:00+00'),
  //       ('Main Hall', '192.168.1.100', 'NVR_Station_1', 'failed', 'Connection timeout', null, '2024-01-30 00:05:00+00'),
  //       ('Back Door', '192.168.1.101', 'NVR_Station_2', 'success', 'Snapshot captured successfully', 'http://example.com/snapshots/back_door_20240130_000000.jpg', '2024-01-30 00:00:00+00'),
  //       ('Storage Room', '192.168.1.101', 'NVR_Station_2', 'failed', 'Camera offline', null, '2024-01-30 00:05:00+00')
  //     `);
  //     console.log('✓ Sample snapshot history added');
  //   }

  //   // Test database functions
  //   console.log('\nTesting database functions...');
    
  //   try {
  //     await pgPool.query('SELECT log_snapshot_attempt()');
  //     console.log('✓ log_snapshot_attempt() function works');
  //   } catch (error) {
  //     console.log('⚠ log_snapshot_attempt() function test failed:', error.message);
  //   }

//     // Display summary
//     console.log('\n📊 Database Summary:');
    
//     for (const table of tables) {
//       try {
//         const result = await pgPool.query(`SELECT COUNT(*) as count FROM ${table}`);
//         console.log(`  ${table}: ${result.rows[0].count} records`);
//       } catch (error) {
//         console.log(`  ${table}: Error - ${error.message}`);
//       }
//     }

//     console.log('\n✅ Database setup completed successfully!');
//     console.log('\nคำสั่งถัดไป:');
//     console.log('1. ทดสอบ API: curl http://localhost:3001/api/nvr-stations');
//     console.log('2. เปิด frontend: http://localhost:8080');
//     console.log('3. จัดการฐานข้อมูล: http://localhost:5050 (pgAdmin)');

//   } catch (error) {
//     console.error('❌ Database setup failed:', error);
    
//     if (error.code === 'ECONNREFUSED') {
//       console.error('   ไม่สามารถเชื่อมต่อ PostgreSQL ได้');
//       console.error('   กรุณาตรวจสอบว่า Docker container กำลังทำงาน');
//       console.error('   รัน: docker-compose -f docker-compose.production.yml up -d');
//     } else if (error.code === '3D000') {
//       console.error('   ฐานข้อมูลไม่มีอยู่');
//       console.error('   กรุณาตรวจสอบว่าฐานข้อมูลถูกสร้างแล้ว');
//     } else {
//       console.error('   ข้อผิดพลาด:', error.message);
//     }
    
//     process.exit(1);
//   } finally {
//     await pgPool.end();
//   }
// }

// Import data from CSV/JSON file (optional function)
async function importDataFromFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠ ไฟล์ ${filePath} ไม่พบ`);
    return;
  }

  const pgPool = new Pool(PG_CONFIG);
  
  try {
    console.log(`นำเข้าข้อมูลจาก ${filePath}...`);
    
    // ตรวจสอบนามสกุลไฟล์
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.json') {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      // ปรับตามโครงสร้างข้อมูลของคุณ
      console.log(`พบข้อมูล JSON ${data.length ? data.length : 0} รายการ`);
    } else if (ext === '.csv') {
      // สำหรับ CSV import
      console.log('พบไฟล์ CSV - ต้องการการปรับแต่งเพิ่มเติม');
    }
    
  } catch (error) {
    console.error('❌ การนำเข้าข้อมูลล้มเหลว:', error.message);
  } finally {
    await pgPool.end();
  }
}

// Import data from Google Sheets (main function for production)
async function importFromGoogleSheets() {
  console.log('🚀 เริ่มการนำเข้าข้อมูลจาก Google Sheets...');
  
  try {
    // ตรวจสอบว่ามีไฟล์ import-google-sheets.cjs หรือไม่
    const importScriptPath = path.join(__dirname, 'import-google-sheets.cjs');
    
    if (!fs.existsSync(importScriptPath)) {
      console.error('❌ ไม่พบไฟล์ import-google-sheets.cjs กรุณาตรวจสอบว่ามีไฟล์นี้');
      process.exit(1);
    }
    
    // รัน script นำเข้าข้อมูลจาก Google Sheets
    const { importFromGoogleSheets } = require('./import-google-sheets');
    await importFromGoogleSheets();
    
  } catch (error) {
    console.error('❌ การนำเข้าข้อมูลจาก Google Sheets ล้มเหลว:', error.message);
    process.exit(1);
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0 && args[0] === '--import') {
    const filePath = args[1];
    if (!filePath) {
      console.error('กรุณาระบุพาธ์ไฟล์: --import <file-path>');
      process.exit(1);
    }
    importDataFromFile(filePath);
  } else if (args.length > 0 && args[0] === '--google-sheets') {
    importFromGoogleSheets().catch(console.error);
  } else {
    setupDatabase().catch(console.error);
  }
}

module.exports = { setupDatabase, importDataFromFile };
