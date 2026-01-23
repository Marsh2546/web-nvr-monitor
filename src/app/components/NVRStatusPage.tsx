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
import { cn } from "@/app/components/ui/utils";
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
  AlertTriangle,
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
  onPageChange: (page: "dashboard" | "status") => void;
}

export function NVRStatusPage({ nvrList, onPageChange }: NVRStatusPageProps) {
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

  // Calculate summary stats for the cards
  const summaryStats = {
    total: nvrList.length,
    healthy: nvrList.filter((nvr) => !hasIssues(nvr)).length,
    attention: nvrList.filter((nvr) => hasIssues(nvr)).length,
    critical: nvrList.filter((nvr) => getIssueCount(nvr) >= 2).length,
  };

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
        className={cn(
          "border rounded-xl transition-all duration-300 overflow-hidden",
          isNormal
            ? "border-slate-800 bg-slate-900/40 hover:bg-slate-900/60"
            : "border-red-500/30 bg-red-500/5 hover:bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.1)]",
        )}
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
            <div className="col-span-3 flex items-center justify-end gap-4">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/40 rounded-md border border-slate-700/30 text-xs text-slate-400">
                <Camera className="size-3.5" />
                <span className="font-bold text-slate-300">
                  {nvr.camera_count}
                </span>
              </div>
              {!isNormal && (
                <Badge
                  variant="destructive"
                  className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20 font-bold px-2 py-0 h-6"
                >
                  {issues} ISSUES
                </Badge>
              )}
              {isNormal && (
                <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px] font-bold px-2 py-0 h-6">
                  HEALTHY
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Details - Premium Redesign */}
        {isExpanded && (
          <div className="border-t border-slate-800/60 bg-slate-900/60 backdrop-blur-sm p-6 animate-in slide-in-from-top-1 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Identity & Discovery */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="size-6 rounded-md bg-blue-500/20 flex items-center justify-center">
                    <Wifi className="size-3.5 text-blue-400" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Network Configuration
                  </h4>
                </div>

                <div
                  className={cn(
                    "p-3 rounded-xl border flex flex-col gap-2 transition-all",
                    nvr.ping_onu
                      ? "bg-slate-950/40 border-slate-800"
                      : "bg-red-500/5 border-red-500/20 shadow-[inset_0_0_10px_rgba(239,68,68,0.05)]",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      ONU GATEWAY
                    </span>
                    <StatusIcon status={nvr.ping_onu} />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {nvr.onu_ip || "0.0.0.0"}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[8px] h-4 bg-slate-900 border-slate-700 text-slate-400 px-1"
                    >
                      STATIC
                    </Badge>
                  </div>
                </div>

                <div
                  className={cn(
                    "p-3 rounded-xl border flex flex-col gap-2 transition-all",
                    nvr.ping_nvr
                      ? "bg-slate-950/40 border-slate-800"
                      : "bg-red-500/5 border-red-500/20 shadow-[inset_0_0_10px_rgba(239,68,68,0.05)]",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      NVR TERMINAL
                    </span>
                    <StatusIcon status={nvr.ping_nvr} />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {nvr.nvr_ip || "0.0.0.0"}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[8px] h-4 bg-slate-900 border-slate-700 text-slate-400 px-1"
                    >
                      HOST
                    </Badge>
                  </div>
                </div>
              </div>

              {/* System Performance */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="size-6 rounded-md bg-purple-500/20 flex items-center justify-center">
                    <HardDrive className="size-3.5 text-purple-400" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Storage & Logic
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div
                    className={cn(
                      "p-3 rounded-xl border flex items-center justify-between transition-all",
                      nvr.hdd_status
                        ? "bg-slate-950/40 border-slate-800"
                        : "bg-red-500/5 border-red-500/20",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "size-2 rounded-full",
                          nvr.hdd_status ? "bg-green-500" : "bg-red-500",
                        )}
                      ></div>
                      <span className="text-xs font-bold text-slate-300">
                        HDD DRIVE STATUS
                      </span>
                    </div>
                    <HardDrive
                      className={cn(
                        "size-4",
                        nvr.hdd_status ? "text-slate-500" : "text-red-400",
                      )}
                    />
                  </div>

                  <div
                    className={cn(
                      "p-3 rounded-xl border flex items-center justify-between transition-all",
                      nvr.check_login
                        ? "bg-slate-950/40 border-slate-800"
                        : "bg-red-500/5 border-red-500/20",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "size-2 rounded-full",
                          nvr.check_login ? "bg-green-500" : "bg-red-500",
                        )}
                      ></div>
                      <span className="text-xs font-bold text-slate-300">
                        PROTOCOL LOGIN
                      </span>
                    </div>
                    <LogIn
                      className={cn(
                        "size-4",
                        nvr.check_login ? "text-slate-500" : "text-red-400",
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Visual Health */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="size-6 rounded-md bg-green-500/20 flex items-center justify-center">
                    <Eye className="size-3.5 text-green-400" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Image Integrity
                  </h4>
                </div>

                <div
                  className={cn(
                    "p-4 rounded-xl border flex flex-col gap-4 transition-all h-full max-h-[140px] justify-between",
                    nvr.normal_view
                      ? "bg-slate-950/40 border-slate-800"
                      : "bg-red-500/5 border-red-500/20",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 leading-tight">
                      ACTIVE CHANNEL VIEWING
                    </span>
                    <Badge
                      className={cn(
                        "text-[10px] font-bold px-2 py-0",
                        nvr.normal_view
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20",
                      )}
                    >
                      {nvr.normal_view ? "NOMINAL" : "CORRUPT"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-500 border-t border-slate-800/50 pt-2">
                    <Clock className="size-3" />
                    <span>LAST TELEMETRY: {nvr.date_updated || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-0 pb-8 space-y-8">
        {/* Page Title Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div>
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
              Status CCTV NVR
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Detailed real-time monitoring and issue tracking across all
              district nodes.
            </p>
          </div>
        </div>

        {/* Summary Cards - Synchronized with Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Units */}
          <div className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800/50 flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-blue-500/10 p-2 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                <Server className="size-5 text-blue-500" />
              </div>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                Total Units
              </span>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white mb-0.5">
                {summaryStats.total.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Registered NVR Devices
              </p>
            </div>
            <div className="absolute -right-2 -bottom-2 opacity-5 grayscale group-hover:grayscale-0 transition-all">
              <Server className="size-20 text-blue-500" />
            </div>
          </div>

          {/* Healthy */}
          <div className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800/50 flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-emerald-500/10 p-2 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                <CheckCircle className="size-5 text-emerald-500" />
              </div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                Status: Healthy
              </span>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white mb-0.5">
                {summaryStats.healthy.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {summaryStats.total > 0
                  ? ((summaryStats.healthy / summaryStats.total) * 100).toFixed(
                      1,
                    )
                  : 0}
                % of total infrastructure
              </p>
            </div>
            <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:opacity-20 transition-all">
              <CheckCircle className="size-20 text-emerald-500" />
            </div>
          </div>

          {/* Attention */}
          <div className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800/50 flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-amber-500/10 p-2 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                <AlertTriangle className="size-5 text-amber-500" />
              </div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                Needs Attention
              </span>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white mb-0.5">
                {summaryStats.attention.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {/* Minor technical warnings */}
                {summaryStats.total > 0
                  ? ((summaryStats.attention / summaryStats.total) * 100).toFixed(
                      1,
                    )
                  : 0}
                % of total issues
              </p>
            </div>
            <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:opacity-20 transition-all">
              <AlertTriangle className="size-20 text-amber-500" />
            </div>
          </div>

          {/* Critical */}
          <div className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800/50 flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-rose-500/10 p-2 rounded-lg group-hover:bg-rose-500/20 transition-colors">
                <XCircle className="size-5 text-rose-500" />
              </div>
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                Critical Failure
              </span>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white mb-0.5">
                {summaryStats.critical.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {/* Priority intervention required */}
                {summaryStats.total > 0
                  ? ((summaryStats.critical / summaryStats.attention) * 100).toFixed(
                      1,
                    )
                  : 0}
                % of critical issues
              </p>
            </div>
            <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:opacity-20 transition-all">
              <XCircle className="size-20 text-rose-500" />
            </div>
          </div>
        </div>

        {/* Filters & Content */}
        <Tabs defaultValue="all" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/40 p-2 rounded-2xl border border-slate-800/60 backdrop-blur-sm">
            <TabsList className="bg-slate-950/50 p-1 border border-slate-800/50 rounded-xl h-12">
              <TabsTrigger
                value="all"
                className="rounded-lg data-[state=active]:bg-slate-800 data-[state=active]:text-white transition-all px-6"
              >
                All Units ({filteredNVRList.length})
              </TabsTrigger>
              <TabsTrigger
                value="problem"
                className="rounded-lg data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 transition-all px-6"
              >
                Problematic ({problemNVRs.length})
              </TabsTrigger>
              <TabsTrigger
                value="normal"
                className="rounded-lg data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 transition-all px-6"
              >
                Healthy ({normalNVRs.length})
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                <Input
                  placeholder="Search NVR, Location..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 h-10 bg-slate-950/50 border-slate-800 focus:border-blue-500/50 text-slate-200 rounded-xl transition-all"
                />
              </div>
              <Select
                value={selectedDistrict}
                onValueChange={handleDistrictChange}
              >
                <SelectTrigger className="w-40 h-10 bg-slate-950/50 border-slate-800 text-slate-200 rounded-xl">
                  <SelectValue placeholder="District" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                  <SelectItem value="all">All Districts</SelectItem>
                  {districts.map((d) => (
                    <SelectItem key={d} value={d}>
                    {d} 
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="all" className="space-y-3">
            {renderTableHeader()}
            <div className="space-y-3">
              {getPaginatedItems(filteredNVRList).map((nvr) =>
                renderNVRRow(nvr),
              )}
            </div>
            <Pagination items={filteredNVRList} label="units" />
          </TabsContent>

          <TabsContent value="problem" className="space-y-3">
            {renderTableHeader()}
            <div className="space-y-3">
              {getPaginatedItems(problemNVRs).map((nvr) => renderNVRRow(nvr))}
            </div>
            {problemNVRs.length === 0 && (
              <div className="py-20 text-center bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
                <CheckCircle className="size-16 mx-auto text-green-500/20 mb-4" />
                <h3 className="text-xl font-bold text-slate-300">
                  All Systems Normal
                </h3>
                <p className="text-slate-500 text-sm mt-1">
                  No critical issues detected in the selected district.
                </p>
              </div>
            )}
            <Pagination items={problemNVRs} label="problem units" />
          </TabsContent>

          <TabsContent value="normal" className="space-y-3">
            {renderTableHeader()}
            <div className="space-y-3">
              {getPaginatedItems(normalNVRs).map((nvr) => renderNVRRow(nvr))}
            </div>
            <Pagination items={normalNVRs} label="healthy units" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );

  function renderTableHeader() {
    return (
      <div className="px-6 py-3 bg-[#0f172a]/40 border border-slate-800/40 rounded-xl mb-2">
        <div className="grid grid-cols-12 gap-4 items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <div className="col-span-3">NVR / Node Identity</div>
          <div className="col-span-1">District</div>
          <div className="col-span-5 text-center">Infrastructure Check</div>
          <div className="col-span-3 text-right">Capacity / Health</div>
        </div>
      </div>
    );
  }
}
