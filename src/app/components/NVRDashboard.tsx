// ==========================================
// NVRDashboard.tsx - Optimized Version
// ==========================================

import { NVRStatus } from "@/app/types/nvr";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
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
import { useState, useEffect, useMemo } from "react";

interface NVRDashboardProps {
  nvrList: NVRStatus[];
}

// ✅ Extended NVR type with computed properties
interface NVRWithIssues extends NVRStatus {
  hasIssues: boolean;
  issueCount: number;
  issues: string[];
}

export function NVRDashboard({ nvrList }: NVRDashboardProps) {
  const [criticalPage, setCriticalPage] = useState(1);
  const [issueChartReady, setIssueChartReady] = useState(false);
  const criticalPerPage = 5;

  // ✅ useMemo: คำนวณ issues ครั้งเดียว แทนที่จะคำนวณทุกครั้งที่ render
  const nvrWithIssues = useMemo(
    () =>
      nvrList.map((nvr): NVRWithIssues => {
        const issues: string[] = [];
        if (!nvr.ping_onu) issues.push("ONU Ping");
        if (!nvr.ping_nvr) issues.push("NVR Ping");
        if (!nvr.hdd_status) issues.push("HDD");
        if (!nvr.normal_view) issues.push("แสดงภาพ");
        if (!nvr.check_login) issues.push("Login");

        return {
          ...nvr,
          hasIssues: issues.length > 0,
          issueCount: issues.length,
          issues: issues,
        };
      }),
    [nvrList],
  );

  // ✅ useMemo: คำนวณ statistics
  const stats = useMemo(() => {
    const totalNVR = nvrWithIssues.length;
    const normalNVR = nvrWithIssues.filter((nvr) => !nvr.hasIssues).length;
    const problemNVR = nvrWithIssues.filter((nvr) => nvr.hasIssues).length;
    const criticalNVRs = nvrWithIssues.filter((nvr) => nvr.issueCount >= 2);

    const pingOnuFail = nvrWithIssues.filter((nvr) => !nvr.ping_onu).length;
    const pingNvrFail = nvrWithIssues.filter((nvr) => !nvr.ping_nvr).length;
    const hddFail = nvrWithIssues.filter((nvr) => !nvr.hdd_status).length;
    const viewFail = nvrWithIssues.filter((nvr) => !nvr.normal_view).length;
    const loginFail = nvrWithIssues.filter((nvr) => !nvr.check_login).length;

    return {
      totalNVR,
      normalNVR,
      problemNVR,
      criticalNVRs,
      pingOnuFail,
      pingNvrFail,
      hddFail,
      viewFail,
      loginFail,
    };
  }, [nvrWithIssues]);

  // ✅ useMemo: Chart data
  const chartData = useMemo(() => {
    const statusData = [
      { name: "ปกติ", value: stats.normalNVR, fill: "#22C55E" },
      { name: "มีปัญหา", value: stats.problemNVR, fill: "#EF4444" },
    ];

    const issueData = [
      { name: "ONU Ping ไม่ได้", value: stats.pingOnuFail, fill: "#DC2626" },
      { name: "NVR Ping ไม่ได้", value: stats.pingNvrFail, fill: "#EF4444" },
      { name: "HDD มีปัญหา", value: stats.hddFail, fill: "#F97316" },
      { name: "แสดงภาพผิดปกติ", value: stats.viewFail, fill: "#F59E0B" },
      { name: "Login ไม่ได้", value: stats.loginFail, fill: "#EAB308" },
    ].filter((item) => item.value > 0);

    const districtData = nvrWithIssues.reduce(
      (acc, nvr) => {
        const existing = acc.find((item) => item.district === nvr.district);
        if (existing) {
          existing.total += 1;
          if (nvr.hasIssues) {
            existing.problem += 1;
          } else {
            existing.normal += 1;
          }
        } else {
          acc.push({
            district: nvr.district,
            total: 1,
            normal: nvr.hasIssues ? 0 : 1,
            problem: nvr.hasIssues ? 1 : 0,
          });
        }
        return acc;
      },
      [] as Array<{
        district: string;
        total: number;
        normal: number;
        problem: number;
      }>,
    );

    return { statusData, issueData, districtData };
  }, [stats, nvrWithIssues]);

  useEffect(() => {
    setCriticalPage(1);
  }, [nvrList]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard ภาพรวม CCTV NVR</h1>
        <p className="text-gray-600">
          สถานะและการทำงานของระบบ CCTV NVR ทั้งหมดในกรุงเทพมหานคร
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Server className="size-5 text-blue-600" />
              <CardTitle className="text-lg">NVR ทั้งหมด</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalNVR}</div>
            <p className="text-sm text-gray-600">จุดติดตั้งทั้งหมด</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="size-5 text-green-600" />
              <CardTitle className="text-lg text-green-800">
                ทำงานปกติ
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.normalNVR}
            </div>
            <p className="text-sm text-green-700">
              {stats.totalNVR > 0
                ? ((stats.normalNVR / stats.totalNVR) * 100).toFixed(1)
                : 0}
              % ของทั้งหมด
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <XCircle className="size-5 text-red-600" />
              <CardTitle className="text-lg text-red-800">มีปัญหา</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {stats.problemNVR}
            </div>
            <p className="text-sm text-red-700">ต้องดำเนินการ</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-orange-600" />
              <CardTitle className="text-lg text-orange-800">วิกฤต</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {stats.criticalNVRs.length}
            </div>
            <p className="text-sm text-orange-700">มีปัญหามากกว่า 1 รายการ</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {stats.criticalNVRs.length > 0 && (
        <Card className="border-red-500 border-2 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-6 text-red-600" />
              <CardTitle className="text-red-900">
                รายการวิกฤต - ต้องดำเนินการเร่งด่วน ({stats.criticalNVRs.length}{" "}
                รายการ)
              </CardTitle>
            </div>
            <CardDescription className="text-red-700">
              NVR ที่มีปัญหาหลายรายการพร้อมกัน
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2 overlay-scrollbar">
              {stats.criticalNVRs.map((nvr) => (
                <div
                  key={nvr.id}
                  className="bg-white p-4 rounded-lg border border-red-200 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-red-900">
                          {nvr.nvr}
                        </span>
                        <Badge variant="destructive" className="text-xs">
                          {nvr.issueCount} ปัญหา
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <MapPin className="size-4" />
                        <span>
                          {nvr.location} (เขต{nvr.district})
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {nvr.issues.map((issue, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="bg-red-100 text-red-800 border-red-200"
                      >
                        <XCircle className="size-3 mr-1" />
                        {issue}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>สัดส่วนสถานะ NVR</CardTitle>
            <CardDescription>แสดงสถานะทั่วไปของระบบ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    cornerRadius={5}
                    stroke="none"
                  >
                    {chartData.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-gray-900">
                  {stats.totalNVR}
                </span>
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                  Total
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {chartData.issueData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>รายละเอียดปัญหา</CardTitle>
              <CardDescription>ประเภทปัญหาที่พบ</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.issueData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    cornerRadius={4}
                    stroke="none"
                    onAnimationEnd={() => setIssueChartReady(true)}
                    label={({ x, y, value, payload }) => (
                      <text
                        x={x}
                        y={y}
                        fill={payload.fill}
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="text-xs font-bold"
                        style={{
                          fontSize: "15px",
                          opacity: issueChartReady ? 1 : 0,
                          transition: "opacity 0.5s ease-in-out",
                          textShadow: "0 1px 2px rgba(255,255,255,0.8)",
                        }}
                      >
                        {value}
                      </text>
                    )}
                    labelLine={false}
                  >
                    {chartData.issueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    iconType="circle"
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* District Chart */}
      <Card>
        <CardHeader>
          <CardTitle>สถานะแยกตามเขต</CardTitle>
          <CardDescription>จำนวน NVR และสถานะในแต่ละเขต</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData.districtData}>
              <CartesianGrid strokeDasharray="3 3" />
              {/* @ts-expect-error: Recharts type definition issue */}
              <XAxis dataKey="district" />
              {/* @ts-expect-error: Recharts type definition issue */}
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="normal" name="ปกติ" fill="#22C55E" />
              <Bar dataKey="problem" name="มีปัญหา" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Issue Breakdown by Type */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Wifi className="size-4 text-red-600" />
              <CardTitle className="text-sm">ONU Ping</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.pingOnuFail}
            </div>
            <p className="text-xs text-gray-600">ไม่ตอบสนอง</p>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Server className="size-4 text-red-600" />
              <CardTitle className="text-sm">NVR Ping</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.pingNvrFail}
            </div>
            <p className="text-xs text-gray-600">ไม่ตอบสนอง</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <HardDrive className="size-4 text-orange-600" />
              <CardTitle className="text-sm">HDD</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.hddFail}
            </div>
            <p className="text-xs text-gray-600">มีปัญหา</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Eye className="size-4 text-yellow-600" />
              <CardTitle className="text-sm">แสดงภาพ</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.viewFail}
            </div>
            <p className="text-xs text-gray-600">ผิดปกติ</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <LogIn className="size-4 text-yellow-600" />
              <CardTitle className="text-sm">Login</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.loginFail}
            </div>
            <p className="text-xs text-gray-600">ไม่ได้</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
