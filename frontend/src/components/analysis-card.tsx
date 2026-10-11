"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AnalysisResult } from "@/lib/types";
import { RiskBadge } from "./risk-badge";
import { AudioPlayer } from "./audio-player";
import { VoiceRecorder } from "./voice-recorder";
import {
  Calendar,
  IndianRupee,
  Building2,
  FileCheck2,
  ListTodo,
  AlertOctagon,
  Sparkles,
} from "lucide-react";

interface AnalysisCardProps {
  result: AnalysisResult;
  targetLanguage: string;
}

export function AnalysisCard({ result, targetLanguage }: AnalysisCardProps) {
  const isScam = result.risk_assessment.level === "likely_scam";
  const isSuspicious = result.risk_assessment.level === "suspicious";

  return (
    <Card className={`border shadow-md overflow-hidden transition-all ${
      isScam
        ? "border-red-500/40 bg-red-500/[0.02]"
        : isSuspicious
        ? "border-amber-500/40 bg-amber-500/[0.02]"
        : "border-border/70"
    }`}>
      <CardHeader className="p-4 sm:p-6 pb-4 border-b bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary uppercase tracking-wider">
                {result.document_type.replace(/_/g, " ")}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {result.issuer}
              </span>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">
              Document Analysis
            </CardTitle>
          </div>

          <RiskBadge level={result.risk_assessment.level} />
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Scam Warning Alert Box (for suspicious or likely_scam) */}
        {(isScam || isSuspicious) && (
          <Alert variant={isScam ? "destructive" : "default"} className={`${
            isSuspicious ? "border-amber-500/50 text-amber-900 dark:text-amber-200 bg-amber-500/10" : ""
          }`}>
            <AlertOctagon className="h-4 w-4" />
            <AlertTitle className="font-bold">
              {isScam ? "High Risk: Fraud or Scam Signals Detected" : "Caution: Potential Irregularities"}
            </AlertTitle>
            <AlertDescription className="text-xs sm:text-sm mt-1 leading-relaxed">
              {result.risk_assessment.reason}
            </AlertDescription>
          </Alert>
        )}

        {/* Financial Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-3.5 rounded-xl border bg-card/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Amount Due</p>
              <p className="text-lg font-bold text-foreground">
                {result.amount_due}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border bg-card/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Due Date / Deadline</p>
              <p className="text-lg font-bold text-foreground">
                {result.due_date}
              </p>
            </div>
          </div>
        </div>

        {/* Audio Narration Section */}
        {result.audio_base64 && (
          <AudioPlayer
            audioBase64={result.audio_base64}
            autoPlay={true}
            label="Listen in Regional Language (Sarvam Bulbul TTS)"
          />
        )}

        {/* Plain Language Summary */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
            <FileCheck2 className="w-4 h-4 text-primary" />
            What this document says:
          </h3>
          <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-2">
            <p className="text-base text-foreground font-medium leading-relaxed">
              {result.translated_summary || result.summary}
            </p>
            {result.translated_summary && (
              <p className="text-xs text-muted-foreground italic border-t pt-2 mt-2">
                Original (English): {result.summary}
              </p>
            )}
          </div>
        </div>

        {/* Action Items */}
        {result.action_items && result.action_items.length > 0 && (
          <div className="space-y-2.5">
            <h3 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
              <ListTodo className="w-4 h-4 text-primary" />
              What you should do next:
            </h3>
            <ul className="space-y-2">
              {result.action_items.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-sm p-2.5 rounded-lg bg-card border text-foreground"
                >
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Separator />

        {/* Voice Follow-up Q&A */}
        <VoiceRecorder context={result} targetLanguage={targetLanguage} />
      </CardContent>
    </Card>
  );
}
