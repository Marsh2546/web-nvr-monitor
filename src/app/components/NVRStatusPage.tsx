import { useState } from "react";
import { NVRStatus } from "@/app/types/nvr";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { Button } from "@/app/components/ui/button";
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
  Camera,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface NVRStatusPageProps {
  nvrList: NVRStatus[];
}

export function NVRStatusPage({ nvrList }: NVRStatusPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Get unique districts
  const districts = Array.from(
    new Set(nvrList.map((nvr) => nvr.district)),
  ).sort();

  // Check if NVR has any issues
  const hasIssues = (nvr: NVRStatus) => {
    return (
      !nvr.ping_onu ||
      !nvr.ping_nvr ||
      !nvr.hdd_status ||
      !nvr.normal_view ||
      !nvr.check_login
    );
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

  // Toggle row expansion
  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Filter NVR list
  const filteredNVRList = nvrList.filter((nvr) => {
    const matchesSearch =
      nvr.nvr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nvr.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nvr.district.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDistrict =
      selectedDistrict === "all" || nvr.district === selectedDistrict;
    return matchesSearch && matchesDistrict;
  });

  const normalNVRs = filteredNVRList.filter((nvr) => !hasIssues(nvr));
  const problemNVRs = filteredNVRList.filter((nvr) => hasIssues(nvr));

  // Pagination calculations
  const getPaginatedItems = (items: NVRStatus[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  const getTotalPages = (items: NVRStatus[]) => {
    return Math.ceil(items.length / itemsPerPage);
  };

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    setExpandedRows(new Set());
  };

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value);
    setCurrentPage(1);
    setExpandedRows(new Set());
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value, 10));
    setCurrentPage(1);
    setExpandedRows(new Set());
  };

  // Pagination component
  const Pagination = ({
    items,
    label,
  }: {
    items: NVRStatus[];
    label: string;
  }) => {
    const totalPages = getTotalPages(items);
    const totalItems = items.length;
    const startItem =
      totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    if (totalItems === 0) return null;

    return (
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Items per page */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">แสดง:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={handleItemsPerPageChange}
              >
                <SelectTrigger className="w-24 bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">รายการ/หน้า</span>
            </div>

            {/* Page info */}
            <div className="text-sm text-muted-foreground">
              แสดง {startItem.toLocaleString()} - {endItem.toLocaleString()} จาก{" "}
              {totalItems.toLocaleString()} รายการ
            </div>

            {/* Page navigation */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="bg-background border-border text-foreground"
              >
                <ChevronsLeft className="size-4" />
              </Button>
              <Button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="bg-background border-border text-foreground"
              >
                <ChevronLeft className="size-4" />
              </Button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">หน้า</span>
                <Input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= totalPages) {
                      setCurrentPage(page);
                    }
                  }}
                  className="w-16 text-center bg-background border-border text-foreground"
                />
                <span className="text-sm text-muted-foreground">
                  / {totalPages}
                </span>
              </div>

              <Button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="bg-background border-border text-foreground"
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="bg-background border-border text-foreground"
              >
                <ChevronsRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Status icon component
  const StatusIcon = ({ status }: { status: boolean }) =>
    status ? (
      <CheckCircle className="size-5 text-green-500" />
    ) : (
      <XCircle className="size-5 text-red-500" />
    );

  const renderNVRRow = (nvr: NVRStatus) => {
    const issues = getIssueCount(nvr);
    const isNormal = issues === 0;
    const isExpanded = expandedRows.has(nvr.id);

    return (
      <div
        key={nvr.id}
        className={`border rounded-lg ${isNormal ? "border-border bg-card" : "border-red-500/30 bg-red-500/5"}`}
      >
        {/* Main Row - Compact */}
        <div
          className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => toggleRow(nvr.id)}
        >
          <div className="grid grid-cols-12 gap-3 items-center">
            {/* NVR ID & Location - 3 cols */}
            <div className="col-span-3">
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronUp className="size-4 text-gray-400" />
                ) : (
                  <ChevronDown className="size-4 text-gray-400" />
                )}
                <div>
                  <div className="font-semibold text-sm text-foreground">
                    {nvr.nvr}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {nvr.location}
                  </div>
                </div>
              </div>
            </div>

            {/* District - 1 col */}
            <div className="col-span-1">
              <Badge variant="outline" className="text-xs">
                {nvr.district}
              </Badge>
            </div>

            {/* Status Icons - 5 cols */}
            <div className="col-span-5">
              <div className="flex items-center gap-3 justify-center">
                <div
                  className="flex flex-col items-center gap-0.5"
                  title="ONU Ping"
                >
                  <Wifi
                    className={`size-4 ${nvr.ping_onu ? "text-green-500" : "text-red-500"}`}
                  />
                  <span className="text-[10px] text-muted-foreground">ONU</span>
                </div>
                <div
                  className="flex flex-col items-center gap-0.5"
                  title="NVR Ping"
                >
                  <Server
                    className={`size-4 ${nvr.ping_nvr ? "text-green-500" : "text-red-500"}`}
                  />
                  <span className="text-[10px] text-muted-foreground">NVR</span>
                </div>
                <div
                  className="flex flex-col items-center gap-0.5"
                  title="HDD Status"
                >
                  <HardDrive
                    className={`size-4 ${nvr.hdd_status ? "text-green-500" : "text-red-500"}`}
                  />
                  <span className="text-[10px] text-muted-foreground">HDD</span>
                </div>
                <div
                  className="flex flex-col items-center gap-0.5"
                  title="Normal View"
                >
                  <Eye
                    className={`size-4 ${nvr.normal_view ? "text-green-500" : "text-red-500"}`}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    View
                  </span>
                </div>
                <div
                  className="flex flex-col items-center gap-0.5"
                  title="Login Status"
                >
                  <LogIn
                    className={`size-4 ${nvr.check_login ? "text-green-500" : "text-red-500"}`}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Login
                  </span>
                </div>
              </div>
            </div>

            {/* Cameras & Status - 3 cols */}
            <div className="col-span-3 flex items-center justify-end gap-3">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Camera className="size-4" />
                <span>{nvr.camera_count}</span>
              </div>
              {!isNormal && (
                <Badge variant="destructive" className="text-xs">
                  {issues} ปัญหา
                </Badge>
              )}
              {isNormal && (
                <Badge className="bg-green-600 text-xs text-white">ปกติ</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-border bg-muted/20 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Network Details */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                  เครือข่าย
                </h4>
                <div
                  className={`p-2 rounded border text-sm ${nvr.ping_onu ? "bg-green-500/5 border-green-500/20" : "bg-red-500/10 border-red-500/30"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wifi
                        className={`size-4 ${nvr.ping_onu ? "text-green-500" : "text-red-500"}`}
                      />
                      <span className="font-medium text-foreground">
                        ONU Ping
                      </span>
                    </div>
                    <StatusIcon status={nvr.ping_onu} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 ml-6">
                    {nvr.onu_ip}
                  </div>
                </div>
                <div
                  className={`p-2 rounded border text-sm ${nvr.ping_nvr ? "bg-green-500/5 border-green-500/20" : "bg-red-500/10 border-red-500/30"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Server
                        className={`size-4 ${nvr.ping_nvr ? "text-green-500" : "text-red-500"}`}
                      />
                      <span className="font-medium text-foreground">
                        NVR Ping
                      </span>
                    </div>
                    <StatusIcon status={nvr.ping_nvr} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 ml-6">
                    {nvr.nvr_ip}
                  </div>
                </div>
              </div>

              {/* System Details */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                  ระบบ
                </h4>
                <div
                  className={`p-2 rounded border text-sm ${nvr.hdd_status ? "bg-green-500/5 border-green-500/20" : "bg-red-500/10 border-red-500/30"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardDrive
                        className={`size-4 ${nvr.hdd_status ? "text-green-500" : "text-red-500"}`}
                      />
                      <span className="font-medium text-foreground">
                        HDD Status
                      </span>
                    </div>
                    <StatusIcon status={nvr.hdd_status} />
                  </div>
                </div>
                <div
                  className={`p-2 rounded border text-sm ${nvr.normal_view ? "bg-green-500/5 border-green-500/20" : "bg-red-500/10 border-red-500/30"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye
                        className={`size-4 ${nvr.normal_view ? "text-green-500" : "text-red-500"}`}
                      />
                      <span className="font-medium text-foreground">
                        แสดงภาพ
                      </span>
                    </div>
                    <StatusIcon status={nvr.normal_view} />
                  </div>
                </div>
                <div
                  className={`p-2 rounded border text-sm ${nvr.check_login ? "bg-green-500/5 border-green-500/20" : "bg-red-500/10 border-red-500/30"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LogIn
                        className={`size-4 ${nvr.check_login ? "text-green-500" : "text-red-500"}`}
                      />
                      <span className="font-medium text-foreground">
                        เข้าสู่ระบบ
                      </span>
                    </div>
                    <StatusIcon status={nvr.check_login} />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3 pt-2 border-t border-border">
                  <Clock className="size-3" />
                  <span>อัปเดต: {nvr.date_updated}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-foreground">
          สถานะ CCTV NVR
        </h1>
        <p className="text-muted-foreground">
          ตรวจสอบสถานะและปัญหาของระบบ CCTV แบบเรียลไทม์
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-3 text-foreground">
            <CardTitle className="text-lg">ทั้งหมด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {nvrList.length}
            </div>
            <p className="text-sm text-muted-foreground">จุดติดตั้งทั้งหมด</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-green-500/5 shadow-sm">
          <CardHeader className="pb-3 text-green-500">
            <CardTitle className="text-lg">ทำงานปกติ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {nvrList.filter((nvr) => !hasIssues(nvr)).length}
            </div>
            <p className="text-sm text-green-600/80">ไม่มีปัญหา</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/20 bg-red-500/5 shadow-sm">
          <CardHeader className="pb-3 text-red-500">
            <CardTitle className="text-lg">มีปัญหา</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">
              {nvrList.filter((nvr) => hasIssues(nvr)).length}
            </div>
            <p className="text-sm text-red-600/80">ต้องตรวจสอบ</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาด้วย NVR, สถานที่, หรือเขต..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 bg-background border-border text-foreground"
                />
              </div>
            </div>
            <div>
              <Select
                value={selectedDistrict}
                onValueChange={handleDistrictChange}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="เลือกเขต" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  <SelectItem value="all">ทุกเขต</SelectItem>
                  {districts.map((district) => (
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
          <TabsTrigger value="normal">ปกติ ({normalNVRs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-2">
          {/* Table Header */}
          <div className="bg-muted/50 border border-border rounded-lg p-3">
            <div className="grid grid-cols-12 gap-3 items-center text-xs font-semibold text-muted-foreground uppercase">
              <div className="col-span-3">NVR / สถานที่</div>
              <div className="col-span-1">เขต</div>
              <div className="col-span-5 text-center">สถานะระบบ</div>
              <div className="col-span-3 text-right">กล้อง / สถานะ</div>
            </div>
          </div>

          {getPaginatedItems(filteredNVRList).map((nvr) => renderNVRRow(nvr))}
          {filteredNVRList.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                ไม่พบข้อมูลที่ค้นหา
              </CardContent>
            </Card>
          )}
          <Pagination items={filteredNVRList} label="ทั้งหมด" />
        </TabsContent>

        <TabsContent value="problem" className="space-y-2">
          {/* Table Header */}
          <div className="bg-muted/50 border border-border rounded-lg p-3">
            <div className="grid grid-cols-12 gap-3 items-center text-xs font-semibold text-muted-foreground uppercase">
              <div className="col-span-3">NVR / สถานที่</div>
              <div className="col-span-1">เขต</div>
              <div className="col-span-5 text-center">สถานะระบบ</div>
              <div className="col-span-3 text-right">กล้อง / สถานะ</div>
            </div>
          </div>

          {getPaginatedItems(problemNVRs).map((nvr) => renderNVRRow(nvr))}
          {problemNVRs.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle className="size-12 mx-auto text-green-600 mb-2" />
                <p className="text-gray-600">
                  ไม่มี NVR ที่มีปัญหา ระบบทำงานปกติทั้งหมด
                </p>
              </CardContent>
            </Card>
          )}
          <Pagination items={problemNVRs} label="มีปัญหา" />
        </TabsContent>

        <TabsContent value="normal" className="space-y-2">
          {/* Table Header */}
          <div className="bg-muted/50 border border-border rounded-lg p-3">
            <div className="grid grid-cols-12 gap-3 items-center text-xs font-semibold text-muted-foreground uppercase">
              <div className="col-span-3">NVR / สถานที่</div>
              <div className="col-span-1">เขต</div>
              <div className="col-span-5 text-center">สถานะระบบ</div>
              <div className="col-span-3 text-right">กล้อง / สถานะ</div>
            </div>
          </div>

          {getPaginatedItems(normalNVRs).map((nvr) => renderNVRRow(nvr))}
          {normalNVRs.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                ไม่พบ NVR ที่ทำงานปกติ
              </CardContent>
            </Card>
          )}
          <Pagination items={normalNVRs} label="ปกติ" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
