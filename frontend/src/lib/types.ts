export type RiskLevel = "normal" | "suspicious" | "likely_scam";

export interface RiskAssessment {
  level: RiskLevel;
  reason: string;
}

export interface AnalysisResult {
  document_type: string;
  issuer: string;
  amount_due: string;
  due_date: string;
  summary: string;
  translated_summary?: string | null;
  action_items: string[];
  risk_assessment: RiskAssessment;
  audio_base64: string;
  user_prompt?: string | null;
  reminder_saved?: boolean;
}

export interface FollowupResult {
  answer: string;
  translated_answer?: string | null;
  audio_base64: string;
}

export interface ApiError {
  detail: string;
}

export interface Reminder {
  id: number;
  document_type: string;
  issuer: string;
  amount_due: string;
  due_date: string;
  due_date_parsed: string | null;
  summary: string;
  risk_level: string;
  created_at: string;
  is_dismissed: boolean;
}

export interface ReminderListResponse {
  reminders: Reminder[];
  count: number;
}
