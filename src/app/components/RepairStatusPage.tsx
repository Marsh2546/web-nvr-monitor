import { RepairTicket } from "@/app/types/repair";
import { RepairList } from "@/app/components/RepairList";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";

export function RepairStatusPage({ tickets }: { tickets: RepairTicket[] }) {
  const pendingTickets = tickets.filter((t) => t.status === "pending");
  const inProgressTickets = tickets.filter((t) => t.status === "in-progress");
  const completedTickets = tickets.filter((t) => t.status === "completed");

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">สถานะการซ่อม CCTV</h1>
        <p className="text-gray-600">
          รายละเอียดการแจ้งซ่อมกล่อง CCTV ทั้งหมดในเขตกรุงเทพมหานคร
        </p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">ทั้งหมด ({tickets.length})</TabsTrigger>
          <TabsTrigger value="pending">
            รอดำเนินการ ({pendingTickets.length})
          </TabsTrigger>
          <TabsTrigger value="in-progress">
            กำลังซ่อม ({inProgressTickets.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            เสร็จสิ้น ({completedTickets.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>รายการทั้งหมด</CardTitle>
              <CardDescription>รายการแจ้งซ่อม CCTV ทั้งหมด</CardDescription>
            </CardHeader>
            <CardContent>
              <RepairList tickets={tickets} highlightTomorrow />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>รอดำเนินการ</CardTitle>
              <CardDescription>รายการที่รอการซ่อม</CardDescription>
            </CardHeader>
            <CardContent>
              <RepairList tickets={pendingTickets} highlightTomorrow />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="in-progress" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>กำลังซ่อม</CardTitle>
              <CardDescription>รายการที่อยู่ระหว่างการซ่อม</CardDescription>
            </CardHeader>
            <CardContent>
              <RepairList tickets={inProgressTickets} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>เสร็จสิ้น</CardTitle>
              <CardDescription>รายการที่ซ่อมเสร็จแล้ว</CardDescription>
            </CardHeader>
            <CardContent>
              <RepairList tickets={completedTickets} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
