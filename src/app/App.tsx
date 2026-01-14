import { useState, useEffect } from 'react';
import { NVRDashboard } from '@/app/components/NVRDashboard';
import { NVRStatusPage } from '@/app/components/NVRStatusPage';
import { Button } from '@/app/components/ui/button';
import { LayoutDashboard, ClipboardList, RefreshCw, AlertCircle } from 'lucide-react';
import { mockNVRData } from '@/app/data/nvrData';
import { Toaster } from '@/app/components/ui/sonner';
import { toast } from 'sonner';
import { fetchNVRStatus } from '@/app/services/nvrService';
import { NVRStatus } from '@/app/types/nvr';

type Page = 'dashboard' | 'status';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [nvrData, setNVRData] = useState<NVRStatus[]>(mockNVRData);
  const [isLoading, setIsLoading] = useState(false);
  const [useGoogleSheets, setUseGoogleSheets] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Auto-refresh every 5 minutes if using Google Sheets
  useEffect(() => {
    if (useGoogleSheets) {
      const interval = setInterval(() => {
        loadNVRData(true); // Silent refresh
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearInterval(interval);
    }
  }, [useGoogleSheets]);

  const loadNVRData = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }
    
    try {
      const data = await fetchNVRStatus(false); // Always fetch fresh data
      setNVRData(data);
      setUseGoogleSheets(true);
      setLastUpdated(new Date().toLocaleString('th-TH'));
      
      if (!silent) {
        toast.success(`โหลดข้อมูลสำเร็จ ${data.length} รายการ`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลได้';
      setError(errorMessage);
      
      if (!silent) {
        toast.error('เกิดข้อผิดพลาด: ' + errorMessage);
      }
      
      console.error('Failed to load NVR data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const switchToMockData = () => {
    setNVRData(mockNVRData);
    setUseGoogleSheets(false);
    setError(null);
    setLastUpdated(null);
    toast.info('สลับไปใช้ข้อมูลตัวอย่าง');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                ระบบตรวจสอบสถานะ CCTV NVR กรุงเทพมหานคร เหนือ
              </h1>
              <p className="text-sm text-gray-600">
                Bangkok CCTV NVR Monitoring System
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={currentPage === 'dashboard' ? 'default' : 'outline'}
                onClick={() => setCurrentPage('dashboard')}
                className="flex items-center gap-2"
              >
                <LayoutDashboard className="size-4" />
                Dashboard
              </Button>
              <Button
                variant={currentPage === 'status' ? 'default' : 'outline'}
                onClick={() => setCurrentPage('status')}
                className="flex items-center gap-2"
              >
                <ClipboardList className="size-4" />
                สถานะ NVR
              </Button>
            </div>
          </div>
          
          {/* Data Source Controls */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => loadNVRData()}
                disabled={isLoading}
                variant="default"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'กำลังโหลด...' : 'โหลดจาก Google Sheets'}
              </Button>
              
              {/* {useGoogleSheets && (
                <Button
                  onClick={switchToMockData}
                  variant="outline"
                  size="sm"
                >
                  ใช้ข้อมูลตัวอย่าง
                </Button>
              )} */}
              
              {lastUpdated && (
                <span className="text-sm text-gray-600">
                  อัปเดตล่าสุด: {lastUpdated}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {useGoogleSheets && !error && (
                <span className="text-sm text-green-600 font-medium">
                  ● เชื่อมต่อ Google Sheets
                </span>
              )}
              {/* {!useGoogleSheets && (
                <span className="text-sm text-gray-600">
                  ● ใช้ข้อมูลตัวอย่าง
                </span>
              )} */}
            </div>
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">ไม่สามารถเชื่อมต่อ Google Sheets</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <p className="text-xs text-red-600 mt-2">
                  กรุณาตรวจสอบว่าได้ตั้งค่า GOOGLE_SHEET_ID และ GOOGLE_SHEETS_API_KEY แล้ว
                </p>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Page Content */}
      <main className="min-h-[calc(100vh-5rem)]">
        {currentPage === 'dashboard' && <NVRDashboard nvrList={nvrData} />}
        {currentPage === 'status' && <NVRStatusPage nvrList={nvrData} />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-6 py-6">
          <p className="text-center text-sm text-gray-600">
            {useGoogleSheets 
              ? `ข้อมูลจาก Google Sheets | ${nvrData.length} รายการ` 
              : `ข้อมูลตัวอย่าง | ${nvrData.length} รายการ`
            } | วันที่: {new Date().toLocaleDateString('th-TH', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </footer>

      <Toaster />
    </div>
  );
}