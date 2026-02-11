// ==========================================
// NVRDashboard.tsx - Optimized Version
// ==========================================

import { useState, useRef, useEffect, useMemo } from "react";
import { NVRStatus } from "@/app/types/nvr";
import { fetchNVRStatusHistory } from "@/app/services/postgresqlService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  AnimatedNumber,
  cn,
  calculateEffectiveStatus,
  getIssueStatus,
  hasCriticalIssues,
  hasAttentionIssues,
  hasIssues,
  NVRWithIssues,
} from "@/app/utils";
import {
  Server,
  CheckCircle,
  AlertTriangle,
  XCircle,
  HardDrive,
  Eye,
  LogIn,
  Wifi,
  MapPin,
  Info,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface NVRDashboardProps {
  onPageChange: (page: "dashboard" | "status") => void;
}

export function NVRDashboard({ onPageChange }: NVRDashboardProps) {
  const [nvrList, setNvrList] = useState<NVRStatus[]>([]);
  const [criticalPage, setCriticalPage] = useState(1);
  const [issueChartReady, setIssueChartReady] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const criticalPerPage = 5;

  // Fetch data from PostgreSQL
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get today's date range in UTC to match database timezone
        const now = new Date();
        const utcDate = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
        const startDate = new Date(utcDate.getFullYear(), utcDate.getMonth(), utcDate.getDate());
        const endDate = new Date(utcDate.getFullYear(), utcDate.getMonth(), utcDate.getDate() + 1);

        const dataPromise = fetchNVRStatusHistory(
          startDate.toISOString(),
          endDate.toISOString(),
        );

        const data = await dataPromise;
        setNvrList(data);
      } catch (err) {
        console.error("Failed to fetch NVR data:", err);
        setError("Failed to load NVR data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleString("th-TH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // ✅ useMemo: คำนวณ issues ครั้งเดียว แทนที่จะคำนวณทุกครั้งที่ render
  const nvrWithIssues = useMemo(
    () =>
      nvrList.map((nvr): NVRWithIssues => {
        const issueStatus = getIssueStatus(nvr);
        const status = calculateEffectiveStatus(nvr);
        const issues: string[] = [];

        // Add issues based on hierarchy
        if (issueStatus === "onu") issues.push("ONU Down");
        if (issueStatus === "nvr") issues.push("NVR Down");
        if (issueStatus === "hdd") issues.push("HDD Failure");
        if (issueStatus === "view") issues.push("View Down");
        if (issueStatus === "login") issues.push("Login Failure");

        return {
          ...nvr,
          hasIssues: hasIssues(nvr),
          issueCount: issues.length,
          issues: issues,
          hasCriticalIssues: hasCriticalIssues(nvr),
          hasAttentionIssues: hasAttentionIssues(nvr),
        };
      }),
    [nvrList],
  );

  // ✅ useMemo: คำนวณ statistics
  const stats = useMemo(() => {
    const totalNVR = nvrWithIssues.length;
    const normalNVR = nvrWithIssues.filter((nvr) => !nvr.hasIssues).length;
    const problemNVR = nvrWithIssues.filter((nvr) => nvr.hasIssues).length;
    const criticalNVRs = nvrWithIssues.filter((nvr) => nvr.hasCriticalIssues);
    const attentionNVRs = nvrWithIssues.filter(
      (nvr) => nvr.hasAttentionIssues && !nvr.hasCriticalIssues,
    );

    // Count individual issues based on root cause
    const onuDown = nvrWithIssues.filter(
      (nvr) => getIssueStatus(nvr) === "onu",
    ).length;
    const nvrDown = nvrWithIssues.filter(
      (nvr) => getIssueStatus(nvr) === "nvr",
    ).length;
    const hddDown = nvrWithIssues.filter(
      (nvr) => getIssueStatus(nvr) === "hdd",
    ).length;
    const cameraDown = nvrWithIssues.filter(
      (nvr) => getIssueStatus(nvr) === "view",
    ).length;
    const loginProblem = nvrWithIssues.filter(
      (nvr) => getIssueStatus(nvr) === "login",
    ).length;

    return {
      totalNVR,
      normalNVR,
      problemNVR,
      criticalNVRs,
      attentionNVRs,
      onuDown,
      nvrDown,
      hddDown,
      cameraDown,
      loginProblem,
    };
  }, [nvrWithIssues]);

  // ✅ useMemo: Chart data
  const chartData = useMemo(() => {
    const statusData = [
      {
        name: "Online",
        value: stats.normalNVR,
        fill: "var(--chart-1)",
      },
      {
        name: "Down",
        value: stats.criticalNVRs.length,
        fill: "#ef4444",
      },
      {
        name: "No Access",
        value: stats.attentionNVRs.length,
        fill: "#f59e0b",
      },
    ];

    const issueData = [
      // Critical Issues (สีแดง-ส้ม) - ปัญหาร้ายแรงตามลำดับชั้น
      {
        name: "ONU Down",
        value: stats.onuDown,
        fill: "#dc2626", // red-600 - ปัญหาเครือข่าย ONU (ระดับ 1)
      },
      {
        name: "NVR Down",
        value: stats.nvrDown,
        fill: "#ef4444", // red-500 - ปัญหาเครือข่าย NVR (ระดับ 2)
      },
      {
        name: "Disk Failure",
        value: stats.hddDown,
        fill: "#f97316", // orange-500 - ปัญหาฮาร์ดดิสก์ (ระดับ 3) - ไม่กระทบ Camera/Login
      },
      {
        name: "View Down",
        value: stats.cameraDown,
        fill: "#eab308", // yellow-500 - ปัญหาการแสดงผล (ระดับ 4)
      },
      {
        name: "Login Problem",
        value: stats.loginProblem,
        fill: "#facc15", // yellow-400 - ปัญหาการเข้าสู่ระบบ (ระดับ 5)
      },
    ].filter((item) => item.value > 0);

    const districtData = nvrWithIssues.reduce(
      (acc, nvr) => {
        const existing = acc.find(
          (item: any) => item.district === nvr.district,
        );
        if (existing) {
          existing.total += 1;
          if (nvr.hasCriticalIssues) {
            existing.critical += 1;
          } else if (nvr.hasAttentionIssues) {
            existing.attention += 1;
          } else {
            existing.normal += 1;
          }
        } else {
          acc.push({
            district: nvr.district,
            total: 1,
            normal: nvr.hasIssues ? 0 : 1,
            critical: nvr.hasCriticalIssues ? 1 : 0,
            attention: nvr.hasAttentionIssues && !nvr.hasCriticalIssues ? 1 : 0,
          });
        }
        return acc;
      },
      [] as Array<{
        district: string;
        total: number;
        normal: number;
        critical: number;
        attention: number;
      }>,
    );

    return { statusData, issueData, districtData };
  }, [stats, nvrWithIssues]);

  useEffect(() => {
    setCriticalPage(1);
  }, [nvrList]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-6 pt-0 pb-8 space-y-8">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="text-slate-400">Loading NVR data...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center py-12">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Main Content - Only show when not loading */}
        {!loading && !error && (
          <>
            {/* Page Title & Time */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div>
                <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
                  Daily Dashboard Overview
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Overview of today’s infrastructure health from the most recent
                  system updates.
                </p>
              </div>
              <div className="flex items-center gap-3 bg-slate-900/40 px-4 py-2 rounded-xl border border-slate-800/60 backdrop-blur-sm">
                <div className="size-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-xs font-mono text-slate-300">
                  TELEMETRY: {currentTime}
                </span>
              </div>
            </div>

            {/* --- Summary Stats (4-grid) --- */}
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
                    <AnimatedNumber value={stats.totalNVR} />
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
                    <AnimatedNumber value={stats.normalNVR} />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {stats.totalNVR > 0
                      ? ((stats.normalNVR / stats.totalNVR) * 100).toFixed(1)
                      : 0}
                    % of Working Normally
                  </p>
                </div>
                <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:opacity-20 group-hover:drop-shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all duration-300">
                  <CheckCircle className="size-20 text-emerald-500" />
                </div>
              </div>

              {/* Critical */}
              <div className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800/50 flex flex-col justify-between relative overflow-hidden group">
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-rose-500/10 p-2 rounded-lg group-hover:bg-rose-500/20 transition-colors">
                    <XCircle className="size-5 text-rose-500" />
                  </div>
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                    Status: Offline
                  </span>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-white mb-0.5">
                    <AnimatedNumber value={stats.criticalNVRs.length} />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {stats.problemNVR > 0
                      ? (
                          (stats.criticalNVRs.length / stats.totalNVR) *
                          100
                        ).toFixed(1)
                      : 0}
                    % of System Offline
                  </p>
                </div>
                <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:opacity-20 group-hover:drop-shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all duration-300">
                  <XCircle className="size-20 text-rose-500" />
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
                    <AnimatedNumber value={stats.attentionNVRs.length} />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {stats.totalNVR > 0
                      ? (
                          (stats.attentionNVRs.length / stats.totalNVR) *
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
            </div>
            {/* --- Main Content Grid --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Critical Issues (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-rose-500/30 shadow-[0_0_30px_rgba(239,68,68,0.15)] flex flex-col overflow-hidden">
                  <div className="p-6 border-b border-rose-500/20 bg-gradient-to-r from-rose-500/10 via-transparent to-transparent flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-rose-500/30 p-2 rounded-lg">
                        <AlertTriangle className="size-5 text-rose-400" />
                      </div>
                      <h3 className="font-bold text-white uppercase tracking-wide text-base">
                        Critical Issues Requiring Immediate Action (
                        {stats.criticalNVRs.length} items)
                      </h3>
                    </div>
                  </div>
                  <div className="p-4 space-y-3 max-h-[610px] overflow-y-auto scrollbar-thin scrollbar-thumb-rose-500/40 scrollbar-track-transparent hover:scrollbar-thumb-rose-500/60">
                    {stats.criticalNVRs.length > 0 ? (
                      stats.criticalNVRs.map((nvr) => (
                        <div
                          key={nvr.id}
                          className="bg-gradient-to-r from-rose-500/5 to-transparent border border-rose-500/20 p-4 rounded-xl hover:border-rose-500/50 hover:bg-rose-500/10 transition-all duration-200 shadow-sm hover:shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg font-bold text-white">
                                  {nvr.nvr}
                                </span>
                                <Badge className="text-xs px-2.5 py-0.5 bg-rose-500/30 text-rose-200 border border-rose-500/50 font-bold uppercase">
                                  {nvr.issueCount} Issues Found
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                <MapPin className="size-3.5 text-slate-500" />
                                <span className="font-medium">
                                  {nvr.location} ({nvr.district})
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {nvr.issues.map((issue: string, idx: number) => (
                              <Badge
                                key={idx}
                                className="flex items-center gap-1.5 text-xs py-1.5 px-2.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold hover:bg-rose-500/30 transition-colors"
                              >
                                <XCircle className="size-3" />
                                {issue}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-slate-500 italic">
                        <CheckCircle className="size-12 text-emerald-500/30 mb-3" />
                        <p className="font-medium">
                          No critical issues detected.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Charts Breakdown (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Chart 1: Status Distribution */}
                <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-lg">
                  <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
                    NVR Status Distribution
                  </h3>
                  <div className="h-[300px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                      >
                        <Pie
                          data={chartData.statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={95}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                          cornerRadius={5}
                          minAngle={6}
                          label={({
                            cx,
                            cy,
                            midAngle,
                            innerRadius,
                            outerRadius,
                            percent,
                            name,
                            value,
                          }) => {
                            const RADIAN = Math.PI / 180;
                            const radius = outerRadius + 25;
                            const x =
                              cx + radius * Math.cos(-midAngle * RADIAN);
                            const y =
                              cy + radius * Math.sin(-midAngle * RADIAN);

                            return (
                              <text
                                x={x}
                                y={y}
                                fill="#e2e8f0"
                                textAnchor={x > cx ? "start" : "end"}
                                dominantBaseline="central"
                                className="text-xs font-bold"
                              >
                                <tspan x={x} dy="0" className="font-semibold">
                                  {name}
                                </tspan>
                                <tspan
                                  x={x}
                                  dy="14"
                                  className="text-[11px] font-bold"
                                >
                                  {value} ({(percent * 100).toFixed(1)}%)
                                </tspan>
                              </text>
                            );
                          }}
                          labelLine={{
                            stroke: "#475569",
                            strokeWidth: 1,
                            strokeDasharray: "3 3",
                          }}
                        >
                          {chartData.statusData.map((entry, index) => (
                            <Cell
                              key={`cell-status-${index}`}
                              fill={entry.fill}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          isAnimationActive
                          animationDuration={200}
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "1px solid #1e293b",
                            borderRadius: "12px",
                            padding: "8px 12px",
                          }}
                          itemStyle={{ color: "#fff", fontSize: "12px" }}
                          formatter={(value: number, name: string) => [
                            `${value} units`,
                            name,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-black text-white">
                        <AnimatedNumber value={stats.totalNVR} />
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        Total Units
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-blue-500" />
                      <span className="text-xs text-slate-400 font-medium">
                        Online (
                        {((stats.normalNVR / stats.totalNVR) * 100).toFixed(0)}
                        %)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-red-500" />
                      <span className="text-xs text-slate-400 font-medium">
                        Offline (
                        {(
                          (stats.criticalNVRs.length / stats.totalNVR) *
                          100
                        ).toFixed(0)}
                        %)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-amber-500" />
                      <span className="text-xs text-slate-400 font-medium">
                        No Access (
                        {(
                          (stats.attentionNVRs.length / stats.totalNVR) *
                          100
                        ).toFixed(0)}
                        %)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Chart 2: Issue Breakdown */}
                <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Issue Type Breakdown
                    </h3>
                    <div className="size-4 bg-slate-700/50 rounded-full flex items-center justify-center cursor-help">
                      <span className="text-[10px] text-slate-400 font-bold">
                        i
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-[180px] w-1/2 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData.issueData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={3}
                            minAngle={2}
                          >
                            {chartData.issueData.map((entry, index) => (
                              <Cell
                                key={`cell-issue-${index}`}
                                fill={entry.fill}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            isAnimationActive
                            animationDuration={200}
                            contentStyle={{
                              backgroundColor: "#0f172a",
                              border: "1px solid #1e293b",
                              borderRadius: "12px",
                            }}
                            itemStyle={{ color: "#fff", fontSize: "12px" }}
                            // formatter={(value: number) => {
                            //   const percent = issusData
                            //   ? ((value / ) *100).toFixed(1)
                            //   : 0;
                            //   return [`${value} (${percent}%)`, "Count"];
                            // }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-1/2 space-y-2.5">
                      {chartData.issueData.map((issue, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="size-1.5 rounded-full"
                              style={{ backgroundColor: issue.fill }}
                            />
                            <span className="text-[11px] text-slate-400 group-hover:text-slate-200 transition-colors uppercase font-medium">
                              {issue.name.split(" ")[0]}{" "}
                              {issue.name.split(" ")[1]}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-slate-300">
                            {issue.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* --- Bottom Section: Health by District & Issue Grid --- */}
            <div className="bg-[#0f172a] rounded-2xl border border-slate-800 shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-white mb-1 uppercase tracking-tight">
                    Today’s System Issues by District
                  </h3>
                  <p className="text-xs text-slate-500">
                    Distribution of healthy vs failing units per district
                  </p>
                </div>
                <div className="flex gap-4">
                  {/* <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-blue-500" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Healthy
                </span>
              </div> */}
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-amber-500" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      Attention
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-red-500" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      Critical
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-[300px] w-full mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData.districtData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="#1e293b"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="district"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }}
                    />
                    <Tooltip
                      isAnimationActive
                      animationDuration={200}
                      cursor={{ fill: "rgba(255,255,255,0.03)" }}
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #1e293b",
                        borderRadius: "12px",
                        padding: "12px",
                      }}
                      itemStyle={{ fontSize: "12px" }}
                    />
                    {/* <Bar
                  dataKey="normal"
                  name="Healthy"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                /> */}
                    <Bar
                      dataKey="critical"
                      name="Critical"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                    />
                    <Bar
                      dataKey="attention"
                      name="Attention"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Small Breakdown Tiles */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-800/50">
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex flex-col items-start gap-2">
                  <div className="flex items-center gap-2 opacity-70">
                    <Wifi className="size-4" />
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      ONU Ping
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-rose-500">
                    {stats.onuDown}
                  </div>
                  <span className="text-[10px] text-slate-600 font-medium">
                    No response
                  </span>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex flex-col items-start gap-2">
                  <div className="flex items-center gap-2 opacity-70">
                    <Server className="size-4" />
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      NVR Ping
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-rose-500">
                    {stats.nvrDown}
                  </div>
                  <span className="text-[10px] text-slate-600 font-medium">
                    Connection timeout
                  </span>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex flex-col items-start gap-2">
                  <div className="flex items-center gap-2 opacity-70">
                    <HardDrive className="size-4" />
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      HDD Status
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-rose-500">
                    {stats.hddDown}
                  </div>
                  <span className="text-[10px] text-slate-600 font-medium">
                    Write errors
                  </span>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex flex-col items-start gap-2">
                  <div className="flex items-center gap-2 opacity-70">
                    <Eye className="size-4" />
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Display
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-amber-500">
                    {stats.cameraDown}
                  </div>
                  <span className="text-[10px] text-slate-600 font-medium">
                    Camera obstruction
                  </span>
                </div>
              </div>
            </div>

            {/* --- Footer --- */}
            <footer className="mt-4 pb-4 text-center">
              <p className="text-[10px] text-slate-500 font-medium tracking-wide">
                Data provided via Database | Total{" "}
                <AnimatedNumber value={stats.totalNVR} /> Nodes | Date:{" "}
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "2-digit",
                  year: "numeric",
                })}
              </p>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
