# 🧾 Saral (सरल) — Bill & Letter Explainer
> **"Apna Bill Samjho, Dhokhadhadi Se Bacho"**  
> An AI-powered explainer and fraud detector for bills, legal notices, and SMS alerts in Indian languages, powered by **Sarvam AI**.

---

## 🏆 Why It Wins for a Hackathon

1. **All 5 Sarvam AI Capabilities in One Cohesive Pipeline:**
   - 👁️ **Sarvam Doc AI (Vision)**: Extracts text from uploaded invoices, electricity bills, and scanned legal notices.
   - 🧠 **Sarvam LLM (`sarvam-105b`)**: Extracts structured metadata (amounts, dates, action items) and analyzes scam risk.
   - 🌐 **Sarvam Translate**: Translates plain-language explanations into 12+ Indian languages (Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, etc.).
   - 🔊 **Sarvam Bulbul (TTS)**: Reads the translated summary aloud in natural regional voices.
   - 🎙️ **Sarvam Saaras (STT)**: Enables voice follow-up questions in regional languages.

2. **Scam-Check Bonus Feature**:
   - Evaluates urgency pressure, fake UPI handles, spoofed sender domains, and threats of arrest/disconnection.
   - Gives an instant color-coded risk flag: **✅ Looks Legitimate**, **⚠️ Suspicious**, or **🚨 Likely Scam**.

3. **Zero Complex Infrastructure**:
   - Pure stateless pipeline. No database, no logins, no persistent storage needed.
   - Clean architecture: **FastAPI backend** + **Next.js 16 / shadcn/ui frontend**.

---

## 🏗️ Architecture

```
User (Browser)
   │
   ├── 📷 Uploads Bill/Notice (PDF/Image)  OR  📱 Pastes SMS/Text
   │
   ▼
[FastAPI Backend] ───────► 1. Sarvam Doc AI (Digitise & Extract)
   │
   ├────────────────────► 2. Sarvam LLM (sarvam-105b with Structured JSON Schema)
   │                         • Document Type & Issuer
   │                         • Amount Due & Due Date
   │                         • Plain-Language Summary
   │                         • Action Items Checklist
   │                         • Scam Risk Flag (normal | suspicious | likely_scam)
   │
   ├────────────────────► 3. Sarvam Translate (Translate to User's Regional Language)
   │
   ├────────────────────► 4. Sarvam Bulbul TTS (Generate Voice Narration)
   │
   ▼
[Next.js + shadcn UI] ◄── Returns JSON + Audio Base64 (Interactive Audio Player)
   │
   └── 🎙️ Voice Follow-up (Saaras STT) ──► Asks questions by speaking into microphone!
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- Sarvam AI API Key ([dashboard.sarvam.ai](https://dashboard.sarvam.ai))

### 2. Configure API Key
```bash
cp backend/.env.example backend/.env
# Open backend/.env and add:
# SARVAM_API_KEY=your_actual_sarvam_api_key
```

### 3. Run Backend (FastAPI)
```bash
cd backend
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
./venv/bin/uvicorn app.main:app --reload --port 8000
```
Backend will be live at `http://localhost:8000`. Test docs at `http://localhost:8000/docs`.

### 4. Run Frontend (Next.js + shadcn/ui)
```bash
cd frontend
npm install
npm run dev
```
Frontend will be live at `http://localhost:3000`.

*(Alternatively, use `make dev` from the project root).*

---

## 🧪 Demo Test Scenarios

Use the built-in quick presets on the **Paste SMS/Text** tab:

| Scenario | Input Type | Expected Risk Badge | Audio Voice |
|---|---|---|---|
| **BSES Electricity Bill** | Document or Text | ✅ **Looks Legitimate** | Explains bill, subsidy & due date in Hindi/Tamil/etc. |
| **SBI YONO Block Threat** | SMS | 🚨 **Likely Scam Detected** | Flags urgent 24h deadline, unofficial URL, fake block threat |
| **Electricity Cutoff Threat** | SMS | 🚨 **Likely Scam Detected** | Flags informal officer phone number, personal GPay transfer |
| **Income Tax Refund Alert** | SMS/Text | ⚠️ **Suspicious / Caution** | Warns about UPI PIN request on non-gov domain |

---

## 📂 Project Structure

```
servam-ps/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application, CORS, health & routes
│   │   ├── pipeline.py          # 5-step Sarvam AI orchestration pipeline
│   │   ├── prompts.py           # Scam detection indicators & JSON schemas
│   │   ├── sarvam_client.py     # Lazy singleton SarvamAI client
│   │   └── schemas.py           # Pydantic models for structured validation
│   ├── requirements.txt         # sarvamai, fastapi, uvicorn, python-multipart
│   ├── .env.example
│   └── Makefile
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # Main interactive dashboard
│   │   │   └── layout.tsx       # Root layout & branding metadata
│   │   ├── components/
│   │   │   ├── upload-zone.tsx       # Drag-and-drop file upload + SMS paste
│   │   │   ├── analysis-card.tsx     # Structured results, alerts & checklist
│   │   │   ├── audio-player.tsx      # Inline audio player for Bulbul TTS
│   │   │   ├── risk-badge.tsx        # Color-coded fraud indicator badge
│   │   │   ├── voice-recorder.tsx    # Follow-up audio recording (Saaras STT)
│   │   │   ├── language-selector.tsx # Regional language picker (12+ languages)
│   │   │   └── loading-skeleton.tsx  # Dynamic Sarvam pipeline step animator
│   │   ├── lib/
│   │   │   ├── api.ts           # Fetch API wrapper
│   │   │   ├── constants.ts     # Language list & demo presets
│   │   │   └── types.ts         # TypeScript interfaces
│   │   └── components/ui/       # shadcn/ui component primitives
│   ├── package.json
│   └── next.config.ts
├── Makefile
└── README.md
```
