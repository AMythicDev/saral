"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SAMPLE_TEXTS } from "@/lib/constants";
import { UploadCloud, MessageSquareText, FileText, X, Sparkles } from "lucide-react";

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

  return (
    <Card className="border-border/60 shadow-sm overflow-hidden">
      <CardContent className="p-4 sm:p-6">
        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-sm mb-4">
            <TabsTrigger value="file" className="flex items-center gap-2">
              <UploadCloud className="w-4 h-4" />
              Upload Bill/Doc
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-2">
              <MessageSquareText className="w-4 h-4" />
              Paste SMS/Text
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
            <textarea
              value={rawText}
              onChange={(e) => onRawTextChange(e.target.value)}
              disabled={disabled}
              rows={6}
              placeholder="Paste SMS alert, WhatsApp notice, or bill text here... (e.g. 'Dear SBI customer, your electricity will be disconnected tonight...')"
              className="w-full rounded-xl border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
            />

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
        </Tabs>
      </CardContent>
    </Card>
  );
}
