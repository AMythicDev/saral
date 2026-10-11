"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, Volume2, Sparkles, MessageSquare } from "lucide-react";
import { sendVoiceQuery } from "@/lib/api";
import { AnalysisResult, FollowupResult } from "@/lib/types";
import { AudioPlayer } from "./audio-player";

interface VoiceAssistantBarProps {
  activeContext: AnalysisResult | null;
  targetLanguage: string;
  onAnalysisReceived: (result: AnalysisResult) => void;
  disabled?: boolean;
}

export function VoiceAssistantBar({
  activeContext,
  targetLanguage,
  onAnalysisReceived,
  disabled,
}: VoiceAssistantBarProps) {
  const [isRecording, setIsRecording] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [recordingSeconds, setRecordingSeconds] = React.useState(0);
  const [liveAnswer, setLiveAnswer] = React.useState<FollowupResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    setError(null);
    setLiveAnswer(null);
    setRecordingSeconds(0);
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
        if (timerRef.current) clearInterval(timerRef.current);
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        stream.getTracks().forEach((track) => track.stop());
        await processVoiceInput(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setError(
        err?.message || "Could not access microphone. Please check browser permissions."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const response = await sendVoiceQuery(audioBlob, activeContext, targetLanguage);
      
      // If it returned a full document analysis (because no previous document was active)
      if ("document_type" in response) {
        onAnalysisReceived(response as AnalysisResult);
      } else {
        // It returned a follow-up answer
        setLiveAnswer(response as FollowupResult);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to process voice query.");
    } finally {
      setIsProcessing(false);
      setRecordingSeconds(0);
    }
  };

  return (
    <div className="rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-orange-500/10 p-4 sm:p-5 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-primary" />
              Always-On Voice Assistant (Sarvam Saaras STT & Bulbul TTS)
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {activeContext
              ? "Ask any question about the analyzed document in your regional language."
              : "Speak anything directly — describe an SMS you received, ask about a bill, or check a scam."}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isRecording ? (
            <Button
              type="button"
              variant="destructive"
              onClick={stopRecording}
              className="w-full sm:w-auto gap-2 animate-pulse shadow-md font-semibold"
            >
              <Square className="w-4 h-4 fill-current" />
              Stop ({recordingSeconds}s)
            </Button>
          ) : (
            <Button
              type="button"
              variant="default"
              onClick={startRecording}
              disabled={disabled || isProcessing}
              className="w-full sm:w-auto gap-2 font-semibold shadow-sm px-5"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Understanding & Speaking...
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Tap to Speak
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {isRecording && (
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs animate-pulse">
          <span className="h-2 w-2 rounded-full bg-destructive animate-ping" />
          <span>Listening to your voice... Speak clearly in your language. Press Stop when done.</span>
        </div>
      )}

      {error && (
        <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive text-xs border border-destructive/20">
          {error}
        </div>
      )}

      {liveAnswer && (
        <div className="p-4 rounded-xl bg-background border border-primary/20 space-y-3 mt-2 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {liveAnswer.translated_answer || liveAnswer.answer}
              </p>
              {liveAnswer.translated_answer && (
                <p className="text-xs text-muted-foreground italic">
                  English: {liveAnswer.answer}
                </p>
              )}
            </div>
          </div>

          {liveAnswer.audio_base64 && (
            <AudioPlayer
              audioBase64={liveAnswer.audio_base64}
              autoPlay={true}
              label="Listen to Voice Response"
            />
          )}
        </div>
      )}
    </div>
  );
}
