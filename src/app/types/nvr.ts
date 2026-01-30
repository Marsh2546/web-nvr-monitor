export interface NVRStatus {
  id: string;
  nvr: string; // ชื่อ NVR เช่น AC-JJ-10-A
  location: string; // ชื่อจุดติดตั้ง
  district: string; // เขต
  onu_ip: string;
  ping_onu: boolean;
  nvr_ip: string;
  ping_nvr: boolean;
  hdd_status: boolean;
  normal_view: boolean;
  check_login: boolean;
  camera_count: number; // จำนวนกล้อง
  date_updated: string; // เวลาอัปเดตล่าสุด
}

export type IssueType =
  | "ping_onu"
  | "ping_nvr"
  | "hdd_status"
  | "normal_view"
  | "check_login";

export interface IssueInfo {
  type: IssueType;
  label: string;
  severity: "high" | "medium" | "low";
}
