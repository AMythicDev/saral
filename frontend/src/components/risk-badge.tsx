"use client";

import * as React from "react";
import { RiskLevel } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

export function RiskBadge({ level, className }: RiskBadgeProps) {
  switch (level) {
    case "normal":
      return (
        <Badge
          className={`bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 px-3 py-1 text-xs sm:text-sm font-semibold gap-1.5 ${className}`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Looks Legitimate
        </Badge>
      );
    case "suspicious":
      return (
        <Badge
          className={`bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20 px-3 py-1 text-xs sm:text-sm font-semibold gap-1.5 ${className}`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          Suspicious / Caution
        </Badge>
      );
    case "likely_scam":
      return (
        <Badge
          className={`bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30 hover:bg-red-500/20 px-3 py-1 text-xs sm:text-sm font-semibold gap-1.5 animate-pulse ${className}`}
        >
          <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />
          🚨 Likely Scam Detected
        </Badge>
      );
    default:
      return null;
  }
}
