import { ReactNode } from "react";
import { NVRStatus } from "@/app/types/nvr";
import { NVRDashboard } from "./NVRDashboard";
import { NVRStatusPage } from "./NVRStatusPage";

export interface PageWrapperProps {
  nvrList: NVRStatus[];
  onPageChange: (page: "dashboard" | "status") => void;
}

export class DashboardPage {
  static render(props: PageWrapperProps): ReactNode {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <NVRDashboard nvrList={props.nvrList} onPageChange={props.onPageChange} />
      </div>
    );
  }

  static getName(): string {
    return "dashboard";
  }

  static getDisplayName(): string {
    return "Dashboard";
  }
}

export class StatusPage {
  static render(props: PageWrapperProps): ReactNode {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <NVRStatusPage nvrList={props.nvrList} onPageChange={props.onPageChange} />
      </div>
    );
  }

  static getName(): string {
    return "status";
  }

  static getDisplayName(): string {
    return "Status NVR";
  }
}

export type PageType = typeof DashboardPage | typeof StatusPage;
export type PageName = "dashboard" | "status";
