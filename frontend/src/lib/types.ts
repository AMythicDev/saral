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
}

export interface FollowupResult {
  answer: string;
  translated_answer?: string | null;
  audio_base64: string;
}

export interface ApiError {
  detail: string;
}
