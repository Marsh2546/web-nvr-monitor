import { RepairTicket } from "@/app/types/repair";
import { StatCard } from "@/app/components/StatCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import {
  ClipboardList,
  Clock,
  Wrench,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Calendar,
  AlertCircle,
  CalendarRange,
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
import { useState } from "react";

const COLORS = {
  pending: "#EAB308",
  "in-progress": "#3B82F6",
  completed: "#22C55E",
};

type DateRange = "7days" | "30days" | "90days" | "all" | "custom";

export function DashboardPage({ tickets }: { tickets: RepairTicket[] }) {
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Filter tickets based on date range
  const getFilteredTickets = () => {
    const today = new Date("2026-01-13"); // Current date in the system

    if (dateRange === "all") {
      return tickets;
    }

    if (dateRange === "custom") {
      if (!customStartDate || !customEndDate) return tickets;
      return tickets.filter((ticket) => {
        const reportDate = new Date(ticket.reportedDate);
        return (
          reportDate >= new Date(customStartDate) &&
          reportDate <= new Date(customEndDate)
        );
      });
    }

    const days = dateRange === "7days" ? 7 : dateRange === "30days" ? 30 : 90;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);

    return tickets.filter((ticket) => {
      const reportDate = new Date(ticket.reportedDate);
      return reportDate >= startDate && reportDate <= today;
    });
  };

  const filteredTickets = getFilteredTickets();
  const totalTickets = filteredTickets.length;
  const pendingTickets = filteredTickets.filter((t) => t.status === "pending");
  const inProgressTickets = filteredTickets.filter(
    (t) => t.status === "in-progress",
  );
  const completedTickets = filteredTickets.filter(
    (t) => t.status === "completed",
  );

  const tomorrow = "2026-01-14";
  const tomorrowTickets = tickets.filter(
    (t) => t.scheduledDate === tomorrow && t.status !== "completed",
  );

  // Data for charts
  const statusData = [
    { name: "รอดำเนินการ", value: pendingTickets.length, fill: COLORS.pending },
    {
      name: "กำลังซ่อม",
      value: inProgressTickets.length,
      fill: COLORS["in-progress"],
    },
    {
      name: "เสร็จสิ้น",
      value: completedTickets.length,
      fill: COLORS.completed,
    },
  ];

  const districtData = filteredTickets.reduce(
    (acc, ticket) => {
      const existing = acc.find((item) => item.district === ticket.district);
      if (existing) {
        existing.total += 1;
        if (ticket.status === "pending") existing.pending += 1;
        if (ticket.status === "in-progress") existing.inProgress += 1;
        if (ticket.status === "completed") existing.completed += 1;
      } else {
        acc.push({
          district: ticket.district,
          total: 1,
          pending: ticket.status === "pending" ? 1 : 0,
          inProgress: ticket.status === "in-progress" ? 1 : 0,
          completed: ticket.status === "completed" ? 1 : 0,
        });
      }
      return acc;
    },
    [] as Array<{
      district: string;
      total: number;
      pending: number;
      inProgress: number;
      completed: number;
    }>,
  );

  const priorityData = [
    {
      name: "เร่งด่วนมาก",
      value: filteredTickets.filter(
        (t) => t.priority === "high" && t.status !== "completed",
      ).length,
      fill: "#EF4444",
    },
    {
      name: "ปานกลาง",
      value: filteredTickets.filter(
        (t) => t.priority === "medium" && t.status !== "completed",
      ).length,
      fill: "#F97316",
    },
    {
      name: "ไม่เร่งด่วน",
      value: filteredTickets.filter(
        (t) => t.priority === "low" && t.status !== "completed",
      ).length,
      fill: "#9CA3AF",
    },
  ];

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="container mx-auto pt-0 px-4 md:px-6 space-y-6">
        <div className="pt-6">
          <h1 className="text-3xl font-bold mb-2">
            Dashboard ภาพรวมการซ่อม CCTV
          </h1>
          <p className="text-foreground/60">
            ภาพรวมการแจ้งซ่อมและสถานะการดำเนินงานทั้งหมด
          </p>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="รายการทั้งหมด"
          value={totalTickets}
          icon={ClipboardList}
          color="text-gray-600"
          description="รายการแจ้งซ่อมทั้งหมด"
        />
        <StatCard
          title="รอดำเนินการ"
          value={pendingTickets.length}
          icon={Clock}
          color="text-yellow-600"
          description="รอการจัดทีมซ่อม"
        />
        <StatCard
          title="กำลังซ่อม"
          value={inProgressTickets.length}
          icon={Wrench}
          color="text-blue-600"
          description="อยู่ระหว่างดำเนินการ"
        />
        <StatCard
          title="เสร็จสิ้น"
          value={completedTickets.length}
          icon={CheckCircle}
          color="text-green-600"
          description="ซ่อมเสร็จแล้ว"
        />
      </div>

      {/* Tomorrow's Schedule - Highlighted */}
      {tomorrowTickets.length > 0 && (
        <Card className="border-red-500 border-2 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="size-6 text-red-600" />
              <CardTitle className="text-red-900">
                ต้องดำเนินการพรุ่งนี้ ({tomorrowTickets.length} รายการ)
              </CardTitle>
            </div>
            <CardDescription className="text-red-700">
              วันพุธที่ 14 มกราคม 2026 - รายการที่ต้องเร่งดำเนินการ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tomorrowTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white p-4 rounded-lg border border-red-200 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-red-900">
                          {ticket.ticketNumber}
                        </span>
                        {ticket.priority === "high" && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="size-3 mr-1" />
                            เร่งด่วนมาก
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <MapPin className="size-4" />
                        <span>
                          {ticket.location} ({ticket.district})
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-yellow-100 text-yellow-800 border-yellow-200"
                    >
                      {ticket.status === "pending"
                        ? "รอดำเนินการ"
                        : "กำลังซ่อม"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mt-2">
                    <span className="font-medium">ปัญหา: </span>
                    {ticket.issue}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle>กรองตามช่วงเวลา</CardTitle>
          <CardDescription>เลือกช่วงเวลาที่ต้องการดูข้อมูล</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              variant={dateRange === "7days" ? "default" : "outline"}
              onClick={() => setDateRange("7days")}
            >
              7 วัน
            </Button>
            <Button
              variant={dateRange === "30days" ? "default" : "outline"}
              onClick={() => setDateRange("30days")}
            >
              30 วัน
            </Button>
            <Button
              variant={dateRange === "90days" ? "default" : "outline"}
              onClick={() => setDateRange("90days")}
            >
              90 วัน
            </Button>
            <Button
              variant={dateRange === "all" ? "default" : "outline"}
              onClick={() => setDateRange("all")}
            >
              ทั้งหมด
            </Button>
            <Button
              variant={dateRange === "custom" ? "default" : "outline"}
              onClick={() => setDateRange("custom")}
            >
              กำหนดเอง
            </Button>
          </div>
          {dateRange === "custom" && (
            <div className="mt-4">
              <Label>เริ่มต้น:</Label>
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
              <Label className="mt-2">สิ้นสุด:</Label>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>สัดส่วนสถานะการซ่อม</CardTitle>
            <CardDescription>แสดงสถานะทั้งหมดของรายการซ่อม</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) =>
                    `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ความเร่งด่วน (ที่ยังไม่เสร็จ)</CardTitle>
            <CardDescription>
              แสดงระดับความเร่งด่วนของรายการที่ค้างอยู่
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) =>
                    `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>สถานะการซ่อมแยกตามเขต</CardTitle>
          <CardDescription>จำนวนรายการแจ้งซ่อมในแต่ละเขต</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={districtData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="district" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="pending" name="รอดำเนินการ" fill={COLORS.pending} />
              <Bar
                dataKey="inProgress"
                name="กำลังซ่อม"
                fill={COLORS["in-progress"]}
              />
              <Bar
                dataKey="completed"
                name="เสร็จสิ้น"
                fill={COLORS.completed}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary by District */}
      <Card>
        <CardHeader>
          <CardTitle>สรุปตามเขต</CardTitle>
          <CardDescription>
            รายละเอียดจำนวนรายการแจ้งซ่อมในแต่ละเขต
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {districtData
              .sort((a, b) => b.total - a.total)
              .map((district) => (
                <div
                  key={district.district}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">เขต{district.district}</h3>
                    <Badge variant="outline">{district.total} รายการ</Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-yellow-600">● รอดำเนินการ:</span>
                      <span className="font-medium">{district.pending}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-600">● กำลังซ่อม:</span>
                      <span className="font-medium">{district.inProgress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">● เสร็จสิ้น:</span>
                      <span className="font-medium">{district.completed}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
