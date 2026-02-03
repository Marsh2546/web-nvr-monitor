import { useState, useRef, useEffect } from "react";
import { NVRStatus } from "@/app/types/nvr";
import {
  fetchNVRStatusHistory,
  fetchNVRSnapshots,
  NVRSnapshot,
} from "@/app/services/nvrHistoryService";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { cn } from "@/app/components/ui/utils";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar,
  Server,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Wifi,
  HardDrive,
  Camera,
  Eye,
  LogIn,
  Clock,
  ChevronsLeft,
  ChevronsRight,
  X,
} from "lucide-react";
import { DayPicker } from "react-day-picker";
import { th } from "date-fns/locale";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/app/components/ui/dialog";

// Animated Number Component
const AnimatedNumber = ({
  value,
  duration = 1000,
}: {
  value: number;
  duration?: number;
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);

  useEffect(() => {
    const startValue = prevValueRef.current;
    const endValue = value;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.round(
        startValue + (endValue - startValue) * easeOutQuart,
      );

      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValueRef.current = endValue;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{displayValue.toLocaleString()}</>;
};

interface NVRStatusPageProps {
  nvrList: NVRStatus[];
  onPageChange: (page: "dashboard" | "status") => void;
}

export function NVRStatusPage({ nvrList, onPageChange }: NVRStatusPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [selectedIssueType, setSelectedIssueType] = useState<string>("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

  // Sort states
  const [sortField, setSortField] = useState<string>("nvr");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Supabase states
  const [supabaseData, setSupabaseData] = useState<NVRStatus[]>([]);
  const [isLoadingSupabase, setIsLoadingSupabase] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  // Chart data state
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(false);

  // Snapshots state
  const [snapshots, setSnapshots] = useState<Record<string, NVRSnapshot[]>>({});
  const [loadingSnapshots, setLoadingSnapshots] = useState<
    Record<string, boolean>
  >({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // 28/1/2026
  const formatThaiDate = (date: Date) => {
    const thaiDays = [
      "อาทิตย์",
      "จันทร์",
      "อังคาร",
      "พุธ",
      "พฤหัสบดี",
      "ศุกร์",
      "เสาร์",
    ];
    const thaiMonths = [
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม",
    ];

    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543; // แปลงเป็นพ.ศ.

    return `${day} ${month} ${year}`;
  };

  // Calculate popup position
  const updatePopupPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPopupPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.right - 250 + window.scrollX, // 250px is approximate calendar width
      });
    }
  };

  const handleToggleDatePicker = () => {
    if (!showDatePicker) {
      updatePopupPosition();
    }
    setShowDatePicker(!showDatePicker);
  };

  // Fetch chart data for all dates
  useEffect(() => {
    const fetchChartData = async () => {
      setIsLoadingChart(true);
      try {
        // Get data for the last 30 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const startISO = startDate.toISOString();
        const endISO = endDate.toISOString();

        const data = await fetchNVRStatusHistory(startISO, endISO);

        // Group by date and calculate stats
        const dateStats = new Map<
          string,
          {
            healthy: number;
            critical: number;
            attention: number;
          }
        >();

        data.forEach((nvr) => {
          const date = nvr.date_updated.split("T")[0];
          if (!dateStats.has(date)) {
            dateStats.set(date, { healthy: 0, critical: 0, attention: 0 });
          }

          const stats = dateStats.get(date)!;
          if (!hasIssues(nvr)) {
            stats.healthy++;
          } else if (hasCriticalIssues(nvr)) {
            stats.critical++;
          } else if (hasAttentionIssues(nvr)) {
            stats.attention++;
          }
        });

        // Convert to chart data format
        const chartDataArray = Array.from(dateStats.entries())
          .map(([date, stats]) => {
            const dateObj = new Date(date);
            return {
              date: dateObj.toLocaleDateString("th-TH", {
                day: "numeric",
                month: "short",
              }),
              fullDate: date,
              healthy: stats.healthy,
              critical: stats.critical,
              attention: stats.attention,
              total: stats.healthy + stats.critical + stats.attention,
            };
          })
          .sort(
            (a, b) =>
              new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime(),
          );

        setChartData(chartDataArray);
      } catch (error) {
        console.error("Error fetching chart data:", error);
      } finally {
        setIsLoadingChart(false);
      }
    };

    fetchChartData();
  }, []);

  // Close date picker when scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (showDatePicker) {
        setShowDatePicker(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showDatePicker]);

  // Fetch data from Supabase when date changes
  useEffect(() => {
    const fetchSupabaseData = async () => {
      setIsLoadingSupabase(true);
      setSupabaseError(null);

      try {
        // Create date range for the entire day in local timezone
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Convert to ISO strings for Supabase query
        const startDate = startOfDay.toISOString();
        const endDate = endOfDay.toISOString();

        console.log("Fetching data for date range:", {
          selectedDate: selectedDate.toDateString(),
          startDate,
          endDate,
        });

        const data = await fetchNVRStatusHistory(startDate, endDate);
        setSupabaseData(data);
      } catch (error) {
        console.error("Error fetching Supabase data:", error);
        setSupabaseError("Failed to fetch data from Supabase");
      } finally {
        setIsLoadingSupabase(false);
      }
    };

    fetchSupabaseData();
  }, [selectedDate]);

  // Initial load on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingSupabase(true);
      setSupabaseError(null);

      try {
        // Create date range for the entire day in local timezone
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Convert to ISO strings for Supabase query
        const startDate = startOfDay.toISOString();
        const endDate = endOfDay.toISOString();

        console.log("Initial load - Fetching data for date range:", {
          selectedDate: selectedDate.toDateString(),
          startDate,
          endDate,
        });

        const data = await fetchNVRStatusHistory(startDate, endDate);
        setSupabaseData(data);
      } catch (error) {
        console.error("Error fetching initial Supabase data:", error);
        setSupabaseError("Failed to fetch data from Supabase");
      } finally {
        setIsLoadingSupabase(false);
      }
    };

    fetchInitialData();
  }, []); // Empty dependency array means this runs only once on mount

  // Get unique districts from Supabase data
  const districts = Array.from(
    new Set(supabaseData.map((nvr) => nvr.district)),
  ).sort();

  // Check if NVR has critical issues based on hierarchy
  const hasCriticalIssues = (nvr: NVRStatus) => {
    return (
      !nvr.ping_onu || // ONU Down - affects everything below
      !nvr.ping_nvr || // NVR Down - affects HDD, Camera, Login
      !nvr.hdd_status || // HDD Down - affects Camera, Login
      !nvr.normal_view // Camera Down - affects Login
    );
  };

  // Check if NVR has attention issues (Login problem only when no critical issues)
  const hasAttentionIssues = (nvr: NVRStatus) => {
    return !hasCriticalIssues(nvr) && !nvr.check_login; // Login problem only
  };

  // Get issue status with hierarchy
  const getIssueStatus = (nvr: NVRStatus) => {
    if (!nvr.ping_onu) return "onu"; // ONU Down - highest priority
    if (!nvr.ping_nvr) return "nvr"; // NVR Down
    if (!nvr.hdd_status) return "hdd"; // HDD Down
    if (!nvr.normal_view) return "view"; // Camera Down
    if (!nvr.check_login) return "login"; // Login Problem
    return "healthy"; // No issues
  };

  // Check if NVR has any issues (for backward compatibility)
  const hasIssues = (nvr: NVRStatus) => {
    return hasCriticalIssues(nvr) || hasAttentionIssues(nvr);
  };

  // Get issue count (for display purposes only)
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
  const toggleRow = async (id: string, nvrName: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);

      // Always fetch fresh snapshots for the current selected date when expanding
      setLoadingSnapshots((prev) => ({ ...prev, [id]: true }));
      try {
        // Create date range for the entire day in local timezone
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Convert to ISO strings for fetchNVRSnapshots query
        const startDate = startOfDay.toISOString();
        const endDate = endOfDay.toISOString();

        console.log(`Fetching snapshots for ${nvrName} for date range:`, {
          startDate,
          endDate,
        });

        const data = await fetchNVRSnapshots(nvrName, startDate, endDate);
        setSnapshots((prev) => ({ ...prev, [id]: data }));
      } catch (error) {
        console.error("Error fetching snapshots:", error);
      } finally {
        setLoadingSnapshots((prev) => ({ ...prev, [id]: false }));
      }
    }
    setExpandedRows(newExpanded);
  };

  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sort function
  const sortItems = (items: NVRStatus[]) => {
    return [...items].sort((a, b) => {
      let aValue: any = a[sortField as keyof NVRStatus];
      let bValue: any = b[sortField as keyof NVRStatus];

      // Handle special cases
      if (sortField === "issueCount") {
        aValue = getIssueCount(a);
        bValue = getIssueCount(b);
      }

      // Handle string comparison
      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  };

  // Check specific issue types based on hierarchy
  const hasSpecificIssue = (nvr: NVRStatus, issueType: string) => {
    const status = getIssueStatus(nvr);
    
    switch (issueType) {
      case 'onu':
        return status === "onu"; // Only show if ONU is the root cause
      case 'nvr':
        return status === "nvr"; // Only show if NVR is the root cause
      case 'hdd':
        return status === "hdd"; // Only show if HDD is the root cause
      case 'view':
        return status === "view"; // Only show if Camera is the root cause
      case 'login':
        return status === "login"; // Only show if Login is the root cause
      default:
        return false;
    }
  };

  // Filter NVR list from Supabase data
  const filteredNVRList = sortItems(
    supabaseData.filter((nvr) => {
      const matchesSearch =
        nvr.nvr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nvr.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nvr.district.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDistrict = selectedDistrict === "all" || nvr.district === selectedDistrict;
      
      // Filter by specific issue type
      let matchesIssueType = true;
      if (selectedIssueType !== "all") {
        matchesIssueType = hasSpecificIssue(nvr, selectedIssueType);
      }
      
      return matchesSearch && matchesDistrict && matchesIssueType;
    })
  );

  const normalNVRs = filteredNVRList.filter((nvr) => !hasIssues(nvr));
  const problemNVRs = filteredNVRList.filter((nvr) => hasIssues(nvr));

  // Separate critical and attention issues based on new logic
  const criticalNVRs = filteredNVRList.filter((nvr) => hasCriticalIssues(nvr));
  const attentionNVRs = filteredNVRList.filter(
    (nvr) => hasAttentionIssues(nvr) && !hasCriticalIssues(nvr),
  );

  // Calculate summary stats for the cards
  const summaryStats = {
    total: supabaseData.length,
    healthy: supabaseData.filter((nvr) => !hasIssues(nvr)).length,
    attention: supabaseData.filter(
      (nvr) => hasAttentionIssues(nvr) && !hasCriticalIssues(nvr),
    ).length,
    critical: supabaseData.filter((nvr) => hasCriticalIssues(nvr)).length,
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

  const handleIssueTypeChange = (value: string) => {
    setSelectedIssueType(value);
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

  // Get status color for individual components based on hierarchy
  const getComponentStatus = (nvr: NVRStatus, component: string) => {
    const issueStatus = getIssueStatus(nvr);
    
    // If this component is the root cause, show it as failed
    if (component === "onu" && issueStatus === "onu") return "failed";
    if (component === "nvr" && issueStatus === "nvr") return "failed";
    if (component === "hdd" && issueStatus === "hdd") return "failed";
    if (component === "view" && issueStatus === "view") return "failed";
    if (component === "login" && issueStatus === "login") return "failed";
    
    // If this component is affected by a higher level failure, show it as affected
    if (component === "nvr" && issueStatus === "onu") return "affected";
    if (component === "hdd" && (issueStatus === "onu" || issueStatus === "nvr")) return "affected";
    if (component === "view" && (issueStatus === "onu" || issueStatus === "nvr" || issueStatus === "hdd")) return "affected";
    if (component === "login" && issueStatus !== "healthy") return "affected";
    
    return "normal";
  };

  // Get component styling based on status
  const getComponentStyling = (status: string) => {
    switch (status) {
      case "failed":
        return "bg-red-500/5 border-red-500/20 shadow-[inset_0_0_10px_rgba(239,68,68,0.05)]";
      case "affected":
        return "bg-orange-500/5 border-orange-500/20 shadow-[inset_0_0_10px_rgba(251,146,60,0.05)]";
      default:
        return "bg-slate-950/40 border-slate-800";
    }
  };

  // Get component icon color
  const getComponentIconColor = (status: string) => {
    switch (status) {
      case "failed": return "text-red-400";
      case "affected": return "text-orange-400";
      default: return "text-slate-500";
    }
  };

  // Status icon component
  const StatusIcon = ({ status }: { status: boolean }) =>
    status ? (
      <CheckCircle className="size-5 text-green-500" />
    ) : (
      <XCircle className="size-5 text-red-500" />
    );

  const renderNVRRow = (nvr: NVRStatus) => {
    const issueStatus = getIssueStatus(nvr);
    const isCritical = hasCriticalIssues(nvr);
    const isAttention = hasAttentionIssues(nvr);
    const isNormal = !hasIssues(nvr);
    const isExpanded = expandedRows.has(nvr.id);

    // Determine color based on hierarchy
    const getStatusColor = () => {
      switch (issueStatus) {
        case "onu": return "border-red-500/40 bg-red-500/5 hover:bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.15)]";
        case "nvr": return "border-orange-500/40 bg-orange-500/5 hover:bg-orange-500/10 shadow-[0_0_15px_rgba(251,146,60,0.15)]";
        case "hdd": return "border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.15)]";
        case "view": return "border-yellow-500/40 bg-yellow-500/5 hover:bg-yellow-500/10 shadow-[0_0_15px_rgba(234,179,8,0.15)]";
        case "login": return "border-lime-500/40 bg-lime-500/5 hover:bg-lime-500/10 shadow-[0_0_15px_rgba(163,230,53,0.15)]";
        default: return "border-slate-800 bg-slate-900/40 hover:bg-slate-900/60";
      }
    };

    return (
      <div
        key={nvr.id}
        className={cn(
          "border rounded-xl transition-all duration-300 overflow-hidden",
          getStatusColor()
        )}
      >
        {/* Main Row - Compact */}
        <div
          className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => toggleRow(nvr.id, nvr.nvr)}
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
                    className={`size-4 ${getComponentStatus(nvr, "onu") === "normal" ? "text-green-500" : 
                      getComponentStatus(nvr, "onu") === "failed" ? "text-red-500" : "text-orange-500"}`}
                  />
                  <span className="text-[10px] text-muted-foreground">ONU</span>
                </div>
                <div
                  className="flex flex-col items-center gap-0.5"
                  title="NVR Ping"
                >
                  <Server
                    className={`size-4 ${getComponentStatus(nvr, "nvr") === "normal" ? "text-green-500" : 
                      getComponentStatus(nvr, "nvr") === "failed" ? "text-red-500" : "text-orange-500"}`}
                  />
                  <span className="text-[10px] text-muted-foreground">NVR</span>
                </div>
                <div
                  className="flex flex-col items-center gap-0.5"
                  title="HDD Status"
                >
                  <HardDrive
                    className={`size-4 ${getComponentStatus(nvr, "hdd") === "normal" ? "text-green-500" : 
                      getComponentStatus(nvr, "hdd") === "failed" ? "text-red-500" : "text-orange-500"}`}
                  />
                  <span className="text-[10px] text-muted-foreground">HDD</span>
                </div>
                <div
                  className="flex flex-col items-center gap-0.5"
                  title="Normal View"
                >
                  <Eye
                    className={`size-4 ${getComponentStatus(nvr, "view") === "normal" ? "text-green-500" : 
                      getComponentStatus(nvr, "view") === "failed" ? "text-red-500" : "text-orange-500"}`}
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
                    className={`size-4 ${getComponentStatus(nvr, "login") === "normal" ? "text-green-500" : 
                      getComponentStatus(nvr, "login") === "failed" ? "text-red-500" : "text-orange-500"}`}
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
                  className={cn(
                    "text-[10px] font-bold px-2 py-0 h-6",
                    isCritical
                      ? "bg-red-500/20 text-red-400 border-red-500/30"
                      : "bg-amber-500/20 text-amber-400 border-amber-500/30",
                  )}
                >
                  {isCritical ? "CRITICAL" : "ATTENTION"}
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
                    getComponentStyling(getComponentStatus(nvr, "onu"))
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      ONU GATEWAY
                    </span>
                    <StatusIcon status={getComponentStatus(nvr, "onu") === "normal"} />
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
                    getComponentStyling(getComponentStatus(nvr, "nvr"))
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      NVR TERMINAL
                    </span>
                    <StatusIcon status={getComponentStatus(nvr, "nvr") === "normal"} />
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
                    Storage & Login
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div
                    className={cn(
                      "p-3 rounded-xl border flex items-center justify-between transition-all",
                      getComponentStyling(getComponentStatus(nvr, "hdd"))
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "size-2 rounded-full",
                          getComponentStatus(nvr, "hdd") === "normal" ? "bg-green-500" : 
                          getComponentStatus(nvr, "hdd") === "failed" ? "bg-red-500" : "bg-orange-500"
                        )}
                      ></div>
                      <span className="text-xs font-bold text-slate-300">
                        HDD DRIVE STATUS
                      </span>
                    </div>
                    <HardDrive
                      className={cn(
                        "size-4",
                        getComponentIconColor(getComponentStatus(nvr, "hdd"))
                      )}
                    />
                  </div>

                  <div
                    className={cn(
                      "p-3 rounded-xl border flex items-center justify-between transition-all",
                      getComponentStyling(getComponentStatus(nvr, "view"))
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "size-2 rounded-full",
                          getComponentStatus(nvr, "view") === "normal" ? "bg-green-500" : 
                          getComponentStatus(nvr, "view") === "failed" ? "bg-red-500" : "bg-orange-500"
                        )}
                      ></div>
                      <span className="text-xs font-bold text-slate-300">
                        CAMERA VIEW
                      </span>
                    </div>
                    <Eye
                      className={cn(
                        "size-4",
                        getComponentIconColor(getComponentStatus(nvr, "view"))
                      )}
                    />
                  </div>

                  <div
                    className={cn(
                      "p-3 rounded-xl border flex items-center justify-between transition-all",
                      getComponentStyling(getComponentStatus(nvr, "login"))
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "size-2 rounded-full",
                          getComponentStatus(nvr, "login") === "normal" ? "bg-green-500" : 
                          getComponentStatus(nvr, "login") === "failed" ? "bg-red-500" : "bg-orange-500"
                        )}
                      ></div>
                      <span className="text-xs font-bold text-slate-300">
                        SYSTEM LOGIN
                      </span>
                    </div>
                    <LogIn
                      className={cn(
                        "size-4",
                        getComponentIconColor(getComponentStatus(nvr, "login"))
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
                    <span>
                      LAST TELEMETRY:{" "}
                      {nvr.date_updated
                        ? new Date(nvr.date_updated).toLocaleString("th-TH", {
                            timeZone: "Asia/Bangkok",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Snapshots Section */}
            <div className="mt-6 border-t border-slate-800/60 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="size-6 rounded-md bg-indigo-500/20 flex items-center justify-center">
                  <Camera className="size-3.5 text-indigo-400" />
                </div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Camera Snapshots
                </h4>
                {loadingSnapshots[nvr.id] && (
                  <span className="text-xs text-slate-500 animate-pulse ml-2">
                    Loading snapshots...
                  </span>
                )}
              </div>

              {snapshots[nvr.id] && snapshots[nvr.id].length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {snapshots[nvr.id].map((snap) => (
                    <div
                      key={snap.id}
                      className="group relative aspect-video bg-black rounded-lg overflow-hidden border border-slate-800 cursor-pointer"
                      onClick={() => setSelectedImage(snap.image_url)}
                    >
                      {snap.image_url ? (
                        <img
                          src={snap.image_url}
                          alt={snap.camera_name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-900/50">
                          <Camera className="size-8 opacity-20" />
                          <span className="text-[10px] mt-2">No Image</span>
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-6 pointer-events-none">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white text-shadow-sm">
                            {snap.camera_name}
                          </span>
                          {snap.snapshot_status === "TRUE" && (
                            <Badge className="h-4 px-1 text-[8px] bg-green-500/80 text-white border-none">
                              Active
                            </Badge>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                          {new Date(snap.recorded_at).toLocaleString("th-TH")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                !loadingSnapshots[nvr.id] && (
                  <div className="text-center py-8 text-slate-500 bg-slate-900/20 rounded-xl border border-dashed border-slate-800">
                    <p className="text-sm">
                      No snapshots available for this NVR.
                    </p>
                    <p className="text-xs opacity-60 mt-1">
                      Snapshots are updated daily at midnight.
                    </p>
                  </div>
                )
              )}
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
          <div className="flex items-center gap-3 bg-slate-900/40 px-4 py-2 rounded-xl border border-slate-800/60 backdrop-blur-sm relative">
            <label className="text-xs font-mono text-slate-300">Date:</label>
            <button
              ref={buttonRef}
              onClick={handleToggleDatePicker}
              className="text-xs font-mono text-slate-300 hover:text-blue-400 transition-colors cursor-pointer flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50 hover:bg-slate-700/50"
            >
              <Calendar className="size-3.5" />
              {formatThaiDate(selectedDate)}
            </button>
          </div>
        </div>

        {/* Calendar Popup - Fixed Position */}
        {showDatePicker && (
          <div
            className="fixed bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-4 z-[9999]"
            style={{
              top: `${popupPosition.top}px`,
              left: `${popupPosition.left}px`,
            }}
          >
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  setSelectedDate(date);
                  setShowDatePicker(false);
                }
              }}
              locale={th}
              className="text-slate-200"
              classNames={{
                months:
                  "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium text-slate-300",
                nav: "space-x-1 flex items-center",
                nav_button:
                  "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-slate-300",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell:
                  "text-slate-400 rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-slate-800/50 [&:has([aria-selected])]:bg-slate-700 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-9 w-9 p-0 font-normal text-slate-300 hover:bg-slate-700 rounded-md",
                day_range_end: "day-range-end",
                day_selected:
                  "bg-blue-600 text-white hover:bg-blue-600 focus:bg-blue-600",
                day_today: "bg-slate-800 text-white",
                day_outside: "day-outside text-slate-600 opacity-50",
                day_disabled: "text-slate-500 opacity-50",
                day_range_middle:
                  "aria-selected:bg-slate-700 aria-selected:text-slate-300",
                day_hidden: "invisible",
              }}
            />
          </div>
        )}

        {/* Close overlay when clicking outside */}
        {showDatePicker && (
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setShowDatePicker(false)}
          />
        )}

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
                <AnimatedNumber value={summaryStats.total} />
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Total NVR Devices
              </p>
            </div>
            <div className="absolute -right-2 -bottom-2 opacity-5 grayscale group-hover:grayscale-0 group-hover:opacity-20 group-hover:drop-shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300">
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
                Status: Online
              </span>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white mb-0.5">
                <AnimatedNumber value={summaryStats.healthy} />
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {summaryStats.total > 0
                  ? ((summaryStats.healthy / summaryStats.total) * 100).toFixed(
                      1,
                    )
                  : 0}
                % of Working Normally
              </p>
            </div>
            <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:opacity-20 group-hover:drop-shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all duration-300">
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
                Status: No Access
              </span>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white mb-0.5">
                <AnimatedNumber value={summaryStats.attention} />
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {summaryStats.total > 0
                  ? (
                      (summaryStats.attention / summaryStats.total) *
                      100
                    ).toFixed(1)
                  : 0}
                % of Cannot Access
              </p>
            </div>
            <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:opacity-20 group-hover:drop-shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all duration-300">
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
                Status: Down
              </span>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white mb-0.5">
                <AnimatedNumber value={summaryStats.critical} />
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {/* Priority intervention required */}
                {summaryStats.total > 0
                  ? (
                      (summaryStats.critical / summaryStats.attention) *
                      100
                    ).toFixed(1)
                  : 0}
                % of System Down
              </p>
            </div>
            <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:opacity-20 group-hover:drop-shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all duration-300">
              <XCircle className="size-20 text-rose-500" />
            </div>
          </div>
        </div>

        {/* Status Trend Chart */}
        <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800/50 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white mb-1 uppercase tracking-tight">
                Status Trend - Last 30 Days
              </h3>
              <p className="text-xs text-slate-500">
                Daily NVR status distribution over time
              </p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-green-500" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Online
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-red-500" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Down
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-amber-500" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  No Access
                </span>
              </div>
            </div>
          </div>

          <div className="h-[320px] w-full">
            {isLoadingChart ? (
              <div className="flex items-center justify-center h-full text-slate-500">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-xs">Loading chart data...</p>
                </div>
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500">
                <div className="text-center">
                  <LineChart className="size-12 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No chart data available</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#3e4651"
                    vertical={true}
                    opacity={30}
                  />

                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={10}
                    fontWeight={500}
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    fontWeight={500}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: "12px",
                      padding: "12px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    itemStyle={{ fontSize: "12px", fontWeight: 500 }}
                    labelStyle={{
                      fontSize: "11px",
                      color: "#94a3b8",
                      marginBottom: "4px",
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="healthy"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2 }}
                    name="Healthy"
                  />

                  <Line
                    type="monotone"
                    dataKey="critical"
                    stroke="#ef4444"
                    strokeWidth={3}
                    dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "#ef4444", strokeWidth: 2 }}
                    name="Critical"
                  />

                  <Line
                    type="monotone"
                    dataKey="attention"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "#f59e0b", strokeWidth: 2 }}
                    name="Attention"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
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
                value="normal"
                className="rounded-lg data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 transition-all px-6"
              >
                Healthy ({normalNVRs.length})
              </TabsTrigger>
              <TabsTrigger
                value="problem"
                className="rounded-lg data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 transition-all px-6"
              >
                Problematic ({problemNVRs.length})
              </TabsTrigger>
              <TabsTrigger
                value="critical"
                className="rounded-lg data-[state=active]:bg-red-600/20 data-[state=active]:text-red-500 transition-all px-6"
              >
                Critical ({criticalNVRs.length})
              </TabsTrigger>
              <TabsTrigger
                value="attention"
                className="rounded-lg data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 transition-all px-6"
              >
                Attention ({attentionNVRs.length})
              </TabsTrigger>
            </TabsList>

             <div className="flex gap-3 w-full">
              <div className="relative flex-1">
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
                <SelectTrigger className="w-36 h-10 bg-slate-950/50 border-slate-800 text-slate-200 rounded-xl">
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
              <Select
                value={selectedIssueType}
                onValueChange={handleIssueTypeChange}
              >
                <SelectTrigger className="w-36 h-10 bg-slate-950/50 border-slate-800 text-slate-200 rounded-xl">
                  <SelectValue placeholder="Issue Type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                  <SelectItem value="all">All Issues</SelectItem>
                  <SelectItem value="onu">ONU Down</SelectItem>
                  <SelectItem value="nvr">NVR Down</SelectItem>
                  <SelectItem value="hdd">HDD Failure</SelectItem>
                  <SelectItem value="view">Camera Down</SelectItem>
                  <SelectItem value="login">Login Problem</SelectItem>
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

          <TabsContent value="critical" className="space-y-3">
            {renderTableHeader()}
            <div className="space-y-3">
              {getPaginatedItems(criticalNVRs).map((nvr) => renderNVRRow(nvr))}
            </div>
            {criticalNVRs.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle className="size-12 mx-auto mb-3 text-green-500" />
                <p className="text-lg font-medium">No Critical Issues Found</p>
                <p className="text-sm mt-1">
                  All systems are operating within acceptable parameters
                </p>
              </div>
            )}
            <Pagination items={criticalNVRs} label="critical units" />
          </TabsContent>

          <TabsContent value="attention" className="space-y-3">
            {renderTableHeader()}
            <div className="space-y-3">
              {getPaginatedItems(attentionNVRs).map((nvr) => renderNVRRow(nvr))}
            </div>
            {attentionNVRs.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle className="size-12 mx-auto mb-3 text-green-500" />
                <p className="text-lg font-medium">No Attention Issues Found</p>
                <p className="text-sm mt-1">
                  All systems are operating normally
                </p>
              </div>
            )}
            <Pagination items={attentionNVRs} label="attention units" />
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

      {/* Big Image Viewer Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
            <button
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-md"
              onClick={() => setSelectedImage(null)}
            >
              <X className="size-6" />
            </button>
            <img
              src={selectedImage}
              alt="CCTV Snapshot"
              className="w-full h-full object-contain animate-in zoom-in-95 duration-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );

  function renderTableHeader() {
    const getSortIcon = (field: string) => {
      if (sortField !== field) {
        return <ChevronUp className="size-3 opacity-40" />;
      }
      return sortDirection === "asc" ? (
        <ChevronUp className="size-3 opacity-100" />
      ) : (
        <ChevronDown className="size-3 opacity-100" />
      );
    };

    return (
      <div className="px-6 py-3 bg-[#0f172a]/40 border border-slate-800/40 rounded-xl mb-2">
        <div className="grid grid-cols-12 gap-4 items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <div
            className="col-span-3 flex items-center gap-1 cursor-pointer hover:text-slate-300 transition-colors"
            onClick={() => handleSort("nvr")}
          >
            NVR / Node Identity
            {getSortIcon("nvr")}
          </div>
          <div
            className="col-span-1 flex items-center gap-1 cursor-pointer hover:text-slate-300 transition-colors"
            onClick={() => handleSort("district")}
          >
            District
            {getSortIcon("district")}
          </div>
          <div className="col-span-5 text-center">Infrastructure Check</div>
          <div
            className="col-span-3 text-right flex items-center justify-end gap-1 cursor-pointer hover:text-slate-300 transition-colors"
            onClick={() => handleSort("issueCount")}
          >
            Issues / Health
            {getSortIcon("issueCount")}
          </div>
        </div>
      </div>
    );
  }
}
