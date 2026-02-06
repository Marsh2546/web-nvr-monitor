#!/usr/bin/env node

/**
 * Data setup script for PostgreSQL database
 * This script initializes the database with sample data and validates the setup
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// PostgreSQL configuration
const PG_CONFIG = {
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || 'cctv_nvr',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'password'
};

async function setupDatabase() {
  console.log('Setting up CCTV NVR PostgreSQL database...');
  
  const pgPool = new Pool(PG_CONFIG);
  
  try {
    // Test connection
    console.log('Testing PostgreSQL connection...');
    const client = await pgPool.connect();
    try {
      await client.query('SELECT NOW()');
      console.log('✓ PostgreSQL connection successful');
    } finally {
      client.release();
    }

    // Check if tables exist and have data
    console.log('\nChecking database tables...');
    
    const tables = [
      'nvr_stations',
      'cameras', 
      'nvr_snapshot_history',
      'snapshot_logs'
    ];

    for (const table of tables) {
      try {
        const result = await pgPool.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`✓ Table ${table}: ${result.rows[0].count} records`);
      } catch (error) {
        console.log(`⚠ Table ${table} not found or inaccessible: ${error.message}`);
      }
    }

    // Add sample data if tables are empty
    console.log('\nChecking for sample data...');
    
    const stationsResult = await pgPool.query('SELECT COUNT(*) as count FROM nvr_stations');
    if (stationsResult.rows[0].count === 0) {
      console.log('Adding sample NVR stations...');
      await pgPool.query(`
        INSERT INTO nvr_stations (nvr_name, nvr_ip, nvr_port, username, password, status) VALUES
        ('NVR_Station_1', '192.168.1.100', 554, 'admin', 'password123', 'active'),
        ('NVR_Station_2', '192.168.1.101', 554, 'admin', 'password456', 'active'),
        ('NVR_Station_3', '192.168.1.102', 554, 'admin', 'password789', 'maintenance')
      `);
      console.log('✓ Sample NVR stations added');
    }

    const camerasResult = await pgPool.query('SELECT COUNT(*) as count FROM cameras');
    if (camerasResult.rows[0].count === 0) {
      console.log('Adding sample cameras...');
      await pgPool.query(`
        INSERT INTO cameras (camera_name, nvr_station_id, camera_channel, status) VALUES
        ('Front Entrance', 1, 1, 'active'),
        ('Parking Lot A', 1, 2, 'active'),
        ('Main Hall', 1, 3, 'active'),
        ('Back Door', 2, 1, 'active'),
        ('Storage Room', 2, 2, 'inactive'),
        ('Reception', 3, 1, 'active')
      `);
      console.log('✓ Sample cameras added');
    }

    const snapshotsResult = await pgPool.query('SELECT COUNT(*) as count FROM nvr_snapshot_history');
    if (snapshotsResult.rows[0].count === 0) {
      console.log('Adding sample snapshot history...');
      await pgPool.query(`
        INSERT INTO nvr_snapshot_history (camera_name, nvr_ip, nvr_name, snapshot_status, comment, image_url, recorded_at) VALUES
        ('Front Entrance', '192.168.1.100', 'NVR_Station_1', 'success', 'Snapshot captured successfully', 'http://example.com/snapshots/front_entrance_20240130_000000.jpg', '2024-01-30 00:00:00+00'),
        ('Parking Lot A', '192.168.1.100', 'NVR_Station_1', 'success', 'Snapshot captured successfully', 'http://example.com/snapshots/parking_a_20240130_000000.jpg', '2024-01-30 00:00:00+00'),
        ('Main Hall', '192.168.1.100', 'NVR_Station_1', 'failed', 'Connection timeout', null, '2024-01-30 00:05:00+00'),
        ('Back Door', '192.168.1.101', 'NVR_Station_2', 'success', 'Snapshot captured successfully', 'http://example.com/snapshots/back_door_20240130_000000.jpg', '2024-01-30 00:00:00+00'),
        ('Storage Room', '192.168.1.101', 'NVR_Station_2', 'failed', 'Camera offline', null, '2024-01-30 00:05:00+00')
      `);
      console.log('✓ Sample snapshot history added');
    }

    // Test database functions
    console.log('\nTesting database functions...');
    
    try {
      await pgPool.query('SELECT log_snapshot_attempt()');
      console.log('✓ log_snapshot_attempt() function works');
    } catch (error) {
      console.log('⚠ log_snapshot_attempt() function test failed:', error.message);
    }

    // Display summary
    console.log('\n📊 Database Summary:');
    
    for (const table of tables) {
      try {
        const result = await pgPool.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`  ${table}: ${result.rows[0].count} records`);
      } catch (error) {
        console.log(`  ${table}: Error - ${error.message}`);
      }
    }

    console.log('\n✅ Database setup completed successfully!');
    console.log('\nคำสั่งถัดไป:');
    console.log('1. ทดสอบ API: curl http://localhost:3001/api/nvr-stations');
    console.log('2. เปิด frontend: http://localhost:8080');
    console.log('3. จัดการฐานข้อมูล: http://localhost:5050 (pgAdmin)');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('   ไม่สามารถเชื่อมต่อ PostgreSQL ได้');
      console.error('   กรุณาตรวจสอบว่า Docker container กำลังทำงาน');
      console.error('   รัน: docker-compose -f docker-compose.production.yml up -d');
    } else if (error.code === '3D000') {
      console.error('   ฐานข้อมูลไม่มีอยู่');
      console.error('   กรุณาตรวจสอบว่าฐานข้อมูลถูกสร้างแล้ว');
    } else {
      console.error('   ข้อผิดพลาด:', error.message);
    }
    
    process.exit(1);
  } finally {
    await pgPool.end();
  }
}

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
  } else {
    setupDatabase().catch(console.error);
  }
}

module.exports = { setupDatabase, importDataFromFile };
    await pgPool.query('SELECT NOW()');
    console.log('✓ PostgreSQL connection successful');

    // Migrate nvr_snapshot_history
    console.log('\nMigrating nvr_snapshot_history...');
    const { data: snapshots, error: snapshotsError } = await supabase
      .from('nvr_snapshot_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (snapshotsError) throw snapshotsError;
    
    console.log(`Found ${snapshots.length} snapshot records to migrate`);

    // Clear existing data in PostgreSQL
    await pgPool.query('DELETE FROM nvr_snapshot_history');
    console.log('Cleared existing snapshot data');

    // Insert data in batches
    const batchSize = 100;
    for (let i = 0; i < snapshots.length; i += batchSize) {
      const batch = snapshots.slice(i, i + batchSize);
      
      const insertQuery = `
        INSERT INTO nvr_snapshot_history (
          camera_name, nvr_ip, nvr_name, snapshot_status, 
          comment, image_url, recorded_at, created_at
        ) VALUES ${batch.map((_, index) => 
          `($${index * 8 + 1}, $${index * 8 + 2}, $${index * 8 + 3}, $${index * 8 + 4}, $${index * 8 + 5}, $${index * 8 + 6}, $${index * 8 + 7}, $${index * 8 + 8})`
        ).join(', ')}`;
      
      const values = batch.flatMap(snapshot => [
        snapshot.camera_name,
        snapshot.nvr_ip,
        snapshot.nvr_name,
        snapshot.snapshot_status,
        snapshot.comment,
        snapshot.image_url,
        snapshot.recorded_at,
        snapshot.created_at
      ]);

      await pgPool.query(insertQuery, values);
      console.log(`Migrated batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(snapshots.length / batchSize)}`);
    }

    console.log('✓ nvr_snapshot_history migration completed');

    // Check if nvr_status_history exists in Supabase and migrate if needed
    try {
      console.log('\nChecking for nvr_status_history...');
      const { data: statusHistory, error: statusError } = await supabase
        .from('nvr_status_history')
        .select('*')
        .limit(1);

      if (!statusError) {
        console.log('Found nvr_status_history table, creating equivalent data...');
        
        // Get all status history
        const { data: allStatusHistory } = await supabase
          .from('nvr_status_history')
          .select('*')
          .order('recorded_at', { ascending: false });

        console.log(`Found ${allStatusHistory.length} status history records`);

        // Create NVR stations from unique NVR data
        const uniqueNVRs = [...new Map(allStatusHistory.map(item => [item.nvr_id, item])).values()];
        
        for (const nvr of uniqueNVRs) {
          await pgPool.query(`
            INSERT INTO nvr_stations (nvr_name, nvr_ip, nvr_port, username, password, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (nvr_name) DO NOTHING
          `, [
            nvr.nvr_name,
            nvr.nvr_ip,
            554,
            'admin',
            'password',
            'active'
          ]);
        }

        console.log('✓ NVR stations created from status history');
      }
    } catch (err) {
      console.log('nvr_status_history table not found or not accessible, skipping...');
    }

    // Verify migration
    console.log('\nVerifying migration...');
    const { rows: pgCount } = await pgPool.query('SELECT COUNT(*) as count FROM nvr_snapshot_history');
    console.log(`PostgreSQL records: ${pgCount[0].count}`);
    console.log(`Supabase records: ${snapshots.length}`);

    if (pgCount[0].count === snapshots.length) {
      console.log('✓ Migration verification successful');
    } else {
      console.log('⚠ Migration count mismatch - please verify data');
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pgPool.end();
  }

  console.log('\nMigration completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Update your frontend to use the new PostgreSQL service');
  console.log('2. Test the application with the migrated data');
  console.log('3. Set up cron jobs for automated snapshot collection');
  console.log('4. Update any external integrations to use the new API endpoints');
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateData().catch(console.error);
}

module.exports = { migrateData };
