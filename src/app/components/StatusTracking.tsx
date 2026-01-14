import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { Search, Filter } from 'lucide-react';
import { storage } from '@/lib/storage';
import { RepairRequest, RepairStatus } from '@/types/repair';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

const statusColors: Record<RepairStatus, string> = {
  'รอดำเนินการ': 'bg-yellow-100 text-yellow-800',
  'กำลังซ่อม': 'bg-blue-100 text-blue-800',
  'เสร็จสิ้น': 'bg-green-100 text-green-800',
  'ยกเลิก': 'bg-gray-100 text-gray-800',
};

const priorityColors = {
  'ปกติ': 'bg-gray-100 text-gray-800',
  'ด่วน': 'bg-orange-100 text-orange-800',
  'ด่วนมาก': 'bg-red-100 text-red-800',
};

export function StatusTracking() {
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = () => {
    const allRequests = storage.getAll();
    setRequests(allRequests.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch = 
      req.cctvId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.problem.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesDistrict = districtFilter === 'all' || req.district === districtFilter;

    return matchesSearch && matchesStatus && matchesDistrict;
  });

  const districts = Array.from(new Set(requests.map(r => r.district))).sort();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ติดตามสถานะการซ่อม</CardTitle>
          <CardDescription>
            รายการแจ้งซ่อมทั้งหมด {filteredRequests.length} รายการ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="ค้นหาด้วยรหัส CCTV, สถานที่, หรือปัญหา..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="size-4 mr-2" />
                  <SelectValue placeholder="สถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">สถานะทั้งหมด</SelectItem>
                  <SelectItem value="รอดำเนินการ">รอดำเนินการ</SelectItem>
                  <SelectItem value="กำลังซ่อม">กำลังซ่อม</SelectItem>
                  <SelectItem value="เสร็จสิ้น">เสร็จสิ้น</SelectItem>
                  <SelectItem value="ยกเลิก">ยกเลิก</SelectItem>
                </SelectContent>
              </Select>

              <Select value={districtFilter} onValueChange={setDistrictFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="เขต" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">เขตทั้งหมด</SelectItem>
                  {districts.map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัส CCTV</TableHead>
                  <TableHead>เขต/สถานที่</TableHead>
                  <TableHead>ปัญหา</TableHead>
                  <TableHead>ความเร่งด่วน</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>วันที่แจ้ง</TableHead>
                  <TableHead>ผู้แจ้ง</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      ไม่พบข้อมูลรายการแจ้งซ่อม
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.cctvId}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{request.district}</div>
                          <div className="text-gray-500 text-xs">{request.location}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{request.problem}</TableCell>
                      <TableCell>
                        <Badge className={priorityColors[request.priority]}>
                          {request.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[request.status]}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {format(new Date(request.createdAt), 'dd MMM yyyy', { locale: th })}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{request.reportedBy}</div>
                          <div className="text-gray-500 text-xs">{request.contactPhone}</div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
