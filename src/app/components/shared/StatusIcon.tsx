import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/app/utils";

interface StatusIconProps {
  status: boolean;
  className?: string;
  size?: number;
}

export function StatusIcon({ status, className, size = 5 }: StatusIconProps) {
  return status ? (
    <CheckCircle className={cn("size-" + size, "text-green-500", className)} />
  ) : (
    <XCircle className={cn("size-" + size, "text-red-500", className)} />
  );
}
