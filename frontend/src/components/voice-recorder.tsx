"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, MessageCircleQuestion } from "lucide-react";
import { askFollowup } from "@/lib/api";
import { AnalysisResult, FollowupResult } from "@/lib/types";
import { AudioPlayer } from "./audio-player";

interface VoiceRecorderProps {
  context: AnalysisResult;
  targetLanguage: string;
}

export function VoiceRecorder({ context, targetLanguage }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [followupResult, setFollowupResult] = React.useState<FollowupResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        stream.getTracks().forEach((track) => track.stop());
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      setError(
        err?.message || "Could not access microphone. Please check permissions."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const result = await askFollowup(audioBlob, context, targetLanguage);
      setFollowupResult(result);
    } catch (err: any) {
      setError(err?.message || "Failed to process follow-up question.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/70">
        <div>
          <h4 className="text-sm font-semibold flex items-center gap-1.5">
            <MessageCircleQuestion className="w-4 h-4 text-primary" />
            Have a question about this bill/letter?
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Press record and speak your question in your language (Sarvam Saaras STT)
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isRecording ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={stopRecording}
              className="gap-2 animate-pulse w-full sm:w-auto"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              Stop Recording
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={startRecording}
              disabled={isProcessing}
              className="gap-2 w-full sm:w-auto"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Transcribing & Answering...
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-primary" />
                  Ask with Voice
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-lg">
          {error}
        </p>
      )}

      {followupResult && (
        <div className="p-4 rounded-xl border border-primary/20 bg-background space-y-3">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Answer:
            </span>
            <p className="text-sm text-foreground leading-relaxed">
              {followupResult.translated_answer || followupResult.answer}
            </p>
            {followupResult.translated_answer && (
              <p className="text-xs text-muted-foreground italic mt-1">
                English: {followupResult.answer}
              </p>
            )}
          </div>

          {followupResult.audio_base64 && (
            <AudioPlayer
              audioBase64={followupResult.audio_base64}
              autoPlay={true}
              label="Listen to Answer"
            />
          )}
        </div>
      )}
    </div>
  );
}
