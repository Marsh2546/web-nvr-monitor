import { useState } from 'react';
import { NVRStatus } from '@/app/types/nvr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { 
  Search, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Server,
  HardDrive,
  Eye,
  LogIn,
  Wifi,
  Clock,
  Camera
} from 'lucide-react';

interface NVRStatusPageProps {
  nvrList: NVRStatus[];
}

export function NVRStatusPage({ nvrList }: NVRStatusPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');

  // Get unique districts
  const districts = Array.from(new Set(nvrList.map(nvr => nvr.district))).sort();

  // Check if NVR has any issues
  const hasIssues = (nvr: NVRStatus) => {
    return !nvr.ping_onu || !nvr.ping_nvr || !nvr.hdd_status || !nvr.normal_view || !nvr.check_login;
  };

  // Get issue count
  const getIssueCount = (nvr: NVRStatus) => {
    let count = 0;
    if (!nvr.ping_onu) count++;
    if (!nvr.ping_nvr) count++;
    if (!nvr.hdd_status) count++;
    if (!nvr.normal_view) count++;
    if (!nvr.check_login) count++;
    return count;
  };

  // Filter NVR list
  const filteredNVRList = nvrList.filter(nvr => {
    const matchesSearch = 
      nvr.nvr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nvr.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nvr.district.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDistrict = selectedDistrict === 'all' || nvr.district === selectedDistrict;
    return matchesSearch && matchesDistrict;
  });

  const normalNVRs = filteredNVRList.filter(nvr => !hasIssues(nvr));
  const problemNVRs = filteredNVRList.filter(nvr => hasIssues(nvr));

  const renderNVRCard = (nvr: NVRStatus) => {
    const issues = getIssueCount(nvr);
    const isNormal = issues === 0;

    return (
      <Card key={nvr.id} className={isNormal ? 'border-green-200' : 'border-red-300 bg-red-50'}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <Server className="size-5" />
                {nvr.nvr}
                {!isNormal && (
                  <Badge variant="destructive" className="ml-2">
                    <AlertCircle className="size-3 mr-1" />
                    {issues} ปัญหา
                  </Badge>
                )}
                {isNormal && (
                  <Badge className="ml-2 bg-green-600">
                    <CheckCircle className="size-3 mr-1" />
                    ปกติ
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {nvr.location} - เขต{nvr.district}
              </CardDescription>
            </div>
            <div className="text-right text-sm">
              <div className="flex items-center gap-1 text-gray-600">
                <Camera className="size-4" />
                <span>{nvr.camera_count} กล้อง</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Network Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className={`p-3 rounded-lg border ${nvr.ping_onu ? 'bg-green-50 border-green-200' : 'bg-red-100 border-red-300'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className={`size-4 ${nvr.ping_onu ? 'text-green-600' : 'text-red-600'}`} />
                    <span className="text-sm font-medium">ONU Ping</span>
                  </div>
                  {nvr.ping_onu ? (
                    <CheckCircle className="size-4 text-green-600" />
                  ) : (
                    <XCircle className="size-4 text-red-600" />
                  )}
                </div>
                <div className="text-xs text-gray-600 mt-1">{nvr.onu_ip}</div>
              </div>

              <div className={`p-3 rounded-lg border ${nvr.ping_nvr ? 'bg-green-50 border-green-200' : 'bg-red-100 border-red-300'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className={`size-4 ${nvr.ping_nvr ? 'text-green-600' : 'text-red-600'}`} />
                    <span className="text-sm font-medium">NVR Ping</span>
                  </div>
                  {nvr.ping_nvr ? (
                    <CheckCircle className="size-4 text-green-600" />
                  ) : (
                    <XCircle className="size-4 text-red-600" />
                  )}
                </div>
                <div className="text-xs text-gray-600 mt-1">{nvr.nvr_ip}</div>
              </div>
            </div>

            {/* System Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className={`p-2 rounded-lg border text-center ${nvr.hdd_status ? 'bg-green-50 border-green-200' : 'bg-red-100 border-red-300'}`}>
                <HardDrive className={`size-4 mx-auto ${nvr.hdd_status ? 'text-green-600' : 'text-red-600'}`} />
                <div className="text-xs mt-1">HDD</div>
                <div className={`text-xs font-medium ${nvr.hdd_status ? 'text-green-600' : 'text-red-600'}`}>
                  {nvr.hdd_status ? 'ปกติ' : 'มีปัญหา'}
                </div>
              </div>

              <div className={`p-2 rounded-lg border text-center ${nvr.normal_view ? 'bg-green-50 border-green-200' : 'bg-red-100 border-red-300'}`}>
                <Eye className={`size-4 mx-auto ${nvr.normal_view ? 'text-green-600' : 'text-red-600'}`} />
                <div className="text-xs mt-1">แสดงภาพ</div>
                <div className={`text-xs font-medium ${nvr.normal_view ? 'text-green-600' : 'text-red-600'}`}>
                  {nvr.normal_view ? 'ปกติ' : 'ผิดปกติ'}
                </div>
              </div>

              <div className={`p-2 rounded-lg border text-center ${nvr.check_login ? 'bg-green-50 border-green-200' : 'bg-red-100 border-red-300'}`}>
                <LogIn className={`size-4 mx-auto ${nvr.check_login ? 'text-green-600' : 'text-red-600'}`} />
                <div className="text-xs mt-1">เข้าสู่ระบบ</div>
                <div className={`text-xs font-medium ${nvr.check_login ? 'text-green-600' : 'text-red-600'}`}>
                  {nvr.check_login ? 'ได้' : 'ไม่ได้'}
                </div>
              </div>
            </div>

            {/* Last Update */}
            <div className="flex items-center gap-2 text-xs text-gray-600 pt-2 border-t">
              <Clock className="size-3" />
              <span>อัปเดตล่าสุด: {nvr.date_updated}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">สถานะ CCTV NVR</h1>
        <p className="text-gray-600">ตรวจสอบสถานะและปัญหาของระบบ CCTV แบบเรียลไทม์</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">ทั้งหมด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{nvrList.length}</div>
            <p className="text-sm text-gray-600">จุดติดตั้งทั้งหมด</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-green-800">ทำงานปกติ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {nvrList.filter(nvr => !hasIssues(nvr)).length}
            </div>
            <p className="text-sm text-green-700">ไม่มีปัญหา</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-red-800">มีปัญหา</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {nvrList.filter(nvr => hasIssues(nvr)).length}
            </div>
            <p className="text-sm text-red-700">ต้องตรวจสอบ</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-3 size-4 text-gray-400" />
                <Input
                  placeholder="ค้นหาด้วย NVR, สถานที่, หรือเขต..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกเขต" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกเขต</SelectItem>
                  {districts.map(district => (
                    <SelectItem key={district} value={district}>
                      เขต{district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            ทั้งหมด ({filteredNVRList.length})
          </TabsTrigger>
          <TabsTrigger value="problem">
            มีปัญหา ({problemNVRs.length})
          </TabsTrigger>
          <TabsTrigger value="normal">
            ปกติ ({normalNVRs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredNVRList.map(nvr => renderNVRCard(nvr))}
          {filteredNVRList.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                ไม่พบข้อมูลที่ค้นหา
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="problem" className="space-y-4">
          {problemNVRs.map(nvr => renderNVRCard(nvr))}
          {problemNVRs.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle className="size-12 mx-auto text-green-600 mb-2" />
                <p className="text-gray-600">ไม่มี NVR ที่มีปัญหา ระบบทำงานปกติทั้งหมด</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="normal" className="space-y-4">
          {normalNVRs.map(nvr => renderNVRCard(nvr))}
          {normalNVRs.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                ไม่พบ NVR ที่ทำงานปกติ
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
