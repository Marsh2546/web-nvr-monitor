import { Wifi, Server, HardDrive, Eye, LogIn } from "lucide-react";
import { getComponentStatus, getComponentIconColor } from "@/app/utils";
import { NVRStatus } from "@/app/types/nvr";

interface ComponentStatusIndicatorProps {
  nvr: NVRStatus;
  component: "onu" | "nvr" | "hdd" | "view" | "login";
  label: string;
  className?: string;
}

const componentIcons = {
  onu: Wifi,
  nvr: Server,
  hdd: HardDrive,
  view: Eye,
  login: LogIn,
};

export function ComponentStatusIndicator({ 
  nvr, 
  component, 
  label, 
  className 
}: ComponentStatusIndicatorProps) {
  const status = getComponentStatus(nvr, component);
  const Icon = componentIcons[component];
  const iconColor = getComponentIconColor(status);

  return (
    <div className="flex flex-col items-center gap-0.5" title={label}>
      <Icon className={`size-4 ${iconColor} ${className}`} />
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
