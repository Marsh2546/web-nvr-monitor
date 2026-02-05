import { useState } from "react";
import { RepairTicket, RepairStatus, Priority } from "@/app/types/repair";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Badge } from "@/app/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";

interface AdminPageProps {
  tickets: RepairTicket[];
  onUpdateTickets: (tickets: RepairTicket[]) => void;
}

const statusLabels = {
  pending: "รอดำเนินการ",
  "in-progress": "กำลังซ่อม",
  completed: "เสร็จสิ้น",
};

const priorityLabels = {
  high: "เร่งด่วนมาก",
  medium: "ปานกลาง",
  low: "ไม่เร่งด่วน",
};

const bangkokDistricts = [
  "พระนคร",
  "ดุสิต",
  "หนองจอก",
  "บางรัก",
  "บางเขน",
  "บางกะปิ",
  "ปทุมวัน",
  "ป้อมปราบศัตรูพ่าย",
  "พระโขนง",
  "มีนบุรี",
  "ลาดกระบัง",
  "ยานนาวา",
  "สัมพันธวงศ์",
  "พญาไท",
  "ธนบุรี",
  "บางกอกใหญ่",
  "ห้วยขวาง",
  "คลองสาน",
  "ตลิ่งชัน",
  "บางกอกน้อย",
  "บางขุนเทียน",
  "ภาษีเจริญ",
  "หนองแขม",
  "ราษฎร์บูรณะ",
  "บางพลัด",
  "ดินแดง",
  "บึงกุ่ม",
  "สาทร",
  "บางซื่อ",
  "จตุจักร",
  "บางคอแหลม",
  "ประเวศ",
  "คลองเตย",
  "สวนหลวง",
  "จอมทอง",
  "ดอนเมือง",
  "ราชเทวี",
  "ลาดพร้าว",
  "วัฒนา",
  "บางแค",
  "หลักสี่",
  "สายไหม",
  "คันนายาว",
  "สะพานสูง",
  "วังทองหลาง",
  "คลองสามวา",
  "บางนา",
  "ทวีวัฒนา",
  "ทุ่งครุ",
  "บางบอน",
];

export function AdminPage({ tickets, onUpdateTickets }: AdminPageProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<RepairTicket | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Form states for new ticket
  const [newTicket, setNewTicket] = useState({
    location: "",
    district: "",
    issue: "",
    priority: "medium" as Priority,
    scheduledDate: "",
    reporter: "",
  });

  // Form states for editing ticket
  const [editForm, setEditForm] = useState({
    status: "pending" as RepairStatus,
    technician: "",
    completedDate: "",
  });

  const handleAddTicket = () => {
    if (
      !newTicket.location ||
      !newTicket.district ||
      !newTicket.issue ||
      !newTicket.scheduledDate ||
      !newTicket.reporter
    ) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    const ticketNumber = `CCTV-2026-${Date.now()}`;
    const today = new Date().toISOString().split("T")[0];
    const now = new Date().toISOString();

    const ticket: RepairTicket = {
      id: String(tickets.length + 1),
      ticketNumber,
      location: newTicket.location,
      district: newTicket.district,
      issue: newTicket.issue,
      status: "pending",
      priority: newTicket.priority,
      reportedDate: today,
      scheduledDate: newTicket.scheduledDate,
      reporter: newTicket.reporter,
      createdAt: now,
      updatedAt: now,
      updatedBy: "Admin",
    };

    onUpdateTickets([...tickets, ticket]);
    setIsAddDialogOpen(false);
    setNewTicket({
      location: "",
      district: "",
      issue: "",
      priority: "medium",
      scheduledDate: "",
      reporter: "",
    });
    toast.success("เพิ่มรายการแจ้งซ่อมสำเร็จ");
  };

  const handleEditTicket = () => {
    if (!editingTicket) return;

    const now = new Date().toISOString();

    const updatedTickets = tickets.map((ticket) => {
      if (ticket.id === editingTicket.id) {
        const updated = {
          ...ticket,
          status: editForm.status,
          technician: editForm.technician || ticket.technician,
          updatedAt: now,
          updatedBy: "Admin",
        };

        if (editForm.status === "completed" && editForm.completedDate) {
          updated.completedDate = editForm.completedDate;
        }

        return updated;
      }
      return ticket;
    });

    onUpdateTickets(updatedTickets);
    setIsEditDialogOpen(false);
    setEditingTicket(null);
    toast.success("อัปเดตสถานะสำเร็จ");
  };

  const handleDeleteTicket = (id: string) => {
    if (confirm("คุณแน่ใจหรือไม่ที่จะลบรายการนี้?")) {
      const updatedTickets = tickets.filter((ticket) => ticket.id !== id);
      onUpdateTickets(updatedTickets);
      toast.success("ลบรายการสำเร็จ");
    }
  };

  const openEditDialog = (ticket: RepairTicket) => {
    setEditingTicket(ticket);
    setEditForm({
      status: ticket.status,
      technician: ticket.technician || "",
      completedDate: ticket.completedDate || "",
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">จัดการรายการซ่อม (Admin)</h1>
          <p className="text-gray-600">
            เพิ่ม แก้ไข และจัดการรายการแจ้งซ่อม CCTV
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="size-4" />
              เพิ่มรายการแจ้งซ่อม
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>เพิ่มรายการแจ้งซ่อมใหม่</DialogTitle>
              <DialogDescription>
                กรอกข้อมูลรายการแจ้งซ่อมกล่อง CCTV
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="location">สถานที่ *</Label>
                <Input
                  id="location"
                  placeholder="เช่น ถนนสุขุมวิท ซอย 21"
                  value={newTicket.location}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, location: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">เขต *</Label>
                <Select
                  value={newTicket.district}
                  onValueChange={(value) =>
                    setNewTicket({ ...newTicket, district: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกเขต" />
                  </SelectTrigger>
                  <SelectContent>
                    {bangkokDistricts.map((district) => (
                      <SelectItem key={district} value={district}>
                        เขต{district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="issue">ปัญหา/รายละเอียด *</Label>
                <Textarea
                  id="issue"
                  placeholder="อธิบายปัญหาที่พบ"
                  value={newTicket.issue}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, issue: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">ระดับความเร่งด่วน *</Label>
                <Select
                  value={newTicket.priority}
                  onValueChange={(value) =>
                    setNewTicket({ ...newTicket, priority: value as Priority })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">เร่งด่วนมาก</SelectItem>
                    <SelectItem value="medium">ปานกลาง</SelectItem>
                    <SelectItem value="low">ไม่เร่งด่วน</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">วันที่นัดซ่อม *</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={newTicket.scheduledDate}
                  onChange={(e) =>
                    setNewTicket({
                      ...newTicket,
                      scheduledDate: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reporter">ผู้แจ้ง *</Label>
                <Input
                  id="reporter"
                  placeholder="เช่น ศูนย์ควบคุม เขตวัฒนา"
                  value={newTicket.reporter}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, reporter: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                <X className="size-4 mr-2" />
                ยกเลิก
              </Button>
              <Button onClick={handleAddTicket}>
                <Save className="size-4 mr-2" />
                บันทึก
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายการทั้งหมด ({tickets.length})</CardTitle>
          <CardDescription>จัดการและอัปเดตสถานะรายการแจ้งซ่อม</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขที่</TableHead>
                  <TableHead>สถานที่</TableHead>
                  <TableHead>เขต</TableHead>
                  <TableHead>ปัญหา</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>ความเร่งด่วน</TableHead>
                  <TableHead>วันนัดซ่อม</TableHead>
                  <TableHead>ช่าง</TableHead>
                  <TableHead>อัปเดตล่าสุด</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">
                      {ticket.ticketNumber}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="truncate" title={ticket.location}>
                        {ticket.location}
                      </div>
                    </TableCell>
                    <TableCell>{ticket.district}</TableCell>
                    <TableCell className="max-w-[250px]">
                      <div className="truncate" title={ticket.issue}>
                        {ticket.issue}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          ticket.status === "completed" ? "default" : "outline"
                        }
                        className={
                          ticket.status === "pending"
                            ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                            : ticket.status === "in-progress"
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : "bg-green-100 text-green-800 border-green-200"
                        }
                      >
                        {statusLabels[ticket.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          ticket.priority === "high"
                            ? "bg-red-100 text-red-800 border-red-200"
                            : ticket.priority === "medium"
                              ? "bg-orange-100 text-orange-800 border-orange-200"
                              : "bg-gray-100 text-gray-800 border-gray-200"
                        }
                      >
                        {priorityLabels[ticket.priority]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(ticket.scheduledDate).toLocaleDateString(
                        "th-TH",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </TableCell>
                    <TableCell>{ticket.technician || "-"}</TableCell>
                    <TableCell>
                      {ticket.updatedAt ? (
                        <div className="text-sm">
                          <div className="font-medium">
                            {new Date(ticket.updatedAt).toLocaleDateString(
                              "th-TH",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(ticket.updatedAt).toLocaleTimeString(
                              "th-TH",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                            {ticket.updatedBy && ` โดย ${ticket.updatedBy}`}
                          </div>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(ticket)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTicket(ticket.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขสถานะการซ่อม</DialogTitle>
            <DialogDescription>
              {editingTicket?.ticketNumber} - {editingTicket?.location}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">สถานะ</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, status: value as RepairStatus })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">รอดำเนินการ</SelectItem>
                  <SelectItem value="in-progress">กำลังซ่อม</SelectItem>
                  <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="technician">ช่างผู้รับผิดชอบ</Label>
              <Input
                id="technician"
                placeholder="ชื่อช่างผู้ซ่อม"
                value={editForm.technician}
                onChange={(e) =>
                  setEditForm({ ...editForm, technician: e.target.value })
                }
              />
            </div>
            {editForm.status === "completed" && (
              <div className="space-y-2">
                <Label htmlFor="completedDate">วันที่เสร็จสิ้น</Label>
                <Input
                  id="completedDate"
                  type="date"
                  value={editForm.completedDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, completedDate: e.target.value })
                  }
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              <X className="size-4 mr-2" />
              ยกเลิก
            </Button>
            <Button onClick={handleEditTicket}>
              <Save className="size-4 mr-2" />
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
