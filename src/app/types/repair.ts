export type RepairStatus = 'pending' | 'in-progress' | 'completed';
export type Priority = 'high' | 'medium' | 'low';

export interface RepairTicket {
  id: string;
  ticketNumber: string;
  location: string;
  district: string;
  issue: string;
  status: RepairStatus;
  priority: Priority;
  reportedDate: string;
  scheduledDate: string;
  completedDate?: string;
  reporter: string;
  technician?: string;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}