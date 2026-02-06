-- Insert sample NVR stations
insert into nvr_stations (nvr_name, nvr_ip, nvr_port, username, password, status) values
('NVR_Station_1', '192.168.1.100', 554, 'admin', 'password123', 'active'),
('NVR_Station_2', '192.168.1.101', 554, 'admin', 'password456', 'active'),
('NVR_Station_3', '192.168.1.102', 554, 'admin', 'password789', 'maintenance')
on conflict (nvr_name) do nothing;

-- Insert sample cameras
insert into cameras (camera_name, nvr_station_id, camera_channel, status) values
('Front Entrance', 1, 1, 'active'),
('Parking Lot A', 1, 2, 'active'),
('Main Hall', 1, 3, 'active'),
('Back Door', 2, 1, 'active'),
('Storage Room', 2, 2, 'inactive'),
('Reception', 3, 1, 'active')
on conflict (nvr_station_id, camera_channel) do nothing;

-- Insert some sample snapshot history data
insert into nvr_snapshot_history (camera_name, nvr_ip, nvr_name, snapshot_status, comment, image_url, recorded_at) values
('Front Entrance', '192.168.1.100', 'NVR_Station_1', 'success', 'Snapshot captured successfully', 'http://example.com/snapshots/front_entrance_20240130_000000.jpg', '2024-01-30 00:00:00+00'),
('Parking Lot A', '192.168.1.100', 'NVR_Station_1', 'success', 'Snapshot captured successfully', 'http://example.com/snapshots/parking_a_20240130_000000.jpg', '2024-01-30 00:00:00+00'),
('Main Hall', '192.168.1.100', 'NVR_Station_1', 'failed', 'Connection timeout', null, '2024-01-30 00:05:00+00'),
('Back Door', '192.168.1.101', 'NVR_Station_2', 'success', 'Snapshot captured successfully', 'http://example.com/snapshots/back_door_20240130_000000.jpg', '2024-01-30 00:00:00+00'),
('Storage Room', '192.168.1.101', 'NVR_Station_2', 'failed', 'Camera offline', null, '2024-01-30 00:05:00+00')
on conflict do nothing;
