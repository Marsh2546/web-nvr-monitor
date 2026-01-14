export type RepairStatus = 'รอดำเนินการ' | 'กำลังซ่อม' | 'เสร็จสิ้น' | 'ยกเลิก';
export type Priority = 'ปกติ' | 'ด่วน' | 'ด่วนมาก';

export interface RepairRequest {
  id: string;
  cctvId: string;
  location: string;
  district: string;
  problem: string;
  description: string;
  priority: Priority;
  status: RepairStatus;
  reportedBy: string;
  contactPhone: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  technicianName?: string;
}
