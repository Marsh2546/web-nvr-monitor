import { Link, useLocation } from 'react-router-dom';
import { Camera, FileText, LayoutDashboard } from 'lucide-react';

export function Navigation() {
  const location = useLocation();

  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/status', label: 'ติดตามสถานะ', icon: Camera },
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Camera className="size-8 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">
              ระบบแจ้งซ่อม CCTV กรุงเทพมหานคร
            </h1>
          </div>
          <div className="flex gap-4">
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  location.pathname === to
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
