"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, Languages, ScanText, Volume2 } from "lucide-react";

export function LoadingSkeleton() {
  const [stepIndex, setStepIndex] = React.useState(0);

  const steps = [
    { label: "Scanning document & extracting text (Sarvam Doc AI)...", icon: ScanText },
    { label: "Analyzing contents & checking fraud signals (Sarvam LLM)...", icon: Bot },
    { label: "Translating to your preferred Indian language (Sarvam Translate)...", icon: Languages },
    { label: "Synthesizing voice explanation (Sarvam Bulbul TTS)...", icon: Volume2 },
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(timer);
  }, [steps.length]);

  const CurrentIcon = steps[stepIndex].icon;

  return (
    <Card className="border-border/60 shadow-sm animate-pulse overflow-hidden">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0 animate-spin">
            <CurrentIcon className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-foreground">
            {steps[stepIndex].label}
          </span>
        </div>

        <div className="flex justify-between items-center gap-4">
          <Skeleton className="h-7 w-48 rounded-md" />
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        <Skeleton className="h-14 w-full rounded-xl" />
      </CardContent>
    </Card>
  );
}
