import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Wifi,
  Server,
  HardDrive,
  Eye,
  LogIn,
  List,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Info,
} from "lucide-react";
import { fetchNVRStatusHistory } from "@/app/services/nvrHistoryService";
import { NVRStatus } from "@/app/types/nvr";

interface CriticalIssue {
  nvrId: string;
  nvrName: string;
  district: string;
  location: string;
  issueType: string;
  issueIcon: React.ReactNode;
  occurrences: number;
  days: number;
  percentageChange: number;
  trend: "up" | "down" | "stable";
  lastSeen: string;
}

interface CriticalIssuesAnalysisProps {
  className?: string;
}

const CriticalIssuesAnalysis: React.FC<{ className?: string }> = ({
  className,
}) => {
  const [criticalIssues, setCriticalIssues] = useState<CriticalIssue[]>([]);
  const [allCriticalIssues, setAllCriticalIssues] = useState<CriticalIssue[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "chart">("table");
  const [timeRange, setTimeRange] = useState<"3days" | "7days">("3days");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate effective status based on new condition logic
  const calculateEffectiveStatus = (nvr: NVRStatus) => {
    const status = {
      onu: nvr.ping_onu,
      nvr: nvr.ping_nvr,
      hdd: nvr.hdd_status,
      login: nvr.check_login,
      normal_view: nvr.normal_view,
    };

    // ONU_STATUS condition
    if (!status.onu) {
      status.nvr = false;
      status.hdd = false;
      status.login = false;
      status.normal_view = false;
      return status;
    }

    // NVR_STATUS condition
    if (!status.nvr) {
      status.hdd = false;
      status.login = false;
      status.normal_view = false;
      return status;
    }

    // HDD_STATUS condition (only check if ONU and NVR are online)
    if (status.onu && status.nvr) {
      status.hdd = nvr.hdd_status; // Use actual HDD status
    } else {
      status.hdd = false;
    }

    // LOGIN_STATUS condition
    status.login = status.nvr; // Login true if NVR is online

    // NORMAL_VIEW_STATUS condition
    status.normal_view = nvr.normal_view;

    return status;
  };

  // Get issue status with new hierarchy
  const getIssueStatus = (nvr: NVRStatus) => {
    const status = calculateEffectiveStatus(nvr);
    if (!status.onu) return "ONU";
    if (!status.nvr) return "NVR";
    if (!status.hdd) return "HDD";
    if (!status.normal_view) return "VIEW";
    if (!status.login) return "LOGIN";
    return "HEALTHY";
  };

  // Check if NVR has critical issues
  const hasCriticalIssues = (nvr: NVRStatus) => {
    const status = calculateEffectiveStatus(nvr);
    return (
      !status.onu || // ONU Down
      !status.nvr || // NVR Down
      !status.hdd // HDD Down
    );
  };

  // Get issue icon and label
  const getIssueInfo = (issueType: string) => {
    switch (issueType) {
      case "onu":
        return {
          icon: <Wifi className="size-4" />,
          label: "ONU Down",
          color: "text-red-500",
        };
      case "nvr":
        return {
          icon: <Server className="size-4" />,
          label: "NVR Down",
          color: "text-red-500",
        };
      case "hdd":
        return {
          icon: <HardDrive className="size-4" />,
          label: "HDD Failure",
          color: "text-orange-500",
        };
      case "view":
        return {
          icon: <Eye className="size-4" />,
          label: "View Down",
          color: "text-yellow-500",
        };
      case "login":
        return {
          icon: <LogIn className="size-4" />,
          label: "Login Problem",
          color: "text-yellow-500",
        };
      default:
        return {
          icon: <AlertTriangle className="size-4" />,
          label: "Unknown",
          color: "text-gray-500",
        };
    }
  };

  // Fetch and analyze critical issues
  useEffect(() => {
    const analyzeCriticalIssues = async () => {
      setIsLoading(true);
      try {
        const endDate = new Date();
        const startDate = new Date();

        if (timeRange === "3days") {
          startDate.setDate(endDate.getDate() - 3);
        } else {
          startDate.setDate(endDate.getDate() - 7);
        }

        const historyData = await fetchNVRStatusHistory(
          startDate.toISOString().split("T")[0],
          endDate.toISOString().split("T")[0],
        );

        // Group issues by NVR and issue type
        const issueMap = new Map<
          string,
          {
            nvrId: string;
            nvrName: string;
            district: string;
            location: string;
            issueType: string;
            occurrences: number;
            dates: string[];
            lastSeen: string;
          }
        >();

        historyData.forEach((nvr) => {
          if (hasCriticalIssues(nvr)) {
            const issueType = getIssueStatus(nvr);
            const key = `${nvr.id}-${issueType}`;

            if (!issueMap.has(key)) {
              issueMap.set(key, {
                nvrId: nvr.id,
                nvrName: nvr.nvr,
                district: nvr.district,
                location: nvr.location,
                issueType,
                occurrences: 0,
                dates: [],
                lastSeen: nvr.date_updated,
              });
            }

            const issue = issueMap.get(key)!;
            issue.occurrences++;
            issue.dates.push(nvr.date_updated);

            if (new Date(nvr.date_updated) > new Date(issue.lastSeen)) {
              issue.lastSeen = nvr.date_updated;
            }
          }
        });

        // Convert to array and calculate percentage change
        const issues: CriticalIssue[] = Array.from(issueMap.values()).map(
          (issue) => {
            const issueInfo = getIssueInfo(issue.issueType);

            // Calculate percentage change (mock calculation for now)
            const percentageChange = Math.floor(Math.random() * 40) - 20; // -20% to +20%
            let trend: "up" | "down" | "stable" = "stable";

            if (percentageChange > 5) trend = "up";
            else if (percentageChange < -5) trend = "down";

            return {
              ...issue,
              issueIcon: issueInfo.icon,
              days: timeRange === "3days" ? 3 : 7,
              percentageChange,
              trend,
            };
          },
        );

        // Sort by occurrences (highest first), then by percentage change
        issues.sort((a, b) => {
          if (b.occurrences !== a.occurrences) {
            return b.occurrences - a.occurrences;
          }
          return Math.abs(b.percentageChange) - Math.abs(a.percentageChange);
        });

        // Store all issues for pagination
        setAllCriticalIssues(issues);

        // Set initial page items (top 10)
        setCriticalIssues(issues.slice(0, itemsPerPage));
      } catch (error) {
        console.error("Error analyzing critical issues:", error);
      } finally {
        setIsLoading(false);
      }
    };

    analyzeCriticalIssues();
  }, [timeRange]);

  // Pagination functions
  const totalPages = Math.ceil(allCriticalIssues.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedIssues = allCriticalIssues.slice(startIndex, endIndex);

  useEffect(() => {
    setCriticalIssues(paginatedIssues);
  }, [currentPage, allCriticalIssues]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () =>
    setCurrentPage((prev) => Math.max(1, prev - 1));
  const goToNextPage = () =>
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));

  // Prepare chart data
  const chartData = useMemo(() => {
    return criticalIssues.map((issue) => ({
      name:
        issue.nvrName.length > 15
          ? issue.nvrName.substring(0, 15) + "..."
          : issue.nvrName,
      occurrences: issue.occurrences,
      percentageChange: issue.percentageChange,
      issueType: issue.issueType,
    }));
  }, [criticalIssues]);

  // Color definitions for issue types
  const colors = {
    ONU: "#dc2626",
    NVR: "#ef4444",
    HDD: "#f97316",
    VIEW: "#eab308",
    LOGIN: "#facc15",
  };

  // Prepare issue type distribution data
  const issueTypeData = useMemo(() => {
    const typeCount = allCriticalIssues.reduce(
      (acc, issue) => {
        acc[issue.issueType] = (acc[issue.issueType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(typeCount).map(([type, count]) => ({
      name: type.toUpperCase(),
      value: count,
      color: colors[type.toUpperCase() as keyof typeof colors] || "#6B7280",
    }));
  }, [allCriticalIssues]);

  // Top affected NVRs
  const topNVRs = useMemo(() => {
    return allCriticalIssues.slice(0, 5).map((issue) => ({
      nvrName: issue.nvrName,
      occurrences: issue.occurrences,
      issueType:
        issue.issueType.charAt(0).toUpperCase() + issue.issueType.slice(1),
    }));
  }, [allCriticalIssues]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-slate-500">Analyzing critical issues...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-500" />
              Critical Issues Analysis
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              ปัญหาระดับ critical ที่เกิดซ้ำในช่วง{" "}
              {timeRange === "3days" ? "3" : "7"} วัน
              {allCriticalIssues.length > 0 && (
                <span className="text-blue-400 ml-2">
                  (ทั้งหมด {allCriticalIssues.length} รายการ)
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800 rounded-lg p-1">
              <Button
                size="sm"
                variant={timeRange === "3days" ? "default" : "ghost"}
                onClick={() => setTimeRange("3days")}
                className="text-xs"
              >
                3 Days
              </Button>
              <Button
                size="sm"
                variant={timeRange === "7days" ? "default" : "ghost"}
                onClick={() => setTimeRange("7days")}
                className="text-xs"
              >
                7 Days
              </Button>
            </div>

            <div className="flex bg-slate-800 rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === "table" ? "default" : "ghost"}
                onClick={() => setViewMode("table")}
                className="text-xs"
              >
                <List className="size-4 mr-1" />
                Table
              </Button>
              <Button
                size="sm"
                variant={viewMode === "chart" ? "default" : "ghost"}
                onClick={() => setViewMode("chart")}
                className="text-xs"
              >
                <BarChart3 className="size-4 mr-1" />
                Chart
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {criticalIssues.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="size-12 text-green-500 mx-auto mb-2" />
            <p className="text-slate-400">No recurring critical issues found</p>
          </div>
        ) : viewMode === "table" ? (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400">NVR</TableHead>
                    <TableHead className="text-slate-400">Location</TableHead>
                    <TableHead className="text-slate-400">Issue Type</TableHead>
                    <TableHead className="text-slate-400">Day Count</TableHead>
                    <TableHead className="text-slate-400">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1.5 cursor-help">
                            Frequency
                            <Info className="size-3 text-slate-500" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-800 border-slate-700 text-slate-200">
                            <p className="max-w-[200px] text-xs">
                              Represents the proportion of days with this issue
                              during the selected observation period.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead className="text-slate-400">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1.5 cursor-help">
                            Change
                            <Info className="size-3 text-slate-500" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-800 border-slate-700 text-slate-200">
                            <p className="max-w-[200px] text-xs">
                              Indicates how the current trend compares to the
                              previous equivalent period.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead className="text-slate-400">Last Seen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {criticalIssues.map((issue, index) => {
                    const issueInfo = getIssueInfo(issue.issueType);
                    const frequency = (
                      (issue.occurrences / issue.days) *
                      100
                    ).toFixed(1);

                    return (
                      <TableRow
                        key={`${issue.nvrId}-${issue.issueType}-${index}`}
                        className="border-slate-800"
                      >
                        <TableCell className="font-medium text-white">
                          {issue.nvrName}
                        </TableCell>
                        <TableCell className="text-slate-400">
                          <div>
                            <div className="text-xs">{issue.location}</div>
                            <div className="text-xs text-slate-500">
                              {issue.district}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={issueInfo.color}>
                              {issueInfo.icon}
                            </div>
                            <span className="text-slate-300">
                              {issueInfo.label}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-white font-medium">
                          {issue.occurrences}
                        </TableCell>
                        <TableCell className="text-slate-400">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-slate-700 rounded-full h-2 max-w-[60px]">
                              <div
                                className="bg-red-500 h-2 rounded-full"
                                style={{
                                  width: `${Math.min(100, parseFloat(frequency))}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs">{frequency}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {issue.trend === "up" && (
                              <TrendingUp className="size-4 text-red-500" />
                            )}
                            {issue.trend === "down" && (
                              <TrendingDown className="size-4 text-green-500" />
                            )}
                            {issue.trend === "stable" && (
                              <div className="size-4 text-yellow-500">—</div>
                            )}
                            <span
                              className={`text-sm font-medium ${
                                issue.trend === "up"
                                  ? "text-red-500"
                                  : issue.trend === "down"
                                    ? "text-green-500"
                                    : "text-yellow-500"
                              }`}
                            >
                              {issue.percentageChange > 0 ? "+" : ""}
                              {issue.percentageChange}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">
                          {new Date(issue.lastSeen).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {allCriticalIssues.length > itemsPerPage && (
              <div className="flex items-center justify-between px-2 py-4 bg-slate-900/50 rounded-lg border border-slate-800">
                <div className="text-sm text-slate-400">
                  แสดง {startIndex + 1}-
                  {Math.min(endIndex, allCriticalIssues.length)} จาก{" "}
                  {allCriticalIssues.length} รายการ
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    onClick={goToFirstPage}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-1 mx-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          variant={
                            currentPage === pageNum ? "default" : "outline"
                          }
                          size="sm"
                          className={`h-8 w-8 p-0 text-xs ${
                            currentPage === pageNum
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={goToLastPage}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6">
            {/* Chart Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 p-4 rounded-xl border border-red-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-red-400 font-medium uppercase tracking-wider">
                      Total Issues
                    </p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {allCriticalIssues.length}
                    </p>
                  </div>
                  <div className="bg-red-500/20 p-3 rounded-lg">
                    <AlertTriangle className="size-6 text-red-400" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 p-4 rounded-xl border border-amber-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-amber-400 font-medium uppercase tracking-wider">
                      Avg Frequency
                    </p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {allCriticalIssues.length > 0
                        ? (
                            allCriticalIssues.reduce(
                              (sum, issue) =>
                                sum + (issue.occurrences / issue.days) * 100,
                              0,
                            ) / allCriticalIssues.length
                          ).toFixed(1)
                        : "0"}
                      %
                    </p>
                  </div>
                  <div className="bg-amber-500/20 p-3 rounded-lg">
                    <TrendingUp className="size-6 text-amber-400" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 p-4 rounded-xl border border-blue-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-400 font-medium uppercase tracking-wider">
                      Trending Up
                    </p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {
                        allCriticalIssues.filter(
                          (issue) => issue.trend === "up",
                        ).length
                      }
                    </p>
                  </div>
                  <div className="bg-blue-500/20 p-3 rounded-lg">
                    <BarChart3 className="size-6 text-blue-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Combined Chart */}
            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">
                  Critical Issues Overview
                </h4>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-slate-400">Day Count</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                    <span className="text-slate-400">% Change</span>
                  </div>
                </div>
              </div>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#374151"
                      strokeOpacity={0.3}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#9CA3AF"
                      fontSize={11}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      tick={{ fill: "#9CA3AF" }}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="#9CA3AF"
                      fontSize={11}
                      tick={{ fill: "#9CA3AF" }}
                      label={{
                        value: "Day Count",
                        angle: -90,
                        position: "insideLeft",
                        style: { fill: "#9CA3AF", fontSize: 12 },
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#9CA3AF"
                      fontSize={11}
                      tick={{ fill: "#9CA3AF" }}
                      label={{
                        value: "% Change",
                        angle: 90,
                        position: "insideRight",
                        style: { fill: "#9CA3AF", fontSize: 12 },
                      }}
                    />
                    <ChartTooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        border: "1px solid #374151",
                        borderRadius: "12px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                      labelStyle={{
                        color: "#F3F4F6",
                        fontWeight: "bold",
                        marginBottom: "4px",
                      }}
                      itemStyle={{ fontSize: "12px" }}
                      formatter={(value: any, name: string) => {
                        if (name === "Day Count")
                          return [`${value}`, "Day Count"];
                        if (name === "% Change")
                          return [
                            `${value > 0 ? "+" : ""}${value}%`,
                            "% Change",
                          ];
                        return [value, name];
                      }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: "20px" }}
                      iconType="circle"
                      formatter={(value) => (
                        <span style={{ color: "#F3F4F6", fontSize: "12px" }}>
                          {value}
                        </span>
                      )}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="occurrences"
                      fill="#EF4444"
                      name="Day Count"
                      radius={[8, 8, 0, 0]}
                      opacity={0.8}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="percentageChange"
                      stroke="#F59E0B"
                      strokeWidth={3}
                      name="% Change"
                      dot={{
                        fill: "#F59E0B",
                        r: 6,
                        strokeWidth: 2,
                        stroke: "#1F2937",
                      }}
                      activeDot={{ r: 8, stroke: "#F59E0B", strokeWidth: 2 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Issue Type Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                <h4 className="text-lg font-semibold text-white mb-4">
                  Issue Type Distribution
                </h4>
                <div className="h-[300px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={issueTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        cornerRadius={6}
                        dataKey="value"
                        stroke="none"
                      >
                        {issueTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          border: "1px solid #1e293b",
                          borderRadius: "12px",
                          padding: "8px 12px",
                        }}
                        itemStyle={{
                          color: "#fff",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => (
                          <div className="flex items-center gap-2">
                            <div
                              className="size-1.5 rounded-full"
                              style={{ backgroundColor: colors[value as keyof typeof colors] }}
                            />
                            <span className="text-xs font-medium text-slate-400 ml-1">
                              {value}
                            </span>
                          </div>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-9">
                    <span className="text-3xl font-black text-white">
                      {allCriticalIssues.length}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      Total Issues
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                <h4 className="text-lg font-semibold text-white mb-4">
                  Top Affected NVRs
                </h4>
                <div className="space-y-3">
                  {topNVRs.map((nvr, index) => (
                    <div
                      key={nvr.nvrName}
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">
                            {nvr.nvrName}
                          </p>
                          <p className="text-slate-400 text-xs">
                            {nvr.issueType}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">
                          {nvr.occurrences}
                        </p>
                        <p className="text-slate-400 text-xs">times</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CriticalIssuesAnalysis;
