import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/app/components/ui/table";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Wifi, 
  Server, 
  HardDrive, 
  Eye, 
  LogIn,
  List,
  BarChart3,
  Calendar
} from "lucide-react";
import { fetchNVRStatusHistory } from "@/app/services/nvrHistoryService";
import { NVRStatus } from "@/app/types/nvr";

interface CriticalIssue {
  nvrId: string;
  nvrName: string;
  district: string;
  location: string;
  issueType: string;
  issueIcon: React.ReactNode;
  occurrences: number;
  days: number;
  percentageChange: number;
  trend: 'up' | 'down' | 'stable';
  lastSeen: string;
}

interface CriticalIssuesAnalysisProps {
  className?: string;
}

export default function CriticalIssuesAnalysis({ className }: CriticalIssuesAnalysisProps) {
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [timeRange, setTimeRange] = useState<'3days' | '7days'>('3days');
  const [criticalIssues, setCriticalIssues] = useState<CriticalIssue[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate effective status based on new condition logic
  const calculateEffectiveStatus = (nvr: NVRStatus) => {
    const status = {
      onu: nvr.ping_onu,
      nvr: nvr.ping_nvr,
      hdd: nvr.hdd_status,
      login: nvr.check_login,
      normal_view: nvr.normal_view
    };

    // ONU_STATUS condition
    if (!status.onu) {
      status.nvr = false;
      status.hdd = false;
      status.login = false;
      status.normal_view = false;
      return status;
    }

    // NVR_STATUS condition
    if (!status.nvr) {
      status.hdd = false;
      status.login = false;
      status.normal_view = false;
      return status;
    }

    // HDD_STATUS condition (only check if ONU and NVR are online)
    if (status.onu && status.nvr) {
      status.hdd = nvr.hdd_status; // Use actual HDD status
    } else {
      status.hdd = false;
    }

    // LOGIN_STATUS condition
    status.login = status.nvr; // Login true if NVR is online

    // NORMAL_VIEW_STATUS condition
    status.normal_view = nvr.normal_view;

    return status;
  };

  // Get issue status with new hierarchy
  const getIssueStatus = (nvr: NVRStatus) => {
    const status = calculateEffectiveStatus(nvr);
    if (!status.onu) return "onu";
    if (!status.nvr) return "nvr";
    if (!status.hdd) return "hdd";
    if (!status.normal_view) return "view";
    if (!status.login) return "login";
    return "healthy";
  };

  // Check if NVR has critical issues
  const hasCriticalIssues = (nvr: NVRStatus) => {
    const status = calculateEffectiveStatus(nvr);
    return (
      !status.onu || // ONU Down
      !status.nvr || // NVR Down
      !status.hdd // HDD Down
    );
  };

  // Get issue icon and label
  const getIssueInfo = (issueType: string) => {
    switch (issueType) {
      case 'onu':
        return {
          icon: <Wifi className="size-4" />,
          label: 'ONU Down',
          color: 'text-red-500'
        };
      case 'nvr':
        return {
          icon: <Server className="size-4" />,
          label: 'NVR Down',
          color: 'text-red-500'
        };
      case 'hdd':
        return {
          icon: <HardDrive className="size-4" />,
          label: 'HDD Failure',
          color: 'text-orange-500'
        };
      case 'view':
        return {
          icon: <Eye className="size-4" />,
          label: 'View Down',
          color: 'text-yellow-500'
        };
      case 'login':
        return {
          icon: <LogIn className="size-4" />,
          label: 'Login Problem',
          color: 'text-yellow-500'
        };
      default:
        return {
          icon: <AlertTriangle className="size-4" />,
          label: 'Unknown',
          color: 'text-gray-500'
        };
    }
  };

  // Fetch and analyze critical issues
  useEffect(() => {
    const analyzeCriticalIssues = async () => {
      setIsLoading(true);
      try {
        const endDate = new Date();
        const startDate = new Date();
        
        if (timeRange === '3days') {
          startDate.setDate(endDate.getDate() - 3);
        } else {
          startDate.setDate(endDate.getDate() - 7);
        }

        const historyData = await fetchNVRStatusHistory(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );

        // Group issues by NVR and issue type
        const issueMap = new Map<string, {
          nvrId: string;
          nvrName: string;
          district: string;
          location: string;
          issueType: string;
          occurrences: number;
          dates: string[];
          lastSeen: string;
        }>();

        historyData.forEach(nvr => {
          if (hasCriticalIssues(nvr)) {
            const issueType = getIssueStatus(nvr);
            const key = `${nvr.id}-${issueType}`;
            
            if (!issueMap.has(key)) {
              issueMap.set(key, {
                nvrId: nvr.id,
                nvrName: nvr.nvr,
                district: nvr.district,
                location: nvr.location,
                issueType,
                occurrences: 0,
                dates: [],
                lastSeen: nvr.date_updated
              });
            }
            
            const issue = issueMap.get(key)!;
            issue.occurrences++;
            issue.dates.push(nvr.date_updated);
            
            if (new Date(nvr.date_updated) > new Date(issue.lastSeen)) {
              issue.lastSeen = nvr.date_updated;
            }
          }
        });

        // Convert to array and calculate percentage change
        const issues: CriticalIssue[] = Array.from(issueMap.values()).map(issue => {
          const issueInfo = getIssueInfo(issue.issueType);
          
          // Calculate percentage change (mock calculation for now)
          const percentageChange = Math.floor(Math.random() * 40) - 20; // -20% to +20%
          let trend: 'up' | 'down' | 'stable' = 'stable';
          
          if (percentageChange > 5) trend = 'up';
          else if (percentageChange < -5) trend = 'down';

          return {
            ...issue,
            issueIcon: issueInfo.icon,
            days: timeRange === '3days' ? 3 : 7,
            percentageChange,
            trend
          };
        });

        // Sort by occurrences and percentage change
        issues.sort((a, b) => {
          if (b.occurrences !== a.occurrences) {
            return b.occurrences - a.occurrences;
          }
          return Math.abs(b.percentageChange) - Math.abs(a.percentageChange);
        });

        // Limit to top 20
        setCriticalIssues(issues.slice(0, 20));
      } catch (error) {
        console.error('Error analyzing critical issues:', error);
      } finally {
        setIsLoading(false);
      }
    };

    analyzeCriticalIssues();
  }, [timeRange]);

  // Prepare chart data
  const chartData = useMemo(() => {
    return criticalIssues.map(issue => ({
      name: issue.nvrName.length > 15 ? issue.nvrName.substring(0, 15) + '...' : issue.nvrName,
      occurrences: issue.occurrences,
      percentageChange: issue.percentageChange,
      issueType: issue.issueType
    }));
  }, [criticalIssues]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-slate-500">Analyzing critical issues...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-500" />
              Critical Issues Analysis
            </CardTitle>
            <p className="text-sm text-slate-400 mt-1">
              Recurring critical issues over the last {timeRange === '3days' ? '3' : '7'} days
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800 rounded-lg p-1">
              <Button
                size="sm"
                variant={timeRange === '3days' ? 'default' : 'ghost'}
                onClick={() => setTimeRange('3days')}
                className="text-xs"
              >
                3 Days
              </Button>
              <Button
                size="sm"
                variant={timeRange === '7days' ? 'default' : 'ghost'}
                onClick={() => setTimeRange('7days')}
                className="text-xs"
              >
                7 Days
              </Button>
            </div>
            
            <div className="flex bg-slate-800 rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                onClick={() => setViewMode('table')}
                className="text-xs"
              >
                <List className="size-4 mr-1" />
                Table
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'chart' ? 'default' : 'ghost'}
                onClick={() => setViewMode('chart')}
                className="text-xs"
              >
                <BarChart3 className="size-4 mr-1" />
                Chart
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {criticalIssues.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="size-12 text-green-500 mx-auto mb-2" />
            <p className="text-slate-400">No recurring critical issues found</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-400">NVR</TableHead>
                  <TableHead className="text-slate-400">Location</TableHead>
                  <TableHead className="text-slate-400">Issue Type</TableHead>
                  <TableHead className="text-slate-400">Occurrences</TableHead>
                  <TableHead className="text-slate-400">Frequency</TableHead>
                  <TableHead className="text-slate-400">Change</TableHead>
                  <TableHead className="text-slate-400">Last Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {criticalIssues.map((issue, index) => {
                  const issueInfo = getIssueInfo(issue.issueType);
                  const frequency = ((issue.occurrences / issue.days) * 100).toFixed(1);
                  
                  return (
                    <TableRow key={`${issue.nvrId}-${issue.issueType}-${index}`} className="border-slate-800">
                      <TableCell className="font-medium text-white">
                        {issue.nvrName}
                      </TableCell>
                      <TableCell className="text-slate-400">
                        <div>
                          <div className="text-xs">{issue.location}</div>
                          <div className="text-xs text-slate-500">{issue.district}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={issueInfo.color}>
                            {issueInfo.icon}
                          </div>
                          <span className="text-slate-300">{issueInfo.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-white font-medium">
                        {issue.occurrences}
                      </TableCell>
                      <TableCell className="text-slate-400">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-slate-700 rounded-full h-2 max-w-[60px]">
                            <div 
                              className="bg-red-500 h-2 rounded-full"
                              style={{ width: `${Math.min(100, parseFloat(frequency))}%` }}
                            />
                          </div>
                          <span className="text-xs">{frequency}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {issue.trend === 'up' && <TrendingUp className="size-4 text-red-500" />}
                          {issue.trend === 'down' && <TrendingDown className="size-4 text-green-500" />}
                          {issue.trend === 'stable' && <div className="size-4 text-yellow-500">—</div>}
                          <span className={`text-sm font-medium ${
                            issue.trend === 'up' ? 'text-red-500' : 
                            issue.trend === 'down' ? 'text-green-500' : 'text-yellow-500'
                          }`}>
                            {issue.percentageChange > 0 ? '+' : ''}{issue.percentageChange}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">
                        {new Date(issue.lastSeen).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#9CA3AF"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="occurrences" 
                    fill="#EF4444" 
                    name="Occurrences"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#9CA3AF"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="percentageChange" 
                    stroke="#F59E0B" 
                    strokeWidth={2}
                    name="% Change"
                    dot={{ fill: '#F59E0B', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
