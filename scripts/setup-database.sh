#!/bin/bash

# Database setup script that runs inside the Docker container
echo "Setting up CCTV NVR PostgreSQL database..."

# Check if we're inside the container
if [ ! -f "/docker-entrypoint-initdb.d/01-create-tables.sql" ]; then
    echo "This script should be run inside the PostgreSQL container"
    echo "Use: docker-compose -f docker-compose.production.yml exec db /bin/bash -c \"\$(cat scripts/setup-database.sh)\""
    exit 1
fi

# Wait for database to be ready
echo "Waiting for database to be ready..."
until pg_isready -U postgres -d cctv_nvr; do
    echo "Database is not ready yet..."
    sleep 2
done

echo "✓ Database is ready"

# Check tables
echo ""
echo "Checking database tables..."

tables=("nvr_stations" "cameras" "nvr_snapshot_history" "snapshot_logs")

for table in "${tables[@]}"; do
    count=$(psql -U postgres -d cctv_nvr -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null | xargs)
    if [ $? -eq 0 ]; then
        echo "✓ Table $table: $count records"
    else
        echo "⚠ Table $table not found or inaccessible"
    fi
done

# Check sample data
echo ""
echo "Checking for sample data..."

stations_count=$(psql -U postgres -d cctv_nvr -t -c "SELECT COUNT(*) FROM nvr_stations;" 2>/dev/null | xargs)
if [ "$stations_count" -eq 0 ]; then
    echo "Adding sample NVR stations..."
    psql -U postgres -d cctv_nvr << 'EOF'
INSERT INTO nvr_stations (nvr_name, nvr_ip, nvr_port, username, password, status) VALUES
('NVR_Station_1', '192.168.1.100', 554, 'admin', 'password123', 'active'),
('NVR_Station_2', '192.168.1.101', 554, 'admin', 'password456', 'active'),
('NVR_Station_3', '192.168.1.102', 554, 'admin', 'password789', 'maintenance');
EOF
    echo "✓ Sample NVR stations added"
fi

cameras_count=$(psql -U postgres -d cctv_nvr -t -c "SELECT COUNT(*) FROM cameras;" 2>/dev/null | xargs)
if [ "$cameras_count" -eq 0 ]; then
    echo "Adding sample cameras..."
    psql -U postgres -d cctv_nvr << 'EOF'
INSERT INTO cameras (camera_name, nvr_station_id, camera_channel, status) VALUES
('Front Entrance', 1, 1, 'active'),
('Parking Lot A', 1, 2, 'active'),
('Main Hall', 1, 3, 'active'),
('Back Door', 2, 1, 'active'),
('Storage Room', 2, 2, 'inactive'),
('Reception', 3, 1, 'active');
EOF
    echo "✓ Sample cameras added"
fi

snapshots_count=$(psql -U postgres -d cctv_nvr -t -c "SELECT COUNT(*) FROM nvr_snapshot_history;" 2>/dev/null | xargs)
if [ "$snapshots_count" -eq 0 ]; then
    echo "Adding sample snapshot history..."
    psql -U postgres -d cctv_nvr << 'EOF'
INSERT INTO nvr_snapshot_history (camera_name, nvr_ip, nvr_name, snapshot_status, comment, image_url, recorded_at) VALUES
('Front Entrance', '192.168.1.100', 'NVR_Station_1', 'success', 'Snapshot captured successfully', 'http://example.com/snapshots/front_entrance_20240130_000000.jpg', '2024-01-30 00:00:00+00'),
('Parking Lot A', '192.168.1.100', 'NVR_Station_1', 'success', 'Snapshot captured successfully', 'http://example.com/snapshots/parking_a_20240130_000000.jpg', '2024-01-30 00:00:00+00'),
('Main Hall', '192.168.1.100', 'NVR_Station_1', 'failed', 'Connection timeout', null, '2024-01-30 00:05:00+00'),
('Back Door', '192.168.1.101', 'NVR_Station_2', 'success', 'Snapshot captured successfully', 'http://example.com/snapshots/back_door_20240130_000000.jpg', '2024-01-30 00:00:00+00'),
('Storage Room', '192.168.1.101', 'NVR_Station_2', 'failed', 'Camera offline', null, '2024-01-30 00:05:00+00');
EOF
    echo "✓ Sample snapshot history added"
fi

# Test functions
echo ""
echo "Testing database functions..."

if psql -U postgres -d cctv_nvr -c "SELECT log_snapshot_attempt();" >/dev/null 2>&1; then
    echo "✓ log_snapshot_attempt() function works"
else
    echo "⚠ log_snapshot_attempt() function test failed"
fi

# Display summary
echo ""
echo "📊 Database Summary:"
for table in "${tables[@]}"; do
    count=$(psql -U postgres -d cctv_nvr -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null | xargs)
    if [ $? -eq 0 ]; then
        echo "  $table: $count records"
    else
        echo "  $table: Error - table not found"
    fi
done

echo ""
echo "✅ Database setup completed successfully!"
echo ""
echo "คำสั่งถัดไป:"
echo "1. ทดสอบ API: curl http://localhost:3001/api/nvr-stations"
echo "2. เปิด frontend: http://localhost:8080"
echo "3. จัดการฐานข้อมูล: http://localhost:5050 (pgAdmin)"
