import { useState, useEffect } from "react";
import { ReactNode } from "react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
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
import { PageRegistry } from "@/app/components/PageRegistry";
import { PageName, PageWrapperProps } from "@/app/components/PageWrappers";

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageName>("dashboard");
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
      {/* Premium Header - Shared across Dashboard and Status pages */}
      {(() => {
        const validPages = PageRegistry.getPageNames();
        return validPages.includes(currentPage);
      })() && (
        <header className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-md border-b border-slate-800/60 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="size-15 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <img
                  src="https://multiinno.com/wp-content/uploads/2025/06/cropped-logo-e1748947128387.webp"
                  alt="Logo"
                  className="h-12 w-auto object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  CCTV NVR Monitoring System
                  <Badge
                    variant="outline"
                    className="text-[10px] h-4 bg-blue-500/10 border-blue-500/30 text-blue-400 uppercase tracking-wider px-1"
                  >
                    North District
                  </Badge>
                </h1>
                <p className="text-[10px] text-slate-400 flex items-center gap-2">
                  Bangkok Metropolitan Administration
                  <span className="inline-block size-1 rounded-full bg-slate-600"></span>
                  {(() => {
                    const PageClass = PageRegistry.getPage(currentPage);
                    return PageClass ? PageClass.getDisplayName() : "Unknown Page";
                  })()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col items-end text-[10px] space-y-0.5">
                <span className="text-slate-500 uppercase tracking-widest font-bold">
                  Status Data
                </span>
                <span className="text-green-400 font-medium flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Connected to Google Sheets
                </span>
              </div>
              <div className="flex gap-2">
                {(() => {
                  const allPages = PageRegistry.getAllPages();
                  const buttons: ReactNode[] = [];
                  
                  allPages.forEach((PageClass, pageName) => {
                    const isActive = currentPage === pageName;
                    const isDashboard = pageName === "dashboard";
                    const isStatus = pageName === "status";
                    
                    buttons.push(
                      <Button
                        key={pageName}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageName)}
                        className={
                          isActive
                            ? "flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-md transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                            : "flex items-center gap-2 px-3 py-1.5 bg-slate-800/30 border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-700/50 text-xs font-semibold rounded-md transition-all"
                        }
                      >
                        {isDashboard && <LayoutDashboard className="size-3.5" />}
                        {isStatus && <ClipboardList className="size-3.5" />}
                        {PageClass.getDisplayName()}
                      </Button>
                    );
                  });
                  
                  return buttons;
                })()}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Navigation Bar - For other pages */}
      {(() => {
        const validPages = PageRegistry.getPageNames();
        return !validPages.includes(currentPage);
      })() && (
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
                {(() => {
                  const allPages = PageRegistry.getAllPages();
                  const buttons: ReactNode[] = [];
                  
                  allPages.forEach((PageClass, pageName) => {
                    const isDashboard = pageName === "dashboard";
                    const isStatus = pageName === "status";
                    
                    buttons.push(
                      <Button
                        key={pageName}
                        variant={pageName === "status" ? "default" : "outline"}
                        onClick={() => setCurrentPage(pageName)}
                        className="flex items-center gap-2"
                      >
                        {isDashboard && <LayoutDashboard className="size-4" />}
                        {isStatus && <ClipboardList className="size-4" />}
                        {PageClass.getDisplayName()}
                      </Button>
                    );
                  });
                  
                  return buttons;
                })()}
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
                  {theme === "light" ? "🌙 light" : "☀️ dark"}
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
        {(() => {
          const PageClass = PageRegistry.getPage(currentPage);
          if (!PageClass) return null;
          
          const pageProps: PageWrapperProps = {
            nvrList: nvrData,
            onPageChange: setCurrentPage,
          };
          
          return PageClass.render(pageProps);
        })()}
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
