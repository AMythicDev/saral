export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "hi-IN", name: "Hindi", nativeName: "हिन्दी" },
  { code: "bn-IN", name: "Bengali", nativeName: "বাংলা" },
  { code: "ta-IN", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te-IN", name: "Telugu", nativeName: "తెలుగు" },
  { code: "mr-IN", name: "Marathi", nativeName: "मराठी" },
  { code: "gu-IN", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "kn-IN", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "ml-IN", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "pa-IN", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "or-IN", name: "Odia", nativeName: "ଓଡ଼ିଆ" },
  { code: "as-IN", name: "Assamese", nativeName: "অসমীয়া" },
  { code: "ur-IN", name: "Urdu", nativeName: "اردو" },
  { code: "en-IN", name: "English", nativeName: "English" },
];

export const DEFAULT_LANGUAGE = "hi-IN";

export const SAMPLE_TEXTS = [
  {
    title: "Electricity Bill (Legitimate)",
    text: "BSES Rajdhani Power Limited. Bill Date: 05-Oct-2026. CA No: 151294829. Consumer: Ramesh Sharma. Units Consumed: 242 kWh. Current Demand: Rs 1,480.00. Subsidy under Delhi Govt Scheme: Rs 800.00. Net Payable Amount: Rs 680.00. Due Date: 20-Oct-2026. Pay online at bsesdelhi.com or via authorized BBPS apps.",
  },
  {
    title: "Bank KYC Threat (Likely Scam)",
    text: "Dear SBI Customer, your YONO account has been BLOCKED due to expired PAN KYC! Your account balance of Rs 84,200 is on hold. To prevent permanent deactivation and police report, immediately update your KYC within 24 hours at http://sbi-kyc-update-portal-support.cc/login or contact 9876543210 urgently.",
  },
  {
    title: "Electricity Disconnection Threat (Likely Scam)",
    text: "Dear consumer your electricity power will be disconnected tonight at 9.30 PM from power office because your previous month bill was not update. Please immediately contact our electricity officer Rahul Sharma at 8765432109 to pay your bill via GooglePay to avoid disconnection.",
  },
  {
    title: "Income Tax Refund Alert (Suspicious)",
    text: "Income Tax Department Notice: You have been approved a refund of Rs. 15,490 from assessment year 2025-26. Click the link to confirm your bank account number and UPI PIN: http://incometax-refunds-india.org/claim.",
  },
];
