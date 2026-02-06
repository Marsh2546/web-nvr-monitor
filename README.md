# CCTV Repair Notification Website

This is a code bundle for CCTV Repair Notification Website. The original project is available at https://cctv-monitering-system.netlify.app/

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

# --To do list--

- [x] เอาเว็บขึ้น docker
- [x] ออกแบบฐ้านข้อมูลจัดเก็บข้อมูล time series
- [x] แก้ไข Pie chart ให้ขอบมน
- [x] Map ข้อมูลให้ดึงข้อมูลได้เร็วขึ้น
- [x] NVRStatusPage เพิ่มการแสดงข้อมูลย้อนหลัง
- [x] แก้ไขการเพิ่ม sort by ข้อมูล
- [x] แก้ไขเงื่อนของปํญหา Critical
- [x] fix time zone filter DB
- [x] Dashboard เพิ่มการแสดงดูข้อมูลย้อนหลัง

## command เร่งด่วน 🔥🔥🔥

- [x] แก้ไข BarChart Color

- [x] ปรับ **Pie Chart**
  - แสดง label ชัดเจน
  - ปรับสีให้แยกสถานะได้ง่าย

- [x] ปรับ **Bar Chart**
  - เพิ่มคำอธิบายสถานะสี
    - 🟢 **Online** — ใช้งานได้ปกติ
    - 🟡 **No Access** — Login / View
    - 🔴 **Down** — ONU / NVR / HDD

### 🎛️ Filter

- [x] เพิ่มปุ่ม **Filter**
  - [x] ดูปัญหาแยกตาม **ประเภทอุปกรณ์** (NVR / ONU / HDD / Camera)
  - [x] ดูปัญหาแยกตาม **เขตพื้นที่**


### Logic & Status
- [x] ปรับเงื่อนไข **Critical**
- ONU Down -> ⛔ NVR → HDD → Camera → Login
- NVR Down -> ⛔ HDD → Camera → Login
- HDD ->
  - ถ้า NVR Online and ONU Online -> HDD ให้เช็ค status ตัวเอง
  - status ไม่เกี่ยวกับ view / login ให้เช็คตามเงื่อนไขของมันเอง
  - ถ้า HDD Online -> HDD true
  - ถ้า HDD Offline -> HDD false
- login
  - ถ้า nvr online -> login true
  - ถ้า nvr offline -> ก็ทำงานตาม logic ปกติ NVR Down -> ⛔ HDD → Camera → Login
- normal_view
  - ถ้า normal_view false & snapshot มีภาพ -> normal_view true
  - ถ้า normal_view false & snapshot ไม่มีภาพ -> normal_view false

## New NVRStatus Condition
- [x] Add NVRStatus Condition
- ONU_STATUS
  - if ONU_STATUS == offline:
    NVR = false
    HDD = false
    CAMERA = false
    LOGIN = false
    NORMAL_VIEW = false
    END
- NVR_STATUS
  - if NVR_STATUS == offline:
    HDD = false
    CAMERA = false
    LOGIN = false
    NORMAL_VIEW = false
    END
- HDD_STATUS
  - if ONU_STATUS == online AND NVR_STATUS == online:
    if HDD_STATUS == online:
    HDD = true
    else:
    HDD = false
    else:
    HDD = false
- LOGIN_STATUS
  - if NVR_STATUS == online:
    LOGIN = true
    else:
    LOGIN = false
- NORMAL_VIEW_STATUS
  - if NORMAL_VIEW == false:
    if SNAPSHOT_EXISTS == true:
    NORMAL_VIEW = true
    else:
    NORMAL_VIEW = false

## ดึงรูปภาพ Sheet -> Snapshot

- [x] **สร้างฐานข้อมูลรูปภาพ**
- [x] ดึงรูปภาพจาก Google Sheet เก็บ supabase
- [x] NVRStatusPage > แสดงรูป
  - [x] ปรับการแสดงรูป
  - [x] กดเข้าไปดูรูปใหญ่ได้
  - [x] แก้ไขแสดงรูปตามวันที่
  - [x] แก้cronการเก็บฐานข้อมูล
- [x] แสดงภาพกล้องในรายละเอียดหน้า NVR Status

- [ ] เพิ่ม Ai Detection image
- [ ] ให้แจ้งเตือน detect ที่ Image Integrity ACTIVE CHANNEL VIEWING

## 📤 Export

- [ ] เพิ่มฟังก์ชัน Export
  - [ ] รองรับการ Export ข้อมูลอุปกรณ์ที่มีสถานะผิดปกติ
  - [ ] สามารถ Export ข้อมูลตามเงื่อนไข Filter ที่ผู้ใช้เลือกได้
  - [ ] ข้อมูลที่ Export จะแสดงในรูปแบบรายการ (List)
  - [ ] ข้อมูลที่ Export 3 Day | 7 Day

### 🔔 Alert & Notification

- [ ] เพิ่มfunction การแจ้งเตือนรายไป Email

---

# จัดการไฟล์ไม่ได้ใช้

- [ ] Dashbaoard.tsx
- [ ] Navigation.tsx
- [ ] StateCard.tsx
- [ ] StatusTracking.tsx
- [ ] AdminPage.tsx
- [ ] RepairList.tsx
- [ ] RepairStatusPage.tsx
- [ ] lib/Storeage.tsx
- [ ] types/repair.tsx
- [ ] app/types/repair.tsx
- [ ] app/data/mockData.tsx


## Setup to server 
เปลี่ยนจาก supabase เป็น postgreSQL
ทำ service Api 
แยกการทำ font end | back end
install postgreSql , DBerver

เอาโค้ดไปฝากไว้ที่ git lab

### Workflow
I'll analyze the entire workflow of this CCTV Repair Notification Website by examining the key files and components. Let me start by understanding the overall architecture.


# การทำงาน Workflow ทั้งหมดของเว็บไซต์ CCTV Repair Notification

## ภาพรวมระบบ (System Overview)

เว็บไซต์นี้เป็นระบบ **Monitoring & Notification** สำหรับเครือข่ายกล้อง CCTV ที่ติดตั้งในพื้นที่กรุงเทพมหานคร โดยมีวัตถุประสงค์เพื่อติดตามสถานะของอุปกรณ์ NVR (Network Video Recorder) และแจ้งเตือนเมื่อมีปัญหา

---

## 1. สถาปัตยกรรมระบบ (Architecture)

### Frontend (React + TypeScript)
- **Framework**: React 18.3.1 กับ Vite
- **UI Library**: Radix UI + Tailwind CSS
- **Charts**: Recharts
- **State Management**: React Hooks (useState, useEffect, useMemo)

### Backend (Supabase Edge Functions)
- **Runtime**: Deno
- **Framework**: Hono
- **Database**: Supabase (PostgreSQL)
- **External API**: Google Sheets API

### Data Source
- **Primary**: Google Sheets (ข้อมูลสถานะ NVR)
- **Cache**: Supabase KV Store

---

## 2. การไหลของข้อมูล (Data Flow)

```
Google Sheets → Supabase API → Frontend → UI Components
     ↓              ↓              ↓
  Raw Data    Processed Data   Visual Analytics
```

### ขั้นตอนการทำงาน:

#### 2.1 Data Collection (Backend)
1. **Google Sheets API** ดึงข้อมูล NVR จาก Google Sheets
2. **Data Transformation** แปลงข้อมูลจาก format ของ Sheets เป็น NVRStatus interface
3. **API Endpoint** เสิร์ฟข้อมูลผ่าน Supabase Edge Functions

#### 2.2 Data Processing (Frontend)
1. **fetchNVRStatus()** เรียกข้อมูลจาก backend
2. **Data Analysis** วิเคราะห์สถานะและหาปัญหาที่เกิดขึ้น
3. **State Management** เก็บข้อมูลใน React state

#### 2.3 Visualization (UI)
1. **Dashboard** แสดงภาพรวมสถานะทั้งหมด
2. **Critical Issues Analysis** วิเคราะห์ปัญหาขั้นสูง
3. **NVR Status Page** แสดงรายละเอียดแต่ละเครื่อง

---

## 3. Components หลัก (Key Components)

### 3.1 App.tsx (Main Application)
- **State Management**: จัดการข้อมูล NVR, loading, error
- **Auto-refresh**: อัปเดตข้อมูลทุก 1 นาที
- **Navigation**: สลับหน้าต่างๆ

### 3.2 NVRDashboard.tsx
- **Overview Cards**: แสดงสถิติสำคัญ
- **Pie Charts**: แสดงการกระจายของปัญหา
- **District Analysis**: วิเคราะห์ตามเขตพื้นที่

### 3.3 CriticalIssuesAnalysis.tsx
- **Issue Classification**: จำแนกประเภทปัญหา (ONU, NVR, HDD, VIEW, LOGIN)
- **Trend Analysis**: วิเคราะห์แนวโน้ม
- **Historical Data**: เปรียบเทียบข้อมูลย้อนหลัง

### 3.4 NVRStatusPage.tsx
- **Detailed View**: ข้อมูลละเอียดแต่ละ NVR
- **Real-time Status**: สถานะปัจจุบัน
- **Filtering & Search**: ค้นหาและกรองข้อมูล

---

## 4. ประเภทของปัญหา (Issue Types)

ระบบตรวจจับปัญหา 5 ประเภทหลัก:

1. **ONU Down** - ปัญหาอุปกรณ์ ONU (Optical Network Unit)
2. **NVR Down** - ปัญหาเครื่อง NVR 
3. **HDD Failure** - ปัญหาฮาร์ดดิสก์
4. **View Down** - ปัญหาการแสดงภาพ
5. **Login Problem** - ปัญหาการเข้าสู่ระบบ

### ระดับความรุนแรง (Priority Hierarchy):
```
ONU > NVR > HDD > VIEW > LOGIN > HEALTHY
```

---

## 5. API Endpoints

### 5.1 GET `/nvr-status`
- **Purpose**: ดึงข้อมูล NVR ล่าสุดจาก Google Sheets
- **Response**: NVRStatus[] พร้อมข้อมูลสถานะทั้งหมด

### 5.2 POST `/nvr-status/cache`
- **Purpose**: เก็บข้อมูลลง cache เพื่อเรียกใช้งานเร็วขึ้น
- **Response**: สถานะการ cache ข้อมูล

### 5.3 GET `/nvr-status/cached`
- **Purpose**: ดึงข้อมูลจาก cache (ถ้ามี)
- **Response**: ข้อมูลที่ cache ไว้

---

## 6. การจัดการข้อมูล (Data Management)

### 6.1 Data Structure
```typescript
interface NVRStatus {
  id: string;
  nvr: string;           // ชื่อ NVR เช่น AC-JJ-10-A
  location: string;      // จุดติดตั้ง
  district: string;      // เขต
  onu_ip: string;
  ping_onu: boolean;     // สถานะ ONU
  nvr_ip: string;
  ping_nvr: boolean;     // สถานะ NVR
  hdd_status: boolean;   // สถานะ HDD
  normal_view: boolean;  // สถานะการแสดงภาพ
  check_login: boolean;  // สถานะการ login
  camera_count: number;  // จำนวนกล้อง
  date_updated: string;  // เวลาอัปเดต
}
```

### 6.2 Data Processing
- **Status Calculation**: คำนวณสถานะที่แท้จริงจากข้อมูลต่างๆ
- **Issue Detection**: ตรวจจับปัญหาและจำแนกประเภท
- **Trend Analysis**: วิเคราะห์การเปลี่ยนแปลงตามเวลา

---

## 7. ฟีเจอร์พิเศษ (Special Features)

### 7.1 Real-time Monitoring
- **Auto-refresh**: อัปเดตทุก 1 นาที
- **Live Status**: แสดงสถานะแบบ real-time
- **Notifications**: แจ้งเตือนเมื่อมีปัญหา

### 7.2 Advanced Analytics
- **Trend Analysis**: วิเคราะห์แนวโน้มของปัญหา
- **Historical Comparison**: เปรียบเทียบข้อมูลย้อนหลัง
- **District-wise Analysis**: วิเคราะห์ตามพื้นที่

### 7.3 User Experience
- **Responsive Design**: รองรับทุกขนาดหน้าจอ
- **Dark Theme**: ธีมสำหรับการใช้งานต่อเนื่อง
- **Interactive Charts**: กราฟแบบโต้ตอบ

---

## 8. การประมวลผลแบบ Asynchronous

```javascript
// การทำงานแบบ non-blocking
useEffect(() => {
  loadNVRData(); // Initial load
  
  const interval = setInterval(() => {
    loadNVRData(true); // Silent refresh
  }, 60000); // Every 1 minute

  return () => clearInterval(interval);
}, []);
```

---

## 9. Error Handling & Resilience

- **Fallback Data**: ใช้ข้อมูล mock ถ้า API ล้มเหลว
- **Retry Logic**: ลองใหม่อัตโนมัติ
- **User Notifications**: แจ้ง error ให้ผู้ใช้ทราบ
- **Graceful Degradation**: ทำงานต่อแม้บางส่วนล้มเหลว

---

## 10. Performance Optimization

- **Data Caching**: เก็บข้อมูลใน KV store
- **Lazy Loading**: โหลดข้อมูลตามต้องการ
- **Memoization**: คำนวณค่าซ้ำๆ ครั้งเดียว
- **Virtual Scrolling**: สำหรับรายการข้อมูลยาวๆ

---

นี่คือ Workflow ทั้งหมดของระบบ CCTV Repair Notification Website ซึ่งออกแบบมาเพื่อให้การติดตามสถานะและการจัดการปัญหาของระบบกล้อง CCTV เป็นไปอย่างมีประสิทธิภาพและรวดเร็ว