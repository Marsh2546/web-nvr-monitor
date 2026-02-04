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
### Logic & Status    
  - ONU Down -> ⛔ NVR → HDD → Camera → Login
  - NVR Down -> ⛔ HDD → Camera → Login
  - HDD -> 
    - ถ้า NVR Online and ONU Online -> HDD ให้เช็ค status ตัวเอง
    -  status ไม่เกี่ยวกับ view / login ให้เช็คตามเงื่อนไขของมันเอง
    - ถ้า HDD Online -> HDD true
    - ถ้า HDD Offline -> HDD false
  - login
    - ถ้า nvr online ->  login true
    - ถ้า nvr offline -> ก็ทำงานตาม logic ปกติ NVR Down -> ⛔ HDD → Camera → Login
  - normal_view
    - ถ้า normal_view false & snapshot มีภาพ -> normal_view true
    - ถ้า normal_view false & snapshot ไม่มีภาพ -> normal_view false

  กรณี NVR & ONU ออนไลน์:
  - HDD: 🔴 Failed ถ้า HDD เสียจริง
  - Login: true ถ้า NVR Online 
  - View: 🔴 Failed ถ้า snapshot ไม่มีภาพ
  
    


# ดึงรูปภาพ Sheet -> Snapshot
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

## Prompt
@NVRStatusPage.tsx ฉันอยากเพิ่มตัวที่เสีย (ONU Office, NVR Offline, HDD Fail) ที่เสียตัวเดิมซ้ำกัน 3 วัน, 7 วัน มีกี่จุด อะไรบ้าง 
ช่วยเพิ่ม และ ปรับรูปแบบการแสดงให้สวยงาม

### 📤 Export
- [ ] เพิ่มฟังก์ชัน Export
  - [ ] รองรับการ Export ข้อมูลอุปกรณ์ที่มีสถานะผิดปกติ
  - [ ] สามารถ Export ข้อมูลตามเงื่อนไข Filter ที่ผู้ใช้เลือกได้
  - [ ] ข้อมูลที่ Export จะแสดงในรูปแบบรายการ (List)

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

## NVRStatus Condition

- ONU_STATUS
  - if ONU_STATUS == offline:
    NVR        = false
    HDD        = false
    CAMERA     = false
    LOGIN      = false
    NORMAL_VIEW = false
    END
- NVR_STATUS
  - if NVR_STATUS == offline:
    HDD        = false
    CAMERA     = false
    LOGIN      = false
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

