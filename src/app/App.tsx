import { useState, useEffect } from "react";
import { NVRDashboard } from "@/app/components/NVRDashboard";
import { NVRStatusPage } from "@/app/components/NVRStatusPage";
import { Button } from "@/app/components/ui/button";
import {
  LayoutDashboard,
  ClipboardList,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { mockNVRData } from "@/app/data/nvrData";
import { Toaster } from "@/app/components/ui/sonner";
import { toast } from "sonner";
import { fetchNVRStatus } from "@/app/services/nvrService";
import { NVRStatus } from "@/app/types/nvr";

type Page = "dashboard" | "status";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [nvrData, setNVRData] = useState<NVRStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useGoogleSheets, setUseGoogleSheets] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Load data on initial mount
  useEffect(() => {
    loadNVRData();
  }, []);

  // Auto-refresh every 1 minute for real-time feel
  useEffect(() => {
    const interval = setInterval(() => {
      loadNVRData(true); // Silent refresh (no toast notifications)
    }, 60 * 1000); // 1 minute

    return () => clearInterval(interval);
  }, []);

  const loadNVRData = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const data = await fetchNVRStatus(false); // Always fetch fresh data
      setNVRData(data);
      setUseGoogleSheets(true);
      setLastUpdated(new Date().toLocaleString("th-TH"));

      if (!silent) {
        toast.success(`โหลดข้อมูลสำเร็จ ${data.length} รายการ`);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลได้";
      setError(errorMessage);

      if (!silent) {
        toast.error("เกิดข้อผิดพลาด: " + errorMessage);
      }

      console.error("Failed to load NVR data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const switchToMockData = () => {
    setNVRData(mockNVRData);
    setUseGoogleSheets(false);
    setError(null);
    setLastUpdated(null);
    toast.info("สลับไปใช้ข้อมูลตัวอย่าง");
  };

  return (
    <div
      className={`${theme} min-h-screen bg-background transition-colors duration-300`}
    >
      {/* Navigation Bar - Hidden on Dashboard and Status to avoid duplication */}
      {currentPage !== "dashboard" && currentPage !== "status" && (
        <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src="https://multiinno.com/wp-content/uploads/2025/06/cropped-logo-e1748947128387.webp"
                  alt="Logo"
                  className="h-12 w-auto object-contain"
                />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    CCTV NVR Monitoring System
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Bangkok CCTV NVR Monitoring System
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage("dashboard")}
                  className="flex items-center gap-2"
                >
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </Button>
                <Button
                  variant="default"
                  onClick={() => setCurrentPage("status")}
                  className="flex items-center gap-2"
                >
                  <ClipboardList className="size-4" />
                  Status NVR
                </Button>
              </div>
            </div>

            {/* Data Source Controls */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isLoading && !lastUpdated ? (
                  <div className="flex items-center gap-2 text-sm text-primary animate-pulse">
                    <RefreshCw className="size-4 animate-spin" />
                    <span>กำลังอัปเดตข้อมูลอัตโนมัติ...</span>
                  </div>
                ) : null}

                {lastUpdated && (
                  <span className="text-sm text-muted-foreground">
                    อัปเดตล่าสุด: {lastUpdated}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  className="text-muted-foreground"
                >
                  {theme === "light" ? "🌙 โหมดมืด" : "☀️ โหมดสว่าง"}
                </Button>

                {useGoogleSheets && !error && (
                  <span className="text-sm text-green-500 font-medium">
                    ● เชื่อมต่อ Google Sheets
                  </span>
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">
                    ไม่สามารถเชื่อมต่อ Google Sheets
                  </p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <p className="text-xs text-red-600 mt-2">
                    กรุณาตรวจสอบว่าได้ตั้งค่า GOOGLE_SHEET_ID และ
                    GOOGLE_SHEETS_API_KEY แล้ว
                  </p>
                </div>
              </div>
            )}
          </div>
        </nav>
      )}

      {/* Page Content */}
      <main className="min-h-[calc(100vh-5rem)]">
        {currentPage === "dashboard" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <NVRDashboard nvrList={nvrData} onPageChange={setCurrentPage} />
          </div>
        )}
        {currentPage === "status" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <NVRStatusPage nvrList={nvrData} onPageChange={setCurrentPage} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-12">
        <div className="container mx-auto px-6 py-6">
          <p className="text-center text-sm text-muted-foreground">
            {useGoogleSheets
              ? `ข้อมูลจาก Google Sheets | ${nvrData.length} รายการ`
              : `ข้อมูลตัวอย่าง | ${nvrData.length} รายการ`}{" "}
            | วันที่:{" "}
            {new Date().toLocaleDateString("th-TH", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </footer>

      <Toaster />
    </div>
  );
}
