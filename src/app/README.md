# 📁 src/app/ - โครงสร้างโฟลเดอร์และหน้าที่ของแต่ละไฟล์

## 🎯 **ภาพรวม**
โฟลเดอร์ `src/app/` เป็นหัวใจหลักของแอปพลิเคชัน CCTV NVR Monitor ประกอบด้วยไฟล์และโฟลเดอร์ที่จัดระเบียบตามหน้าที่การทำงาน

---

## 📄 **ไฟล์หลัก**

### **App.tsx** - 🏠 ไฟล์หลักของแอปพลิเคชัน
- **หน้าที่**: Component หลักที่รวมทุกอย่างเข้าด้วยกัน
- **ทำอะไรบ้าง**:
  - จัดการ state หลัก (currentPage, nvrData, theme, etc.)
  - ควบคุมการเปลี่ยนหน้า (Dashboard ↔ Status)
  - ดึงข้อมูล NVR จาก API
  - แสดง Header พร้อม Navigation
  - จัดการ Auto-refresh ข้อมูล
  - ควบคุมธีม (light/dark mode)

---

## 📂 **โฟลเดอร์ย่อย**

### **🎨 components/ - คอมโพเนนต์ UI**
```
components/
├── 📄 App.tsx                    # ไฟล์หลัก (อยู่ข้างบน)
├── 📄 index.ts                  # Export คอมโพเนนต์ทั้งหมด
├── 📄 PageRegistry.tsx          # ระบบจัดการหน้าต่างๆ
├── 📄 PageWrappers.tsx          # Wrapper สำหรับแต่ละหน้า
│
├── 📁 pages/                    # 📄 หน้าต่างต่างๆ
│   ├── 📄 index.ts              # Export pages ทั้งหมด
│   ├── 📄 Dashboard.tsx         # หน้า Dashboard (ซ่อมบำรุง)
│   ├── 📄 NVRDashboard.tsx      # 🏠 หน้าหลัก NVR Dashboard
│   ├── 📄 NVRStatusPage.tsx     # 📊 หน้าสถานะ NVR ละเอียด
│   └── 📄 CriticalIssuesAnalysis.tsx # 📈 วิเคราะห์ปัญหา
│
├── 📁 shared/                   # 🔄 คอมโพเนนต์ใช้ร่วมกัน
│   ├── 📄 index.ts              # Export shared components
│   ├── 📄 StatusIcon.tsx        # ✅ ไอคอนสถานะ (เขียว/แดง)
│   ├── 📄 ComponentStatusIndicator.tsx # 📊 ตัวบ่งชี้สถานะคอมโพเนนต์
│   └── 📄 Pagination.tsx        # 📄 คอมโพเนนต์แบ่งหน้า
│
└── 📁 ui/                       # 🎨 UI Components พื้นฐาน
    ├── 📄 badge.tsx             # 🏷️ ป้ายชื่อ
    ├── 📄 button.tsx            # 🔘 ปุ่ม
    ├── 📄 card.tsx              # 🃏 การ์ด
    ├── 📄 dialog.tsx            # 💬 ไดอะล็อก
    ├── 📄 input.tsx             # 📝 ช่องกรอกข้อมูล
    ├── 📄 select.tsx            # 📋 下拉เมนู
    ├── 📄 sonner.tsx            # 🔔 Toast notifications
    ├── 📄 tabs.tsx              # 📑 แท็บ
    ├── 📄 table.tsx             # 📊 ตาราง
    ├── 📄 tooltip.tsx           # 💡 คำแนะนำเล็กๆ
    └── 📄 utils.ts              # 🛠️ Utility functions
```

### **📊 data/ - ข้อมูลตัวอย่าง**
```
data/
└── 📄 nvrData.ts                # 📋 ข้อมูล NVR ตัวอย่างสำหรับทดสอบ
```

### **🔧 lib/ - ไลบรารีเฉพาะ**
```
lib/
└── 📄 storage.ts                # 💾 ฟังก์ชันจัดการข้อมูล (Google Sheets)
```

### **🌐 services/ - บริการภายนอก**
```
services/
├── 📄 nvrService.ts             # 🌐 เรียก API ข้อมูล NVR
└── 📄 nvrHistoryService.ts      # 📈 เรียกข้อมูลประวัติ NVR
```

### **📝 types/ - นิยาม Type**
```
types/
├── 📄 common.ts                 # 🔧 Type ทั่วไป (pagination, sorting)
└── 📄 nvr.ts                    # 📊 Type สำหรับ NVR
```

### **🛠️ utils/ - ฟังก์ชันช่วยเหลือ**
```
utils/
├── 📄 index.ts                  # 📦 Export utils ทั้งหมด
├── 📄 AnimatedNumber.tsx        # 🔢 คอมโพเนนต์ตัวเลขเคลื่อนไหว
├── 📄 cn.ts                     # 🎨 จัดการ CSS classes
└── 📄 nvrStatusHelpers.ts       # 🔧 ฟังก์ชันคำนวณสถานะ NVR
```

---

## 🔄 **การทำงานร่วมกัน**

### **🏠 App.tsx (หัวใจหลัก)**
```
App.tsx
├── 📊 ดึงข้อมูลจาก nvrService
├── 🎨 แสดง PageRegistry (เลือกหน้า)
├── 📄 แสดง NVRDashboard หรือ NVRStatusPage
└── 🔄 จัดการ state ทั้งหมด
```

### **📊 NVRDashboard.tsx (หน้าหลัก)**
```
NVRDashboard
├── 📈 แสดงสถิติ NVR (AnimatedNumber)
├── 📊 แสดงกราฟ (recharts)
├── 🚨 แสดงปัญหาร้ายแรง
├── 🎨 ใช้ shared components (StatusIcon, ComponentStatusIndicator)
└── 🔧 ใช้ nvrStatusHelpers คำนวณสถานะ
```

### **📋 NVRStatusPage.tsx (หน้าละเอียด)**
```
NVRStatusPage
├── 🔍 ฟังก์ชันค้นหา/กรอง
├── 📄 แสดงตาราง NVR ทั้งหมด
├── 📊 แสดงประวัติ (recharts)
├── 📷 แสดงรูปภาพ snapshot
├── 📄 ใช้ Pagination component
└── 🎨 ใช้ shared components
```

---

## 🎯 **สรุปหน้าที่**

| ไฟล์/โฟลเดอร์ | หน้าที่หลัก | คำอธิบาย |
|----------------|-------------|----------|
| **App.tsx** | 🏠 หัวใจแอป | จัดการทุกอย่าง, state หลัก, navigation |
| **components/** | 🎨 UI | คอมโพเนนต์ทั้งหมด |
| **pages/** | 📄 หน้าต่าง | หน้า Dashboard, Status, Analysis |
| **shared/** | 🔄 ใช้ร่วม | StatusIcon, Pagination, ComponentStatus |
| **ui/** | 🎨 พื้นฐาน | Button, Card, Input, Table, etc. |
| **data/** | 📊 ข้อมูล | ข้อมูลตัวอย่าง NVR |
| **services/** | 🌐 API | เรียกข้อมูลจากภายนอก |
| **types/** | 📝 Type | นิยาม TypeScript |
| **utils/** | 🛠️ ช่วยเหลือ | ฟังก์ชันทั่วไป, helpers |

---

## 🚀 **การพัฒนา**

เมื่อต้องการเพิ่มฟีเจอร์ใหม่:
1. **เพิ่มหน้าใหม่** → `components/pages/`
2. **เพิ่มคอมโพเนนต์ใช้ร่วม** → `components/shared/`
3. **เพิ่ม UI พื้นฐาน** → `components/ui/`
4. **เพิ่ม Type ใหม่** → `types/`
5. **เพิ่มฟังก์ชันช่วย** → `utils/`

โครงสร้างนี้ออกแบบมาให้ **ง่ายต่อการบำรุงรักษา** และ **ขยายได้** 🎯
