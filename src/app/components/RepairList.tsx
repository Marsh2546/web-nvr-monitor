import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { RepairTicket } from '@/app/types/repair';
import { Calendar, MapPin, User, AlertCircle } from 'lucide-react';

interface RepairListProps {
  tickets: RepairTicket[];
  highlightTomorrow?: boolean;
}

const statusColors = {
  pending: 'bg-yellow-500',
  'in-progress': 'bg-blue-500',
  completed: 'bg-green-500',
};

const statusLabels = {
  pending: 'รอดำเนินการ',
  'in-progress': 'กำลังซ่อม',
  completed: 'เสร็จสิ้น',
};

const priorityColors = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-orange-100 text-orange-800 border-orange-200',
  low: 'bg-gray-100 text-gray-800 border-gray-200',
};

const priorityLabels = {
  high: 'เร่งด่วนมาก',
  medium: 'ปานกลาง',
  low: 'ไม่เร่งด่วน',
};

export function RepairList({ tickets, highlightTomorrow = false }: RepairListProps) {
  const tomorrow = '2026-01-14';

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => {
        const isTomorrow = highlightTomorrow && ticket.scheduledDate === tomorrow && ticket.status !== 'completed';
        
        return (
          <Card 
            key={ticket.id} 
            className={isTomorrow ? 'border-red-500 border-2 shadow-lg bg-red-50' : ''}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {ticket.ticketNumber}
                    {isTomorrow && (
                      <Badge variant="destructive" className="ml-2">
                        <AlertCircle className="size-3 mr-1" />
                        ต้องดำเนินการพรุ่งนี้!
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <MapPin className="size-4" />
                    {ticket.location} ({ticket.district})
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge 
                    variant="outline"
                    className={priorityColors[ticket.priority]}
                  >
                    {priorityLabels[ticket.priority]}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <div className={`size-3 rounded-full ${statusColors[ticket.status]}`} />
                    <span className="text-sm">{statusLabels[ticket.status]}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-sm text-gray-700">ปัญหา:</p>
                  <p className="text-sm">{ticket.issue}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-gray-500" />
                    <div>
                      <span className="text-gray-600">วันที่แจ้ง: </span>
                      <span className="font-medium">
                        {new Date(ticket.reportedDate).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-gray-500" />
                    <div>
                      <span className="text-gray-600">วันนัดซ่อม: </span>
                      <span className={`font-medium ${isTomorrow ? 'text-red-600' : ''}`}>
                        {new Date(ticket.scheduledDate).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-gray-500" />
                    <div>
                      <span className="text-gray-600">ผู้แจ้ง: </span>
                      <span className="font-medium">{ticket.reporter}</span>
                    </div>
                  </div>
                  {ticket.technician && (
                    <div className="flex items-center gap-2">
                      <User className="size-4 text-gray-500" />
                      <div>
                        <span className="text-gray-600">ช่าง: </span>
                        <span className="font-medium">{ticket.technician}</span>
                      </div>
                    </div>
                  )}
                  {ticket.completedDate && (
                    <div className="flex items-center gap-2 col-span-2">
                      <Calendar className="size-4 text-green-600" />
                      <div>
                        <span className="text-gray-600">เสร็จสิ้นเมื่อ: </span>
                        <span className="font-medium text-green-600">
                          {new Date(ticket.completedDate).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                  {ticket.updatedAt && (
                    <div className="flex items-center gap-2 col-span-2">
                      <Calendar className="size-4 text-gray-500" />
                      <div>
                        <span className="text-gray-600">อัปเดตล่าสุด: </span>
                        <span className="font-medium">
                          {new Date(ticket.updatedAt).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })} {new Date(ticket.updatedAt).toLocaleTimeString('th-TH', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {ticket.updatedBy && ` โดย ${ticket.updatedBy}`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}