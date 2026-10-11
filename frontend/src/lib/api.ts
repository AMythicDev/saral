import { AnalysisResult, FollowupResult, Reminder, ReminderListResponse } from "./types";

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

export async function transcribeAudio(
  audioBlob: Blob,
  mode: string = "transcribe"
): Promise<string> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "voice_input.wav");
  formData.append("mode", mode);

  const res = await fetch(`${API_BASE}/api/transcribe`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let errorMessage = `Transcription error: ${res.status}`;
    try {
      const err = await res.json();
      if (err.detail) errorMessage = err.detail;
    } catch {
      // fallback
    }
    throw new Error(errorMessage);
  }

  const data = await res.json();
  return data.transcript || "";
}

export async function sendVoiceQuery(
  audioBlob: Blob,
  context: AnalysisResult | null,
  targetLanguage: string
): Promise<AnalysisResult | FollowupResult> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "voice_query.wav");
  if (context) {
    formData.append("context", JSON.stringify(context));
  }
  formData.append("target_language", targetLanguage);

  const res = await fetch(`${API_BASE}/api/voice-query`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let errorMessage = `Voice query error: ${res.status}`;
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

export async function getReminders(includeDismissed = false): Promise<ReminderListResponse> {
  const res = await fetch(
    `${API_BASE}/api/reminders?include_dismissed=${includeDismissed}`
  );
  if (!res.ok) throw new Error(`Failed to fetch reminders: ${res.status}`);
  return res.json();
}

export async function saveReminder(data: {
  document_type: string;
  issuer: string;
  amount_due: string;
  due_date: string;
  summary: string;
  risk_level: string;
}): Promise<Reminder> {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => formData.append(key, value));

  const res = await fetch(`${API_BASE}/api/reminders`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`Failed to save reminder: ${res.status}`);
  return res.json();
}

export async function dismissReminder(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/reminders/${id}/dismiss`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error(`Failed to dismiss reminder: ${res.status}`);
}

export async function deleteReminder(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/reminders/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Failed to delete reminder: ${res.status}`);
}
