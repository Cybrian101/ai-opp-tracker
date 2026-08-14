# Opportunity Intelligence Agent (OIA)

A voice-powered AI system that discovers, classifies, prioritizes, and recommends opportunities from across the internet for students, graduates, researchers, professionals, job seekers, founders, and career switchers.

## Features

1. **Progressive AI Intelligence Pipeline**
   - Upload your resume and instantly see the system parse skills, search a database of opportunities, perform LLM match scoring, and generate a 180-day career roadmap.
   - **Token Optimized**: Only sends full resume to initial parser; downstream pipeline nodes rely on concise structured JSON to minimize LLM token usage.

2. **Categorized Opportunity Feeds**
   - Matches are automatically categorized into: Jobs, Internships, Hackathons, Scholarships, Fellowships, Conferences, Research, and Open Source.
   - Horizontal scrolling lanes per category with AI match scores and skill gap explanations.

3. **Conversational AI & Voice Agent**
   - Click the floating mic button and say "Find remote internships" or "Show only opportunities above 80% match".
   - The Voice Agent dynamically triggers UI actions to filter your dashboard.
   - Ask complex questions like "What should I learn for Google SWE?" to get targeted advice based on your generated profile.

4. **API Key Settings & Fallback**
   - Built-in UI to securely configure your own Gemini and OpenAI API keys.
   - Keys are AES-256 encrypted in the database. The system automatically fails over to user keys if default platform limits are reached.

5. **Standalone n8n Orchestration Pipeline**
   - Want to run the pipeline visually? We provide `n8n/opportunity_pipeline.json`!
   - Import this into n8n to see a beautifully laid out, single-workflow orchestration that mimics the entire backend pipeline:
     `Webhook -> Parse Resume -> Fetch Opportunities -> Match Score -> Generate Strategy -> Save to Supabase`.

## Tech Stack

- **Frontend**: React (Vite), Zustand, Tailwind CSS, Framer Motion
- **Backend**: Express.js, Supabase (PostgreSQL), Gemini SDK
- **Orchestration**: n8n
- **Design**: Glassmorphism, Deep Navy/Cyan/Purple aesthetic.

## Setup Instructions

1. **Database Setup**
   Run the `.sql` files in `supabase/migrations/` sequentially in the Supabase SQL editor.
   This includes `001_initial_schema.sql`, `002_career_analysis.sql`, and `003_user_settings.sql`.

2. **Environment Variables**
   Create `backend/.env` with your `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, and `ENCRYPTION_KEY` (32-byte hex for AES encryption).
   Create `frontend/.env` with your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

3. **Run Backend**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

4. **Run Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Run n8n (Optional Workflow Testing)**
   Import `n8n/opportunity_pipeline.json` into a local or cloud n8n instance and configure your credentials.

---
_Built to showcase AI Engineering, semantic search, information extraction, and modern React UX._
