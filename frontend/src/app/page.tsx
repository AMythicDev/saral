"use client";

import * as React from "react";
import { UploadZone } from "@/components/upload-zone";
import { LanguageSelector } from "@/components/language-selector";
import { AnalysisCard } from "@/components/analysis-card";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { VoiceAssistantBar } from "@/components/voice-assistant-bar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DEFAULT_DEMO_RESULT, DEFAULT_LANGUAGE } from "@/lib/constants";
import { analyzeDocument, checkBackendHealth } from "@/lib/api";
import { AnalysisResult } from "@/lib/types";
import {
  ShieldAlert,
  Sparkles,
  Zap,
  Info,
  CheckCircle2,
  FileCheck2,
  FileSearch,
  Volume2,
} from "lucide-react";

export default function Home() {
  const [selectedLanguage, setSelectedLanguage] = React.useState(DEFAULT_LANGUAGE);
  const [file, setFile] = React.useState<File | null>(null);
  const [rawText, setRawText] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<AnalysisResult | null>(DEFAULT_DEMO_RESULT);
  const [error, setError] = React.useState<string | null>(null);
  const [backendOnline, setBackendOnline] = React.useState<boolean | null>(null);

  // Check backend health on mount
  React.useEffect(() => {
    checkBackendHealth().then((isOk) => setBackendOnline(isOk));
  }, []);

  const handleAnalyze = async () => {
    if (!file && !rawText.trim()) {
      setError("Please upload a document file or paste an SMS message to analyze.");
      return;
    }

    setError(null);
    setIsLoading(true);
    setAnalysisResult(null);

    try {
      const result = await analyzeDocument(file, rawText.trim() ? rawText : null, selectedLanguage);
      setAnalysisResult(result);
    } catch (err: any) {
      setError(
        err?.message || "Analysis failed. Please make sure the backend is running and SARVAM_API_KEY is configured."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setRawText("");
    setAnalysisResult(null);
    setError(null);
  };

  const hasInput = Boolean(file || rawText.trim());

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      {/* Top Banner / Navbar */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center font-bold text-lg shadow-sm">
              स
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg sm:text-xl tracking-tight leading-none text-foreground">
                  Saral
                </h1>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  सरल
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full border border-primary/20 bg-primary/5 text-primary font-medium hidden sm:inline-flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Scam-Check Active
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 hidden xs:block">
                Bill & Letter Explainer in Indian Languages
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSelector
              value={selectedLanguage}
              onChange={setSelectedLanguage}
              disabled={isLoading}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Hackathon Edition: Powered by 5 Sarvam AI Capabilities
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Apna Bill Samjho. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
              Dhokhadhadi Se Bacho.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Confusing electricity bills, legal letters, or suspicious bank SMS? Upload a photo or paste the text — get clear explanations, fraud detection, and voice narration in your own language.
          </p>
        </div>

        {/* Backend health warning if offline */}
        {backendOnline === false && (
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <Info className="h-4 w-4" />
            <AlertTitle>Backend Server Not Detected</AlertTitle>
            <AlertDescription className="text-xs">
              Make sure FastAPI backend is running on <code>http://localhost:8000</code>. Run <code>make dev</code> in the <code>backend/</code> folder.
            </AlertDescription>
          </Alert>
        )}

        {/* Always-Available Voice Chat Bar */}
        <div className="max-w-3xl mx-auto">
          <VoiceAssistantBar
            activeContext={analysisResult}
            targetLanguage={selectedLanguage}
            onAnalysisReceived={(res) => setAnalysisResult(res)}
            disabled={isLoading}
          />
        </div>

        {/* Input Card */}
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Prominent Language Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-card border shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground whitespace-nowrap">
                Select Language for Voice & Text:
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { code: "hi-IN", label: "हिन्दी" },
                { code: "bn-IN", label: "বাংলা" },
                { code: "ta-IN", label: "தமிழ்" },
                { code: "te-IN", label: "తెలుగు" },
                { code: "mr-IN", label: "मराठी" },
                { code: "en-IN", label: "English" },
              ].map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setSelectedLanguage(item.code)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                    selectedLanguage === item.code
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}

              <div className="ml-1">
                <LanguageSelector
                  value={selectedLanguage}
                  onChange={setSelectedLanguage}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <UploadZone
            file={file}
            onFileSelect={setFile}
            rawText={rawText}
            onRawTextChange={setRawText}
            disabled={isLoading}
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Free & Private
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-primary" /> Auto Fraud Detection
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-blue-600" /> Voice Readout
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {hasInput && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={isLoading}
                  className="text-xs"
                >
                  Clear
                </Button>
              )}
              <Button
                type="button"
                onClick={handleAnalyze}
                disabled={isLoading || !hasInput}
                className="w-full sm:w-auto gap-2 font-semibold shadow-sm px-6"
              >
                <Zap className="w-4 h-4 fill-current" />
                {isLoading ? "Analyzing Document..." : "Explain & Check Scam"}
              </Button>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <Alert variant="destructive" className="max-w-3xl mx-auto">
            <AlertTitle>Analysis Error</AlertTitle>
            <AlertDescription className="text-xs sm:text-sm mt-1">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="max-w-3xl mx-auto">
            <LoadingSkeleton />
          </div>
        )}

        {/* Results */}
        {analysisResult && !isLoading && (
          <div className="max-w-3xl mx-auto space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-primary" />
                Bill & Letter Explainer
              </h3>
              {analysisResult.issuer === "BSES Rajdhani Power Limited" && !file && !rawText && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  Sample Preview (Upload or Speak Above to Analyze Your Own)
                </span>
              )}
            </div>
            <AnalysisCard
              result={analysisResult}
              targetLanguage={selectedLanguage}
            />
          </div>
        )}

        {/* Feature Badges / Hackathon Info Footer */}
        <div className="max-w-3xl mx-auto pt-8 border-t border-border/60">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-card border">
              <p className="text-xs text-muted-foreground">Document Vision</p>
              <p className="text-sm font-semibold mt-0.5">Sarvam Doc AI</p>
            </div>
            <div className="p-3 rounded-xl bg-card border">
              <p className="text-xs text-muted-foreground">LLM & Reasoning</p>
              <p className="text-sm font-semibold mt-0.5">Sarvam-105b</p>
            </div>
            <div className="p-3 rounded-xl bg-card border">
              <p className="text-xs text-muted-foreground">Localization</p>
              <p className="text-sm font-semibold mt-0.5">Sarvam Translate</p>
            </div>
            <div className="p-3 rounded-xl bg-card border">
              <p className="text-xs text-muted-foreground">Voice In & Out</p>
              <p className="text-sm font-semibold mt-0.5">Bulbul & Saaras</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
