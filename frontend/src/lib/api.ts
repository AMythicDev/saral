import { AnalysisResult, FollowupResult } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function analyzeDocument(
  file: File | null,
  text: string | null,
  targetLanguage: string
): Promise<AnalysisResult> {
  const formData = new FormData();
  if (file) {
    formData.append("file", file);
  }
  if (text) {
    formData.append("text", text);
  }
  formData.append("target_language", targetLanguage);

  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let errorMessage = `Server error: ${res.status}`;
    try {
      const err = await res.json();
      if (err.detail) errorMessage = err.detail;
    } catch {
      // fallback to status code
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

export async function askFollowup(
  audioBlob: Blob,
  context: AnalysisResult,
  targetLanguage: string
): Promise<FollowupResult> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "followup.wav");
  formData.append("context", JSON.stringify(context));
  formData.append("target_language", targetLanguage);

  const res = await fetch(`${API_BASE}/api/followup`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let errorMessage = `Follow-up error: ${res.status}`;
    try {
      const err = await res.json();
      if (err.detail) errorMessage = err.detail;
    } catch {
      // fallback
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}
