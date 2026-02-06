# คู่มือการตั้งค่า CCTV NVR Monitor กับ PostgreSQL

## ภาพรวม

แอปพลิเคชัน CCTV NVR Monitor ได้ถูกย้ายจาก Supabase ไปยัง PostgreSQL ที่โฮสต์เองพร้อม Docker แล้ว

## สถานะปัจจุบัน ✅

- **Frontend**: http://localhost:8080 (ทำงานแล้ว)
- **Backend API**: http://localhost:3001 (ทำงานแล้ว)
- **PostgreSQL**: localhost:5432 (ทำงานแล้ว)
- **pgAdmin**: http://localhost:5050 (ทำงานแล้ว)
- **Redis**: localhost:6379 (ทำงานแล้ว)

## ข้อมูลตัวอย่างในฐานข้อมูล

ฐานข้อมูลมีข้อมูลตัวอย่างพร้อมใช้งานแล้ว:

- **NVR Stations**: 3 สถานี
  - NVR_Station_1 (192.168.1.100) - active
  - NVR_Station_2 (192.168.1.101) - active  
  - NVR_Station_3 (192.168.1.102) - maintenance

- **Cameras**: 6 กล้อง
  - Front Entrance, Parking Lot A, Main Hall (NVR_Station_1)
  - Back Door, Storage Room (NVR_Station_2)
  - Reception (NVR_Station_3)

- **Snapshot History**: 5 รายการตัวอย่าง

## การเริ่มต้นระบบ

### 1. เริ่ม Docker Services

```bash
docker-compose -f docker-compose.production.yml up -d
```

### 2. ตรวจสอบสถานะ

```bash
docker-compose -f docker-compose.production.yml ps
```

### 3. ทดสอบการเชื่อมต่อ

```bash
# ทดสอบ Backend API
curl http://localhost:3001/health

# ทดสอบ NVR Stations
curl http://localhost:3001/api/nvr-stations

# ทดสอบ Frontend
curl http://localhost:8080
```

## API Endpoints หลัก

- `GET /health` - ตรวจสอบสถานะระบบ
- `GET /api/nvr-stations` - ดึงข้อมูลสถานี NVR
- `GET /api/cameras` - ดึงข้อมูลกล้อง
- `GET /api/snapshots` - ดึงประวัติ snapshot
- `GET /api/snapshot-logs` - ดึง logs รายละเอียด
- `POST /api/trigger-snapshots` - สั่ง snapshot ด้วยตนเอง
- `POST /api/log-snapshots` - บันทึกความพยายาม snapshot
- `POST /api/cleanup-logs` - ลบ logs เก่า

## การจัดการฐานข้อมูล

### ผ่าน pgAdmin

1. เปิด http://localhost:5050
2. เข้าสู่ระบบ:
   - Email: admin@cctv-nvr.com
   - Password: admin
3. เพิ่ม server:
   - Host: db
   - Port: 5432
   - Database: cctv_nvr
   - Username: postgres
   - Password: password

### ผ่าน Command Line

```bash
# เข้าถึงฐานข้อมูลใน container
docker-compose -f docker-compose.production.yml exec db psql -U postgres -d cctv_nvr

# ตรวจสอบตาราง
\dt

# ดูข้อมูล
SELECT * FROM nvr_stations;
SELECT * FROM cameras;
SELECT * FROM nvr_snapshot_history;
```

## การตั้งค่า Cron Jobs

สร้าง cron jobs สำหรับทำงานอัตโนมัติ:

```bash
chmod +x scripts/setup-cron.sh
./scripts/setup-cron.sh
```

Cron jobs ที่ติดตั้ง:
- ทุก 5 นาที: บันทึกความพยายาม snapshot
- ทุกวันเวลา 2 โมง: ลบ logs เก่า (30 วัน)
- ทุกชั่วโมง: ตรวจสอบสถานะระบบ

## การปรับแต่งคอนฟิกูเรชัน

### แก้ไข Environment Variables

สร้างไฟล์ `.env`:

```env
# Database Configuration
VITE_DB_HOST=localhost
VITE_DB_PORT=5432
VITE_DB_NAME=cctv_nvr
VITE_DB_USER=postgres
VITE_DB_PASSWORD=password
VITE_DB_SSL=false
```

### แก้ไข Docker Compose

แก้ไข `docker-compose.production.yml` สำหรับการตั้งค่า:
- รหัสผ่านฐานข้อมูล
- พอร์ต
- volumes
- environment variables

## การนำเข้าข้อมูลจากภายนอก

### จากไฟล์ JSON

```bash
node scripts/setup-database.cjs --import /path/to/data.json
```

### จากไฟล์ CSV

```bash
# ต้องการการปรับแต่งเพิ่มเติมสำหรับ CSV import
```

## การแก้ไขปัญหา

### ตรวจสอบ Logs

```bash
# ดู logs ทั้งหมด
docker-compose -f docker-compose.production.yml logs

# ดู logs ของแต่ละ service
docker-compose -f docker-compose.production.yml logs web
docker-compose -f docker-compose.production.yml logs backend
docker-compose -f docker-compose.production.yml logs db
```

### ปัญหาที่พบบ่อย

1. **Database connection failed**
   - ตรวจสอบว่า PostgreSQL container ทำงาน
   - ตรวจสอบคอนฟิกูเรชันฐานข้อมูล

2. **Backend not responding**
   - ตรวจสอบว่า backend container ทำงาน
   - ตรวจสอบ logs ของ backend

3. **Frontend not loading**
   - ตรวจสอบว่า web container ทำงาน
   - ตรวจสอบว่า port 8080 ไม่ถูกใช้โดยโปรแกรมอื่น

## การอัปเดต Frontend

เพื่อให้ frontend ทำงานกับ PostgreSQL:

1. อัปเดต `src/app/lib/database.ts` สำหรับการเชื่อมต่อฐานข้อมูล
2. แทนที่การเรียกใช้ Supabase ด้วย PostgreSQL service
3. อัปเดต API endpoints ให้ตรงกับ backend ใหม่

## โครงสร้างไฟล์สำคัญ

```
├── docker-compose.production.yml    # Docker configuration
├── src/backend/server.ts            # Express API server
├── src/app/lib/database.ts          # PostgreSQL client
├── src/app/services/postgresqlService.ts # Database service
├── database/init/                   # Database initialization
├── scripts/
│   ├── setup-database.cjs          # Database setup script
│   └── setup-cron.sh               # Cron job setup
└── README-POSTGRESQL.md             # English documentation
```

## การสำรองข้อมูล

### สำรองฐานข้อมูล

```bash
docker exec cctv-nvr-monitor-copy-db-1 pg_dump -U postgres cctv_nvr > backup.sql
```

### คืนข้อมูล

```bash
docker exec -i cctv-nvr-monitor-copy-db-1 psql -U postgres cctv_nvr < backup.sql
```

## การปรับปรุง

1. **ความปลอดภัย**: เปลี่ยนรหัสผ่านเริ่มต้น
2. **Performance**: เพิ่ม database indexes สำหรับ query ที่ใช้บ่อย
3. **Monitoring**: ตั้งค่า monitoring สำหรับ database performance
4. **Scaling**: เพิ่ม replicas สำหรับ high availability

---

## สรุป

ระบบ CCTV NVR Monitor พร้อมใช้งานแล้ว! ทุก services ทำงานบน Docker พร้อมข้อมูลตัวอย่าง คุณสามารถ:

1. เปิด http://localhost:8080 เพื่อใช้งาน frontend
2. เปิด http://localhost:5050 เพื่อจัดการฐานข้อมูล
3. ใช้ API endpoints สำหรับการพัฒนาเพิ่มเติม
4. ตั้งค่า cron jobs สำหรับการทำงานอัตโนมัติ
