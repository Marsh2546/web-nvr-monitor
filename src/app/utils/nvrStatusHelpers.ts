import { NVRStatus } from "@/app/types/nvr";

export interface EffectiveStatus {
  onu: boolean;
  nvr: boolean;
  hdd: boolean;
  login: boolean;
  normal_view: boolean;
}

export interface NVRWithIssues extends NVRStatus {
  hasIssues: boolean;
  issueCount: number;
  issues: string[];
  hasCriticalIssues: boolean;
  hasAttentionIssues: boolean;
}

export type IssueStatus = "onu" | "nvr" | "hdd" | "view" | "login" | "healthy";

// Calculate effective status based on hierarchy
export function calculateEffectiveStatus(nvr: NVRStatus): EffectiveStatus {
  const status = {
    onu: nvr.ping_onu,
    nvr: nvr.ping_nvr,
    hdd: nvr.hdd_status,
    login: nvr.check_login,
    normal_view: nvr.normal_view,
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
}

// Get issue status with hierarchy
export function getIssueStatus(nvr: NVRStatus): IssueStatus {
  const status = calculateEffectiveStatus(nvr);
  if (!status.onu) return "onu"; // ONU Down - highest priority
  if (!status.nvr) return "nvr"; // NVR Down
  if (!status.hdd) return "hdd"; // HDD Down - does not affect Camera, Login
  if (!status.normal_view) return "view"; // View Down - affects Login
  if (!status.login) return "login"; // Login Problem
  return "healthy"; // No issues
}

// Check if NVR has critical issues based on hierarchy
export function hasCriticalIssues(nvr: NVRStatus): boolean {
  const status = calculateEffectiveStatus(nvr);
  return (
    !status.onu || // ONU Down - affects everything below
    !status.nvr || // NVR Down - affects HDD, Camera, Login
    !status.hdd // HDD Down - does not affect Camera, Login
  );
}

// Check if NVR has attention issues (View Down only when no critical issues)
export function hasAttentionIssues(nvr: NVRStatus): boolean {
  const status = calculateEffectiveStatus(nvr);
  return !hasCriticalIssues(nvr) && !status.normal_view; // View Down only
}

// Check if NVR has any issues
export function hasIssues(nvr: NVRStatus): boolean {
  return hasCriticalIssues(nvr) || hasAttentionIssues(nvr);
}

// Get issue count based on effective status
export function getIssueCount(nvr: NVRStatus): number {
  const status = calculateEffectiveStatus(nvr);
  let count = 0;
  if (!status.onu) count++;
  if (!status.nvr) count++;
  if (!status.hdd) count++;
  if (!status.normal_view) count++;
  if (!status.login) count++;
  return count;
}

// Check specific issue types based on hierarchy
export function hasSpecificIssue(nvr: NVRStatus, issueType: string): boolean {
  const status = calculateEffectiveStatus(nvr);

  switch (issueType) {
    case "onu":
      return !status.onu; // Only show if ONU is the root cause
    case "nvr":
      return status.onu && !status.nvr; // Only show if NVR is the root cause
    case "hdd":
      return status.onu && status.nvr && !status.hdd; // Only show if HDD is the root cause
    case "view":
      return status.onu && status.nvr && !status.normal_view; // Only show if Camera is the root cause
    case "login":
      return status.onu && status.nvr && !status.login; // Only show if Login is the root cause
    default:
      return false;
  }
}

// Get component status based on effective status
export function getComponentStatus(nvr: NVRStatus, component: string): "failed" | "affected" | "normal" {
  const status = calculateEffectiveStatus(nvr);

  // If this component is the root cause, show it as failed
  if (component === "onu" && !status.onu) return "failed";
  if (component === "nvr" && !status.nvr) return "failed";
  if (component === "hdd" && !status.hdd) return "failed";
  if (component === "view" && !status.normal_view) return "failed";
  if (component === "login" && !status.login) return "failed";

  // If this component is affected by a higher level failure, show it as affected
  if (component === "nvr" && !status.onu) return "affected";
  if (component === "hdd" && (!status.onu || !status.nvr)) return "affected";
  if (component === "view" && (!status.onu || !status.nvr)) return "affected";
  if (component === "login" && (!status.onu || !status.nvr)) return "affected";

  return "normal";
}

// Get component styling based on status
export function getComponentStyling(status: string): string {
  switch (status) {
    case "failed":
      return "bg-red-500/5 border-red-500/20 shadow-[inset_0_0_10px_rgba(239,68,68,0.05)]";
    case "affected":
      return "bg-orange-500/5 border-orange-500/20 shadow-[inset_0_0_10px_rgba(251,146,60,0.05)]";
    default:
      return "bg-slate-950/40 border-slate-800";
  }
}

// Get component icon color
export function getComponentIconColor(status: string): string {
  switch (status) {
    case "failed":
      return "text-red-400";
    case "affected":
      return "text-orange-400";
    default:
      return "text-green-500";
  }
}

// Get status color for NVR row based on issue status
export function getStatusColor(issueStatus: IssueStatus): string {
  switch (issueStatus) {
    case "onu":
      return "border-red-500/40 bg-red-500/5 hover:bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.15)]";
    case "nvr":
      return "border-orange-500/40 bg-orange-500/5 hover:bg-orange-500/10 shadow-[0_0_15px_rgba(251,146,60,0.15)]";
    case "hdd":
      return "border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.15)]";
    case "view":
      return "border-yellow-500/40 bg-yellow-500/5 hover:bg-yellow-500/10 shadow-[0_0_15px_rgba(234,179,8,0.15)]";
    case "login":
      return "border-lime-500/40 bg-lime-500/5 hover:bg-lime-500/10 shadow-[0_0_15px_rgba(163,230,53,0.15)]";
    default:
      return "border-slate-800 bg-slate-900/40 hover:bg-slate-900/60";
  }
}
