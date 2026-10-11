"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SAMPLE_TEXTS } from "@/lib/constants";
import { transcribeAudio } from "@/lib/api";
import {
  UploadCloud,
  MessageSquareText,
  FileText,
  X,
  Sparkles,
  Mic,
  Square,
  Loader2,
} from "lucide-react";

interface UploadZoneProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  rawText: string;
  onRawTextChange: (text: string) => void;
  disabled?: boolean;
}

export function UploadZone({
  file,
  onFileSelect,
  rawText,
  onRawTextChange,
  disabled,
}: UploadZoneProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const [isTranscribing, setIsTranscribing] = React.useState(false);
  const [recordingSeconds, setRecordingSeconds] = React.useState(0);
  const [voiceError, setVoiceError] = React.useState<string | null>(null);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleClearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Voice recording & transcription
  const startRecording = async () => {
    setVoiceError(null);
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
        await handleAudioTranscribe(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setVoiceError(err?.message || "Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleAudioTranscribe = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const transcript = await transcribeAudio(audioBlob);
      if (transcript) {
        onRawTextChange(rawText ? `${rawText} ${transcript}` : transcript);
      }
    } catch (err: any) {
      setVoiceError(err?.message || "Failed to transcribe speech.");
    } finally {
      setIsTranscribing(false);
      setRecordingSeconds(0);
    }
  };

  return (
    <Card className="border-border/60 shadow-sm overflow-hidden">
      <CardContent className="p-4 sm:p-6">
        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-md mb-4">
            <TabsTrigger value="file" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <UploadCloud className="w-4 h-4" />
              Upload Bill
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <MessageSquareText className="w-4 h-4" />
              Paste SMS
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Mic className="w-4 h-4 text-primary" />
              Speak Voice
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: File Upload */}
          <TabsContent value="file" className="mt-0">
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
              className="hidden"
              onChange={handleFileInput}
              disabled={disabled}
            />

            <div
              onClick={() => !disabled && fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[220px] ${
                isDragging
                  ? "border-primary bg-primary/5 scale-[0.99]"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
              } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground text-sm sm:text-base max-w-[280px] sm:max-w-md truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB • Click or drop another to replace
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFile}
                    className="h-7 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="w-3.5 h-3.5 mr-1" />
                    Remove file
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="font-medium text-sm sm:text-base text-foreground">
                      Click to upload or drag & drop photo / PDF
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Electricity bill, water tax, court notice, hospital invoice (JPG, PNG, PDF up to 200MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab 2: Text / SMS Paste */}
          <TabsContent value="text" className="mt-0 space-y-3">
            <div className="relative">
              <textarea
                value={rawText}
                onChange={(e) => onRawTextChange(e.target.value)}
                disabled={disabled}
                rows={6}
                placeholder="Paste SMS alert, WhatsApp notice, or bill text here... (e.g. 'Dear SBI customer, your electricity will be disconnected tonight...')"
                className="w-full rounded-xl border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              />

              {/* Dictate into Textarea */}
              <div className="absolute right-2.5 bottom-3">
                {isRecording ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={stopRecording}
                    className="h-7 text-xs gap-1.5 animate-pulse"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    Stop ({recordingSeconds}s)
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={startRecording}
                    disabled={disabled || isTranscribing}
                    className="h-7 text-xs gap-1"
                  >
                    {isTranscribing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Mic className="w-3 h-3 text-primary" />
                    )}
                    {isTranscribing ? "Transcribing..." : "Dictate Voice"}
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Demo Presets */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" /> Try sample test cases for demo:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_TEXTS.map((sample, idx) => (
                  <Button
                    key={idx}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 py-0 px-2.5 rounded-lg border-dashed"
                    onClick={() => onRawTextChange(sample.text)}
                    disabled={disabled}
                  >
                    {sample.title}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: Speak Directly */}
          <TabsContent value="voice" className="mt-0">
            <div className="border rounded-xl p-6 sm:p-8 text-center flex flex-col items-center justify-center min-h-[220px] bg-muted/20 space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Mic className="w-8 h-8" />
              </div>

              <div className="max-w-md">
                <h4 className="font-semibold text-base text-foreground">
                  Speak Your Bill or Suspicious Message
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Read out what is written on your bill or dictate the SMS you received in Hindi, Bengali, Tamil, etc. Sarvam Saaras will convert your voice to text.
                </p>
              </div>

              <div>
                {isRecording ? (
                  <Button
                    type="button"
                    size="lg"
                    variant="destructive"
                    onClick={stopRecording}
                    className="gap-2 animate-pulse px-6 shadow-md"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    Stop Recording ({recordingSeconds}s)
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="lg"
                    onClick={startRecording}
                    disabled={disabled || isTranscribing}
                    className="gap-2 px-6 shadow-md font-semibold"
                  >
                    {isTranscribing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Transcribing with Sarvam Saaras...
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        Start Speaking Now
                      </>
                    )}
                  </Button>
                )}
              </div>

              {rawText && (
                <div className="w-full text-left p-3 rounded-lg bg-background border text-xs text-foreground space-y-1">
                  <span className="font-semibold text-muted-foreground uppercase text-[10px]">
                    Transcribed Speech:
                  </span>
                  <p className="line-clamp-3">{rawText}</p>
                </div>
              )}

              {voiceError && (
                <p className="text-xs text-destructive bg-destructive/10 p-2 rounded-md">
                  {voiceError}
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
