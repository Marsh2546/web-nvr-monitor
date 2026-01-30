import { useState, useEffect } from "react";
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
                    return PageClass
                      ? PageClass.getDisplayName()
                      : "Unknown Page";
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
                  Connected to Database
                </span>
              </div>
              <div className="flex gap-2">
                {(() => {
                  const allPages = PageRegistry.getAllPages();
                  const buttons = [];

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
                        {isDashboard && (
                          <LayoutDashboard className="size-3.5" />
                        )}
                        {isStatus && <ClipboardList className="size-3.5" />}
                        {PageClass.getDisplayName()}
                        {/* {!isStatus && (
                          <div className="size-1.5 rounded-full bg-white/60 animate-pulse" />
                        )} */}
                      </Button>,
                    );
                  });

                  return buttons;
                })()}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1">
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
            ข้อมูลจาก Database | {nvrData.length} รายการ | วันที่:{" "}
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
