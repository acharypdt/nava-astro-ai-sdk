# ?? NavaAstro AI Platform

[![npm version](https://img.shields.io/npm/v/nava-astro-sdk?label=npm&color=blue)](https://www.npmjs.com/package/nava-astro-sdk)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](https://opensource.org/licenses/AGPL-3.0)
[![GitHub](https://img.shields.io/github/stars/acharypdt/nava-astro-ai-sdk?style=social)](https://github.com/acharypdt/nava-astro-ai-sdk)

**??-???????: Enterprise-Grade Vedic Astrology AI SDK & Platform**

An indigenous, autonomous AI-powered Vedic Astrology platform built on modern cloud infrastructure (Cloudflare Workers, D1, R2) with 100% dynamic rule evaluation and AI-driven chart interpretation.

---

## ?? About This Project

**NavaAstro** is a revolutionary platform combining ancient Vedic astrological wisdom with cutting-edge artificial intelligence technology. This project provides:

- **?? Precise Astronomical Calculations** - Birth chart (??????) computation with sub-second accuracy
- **?? AI-Powered Interpretation** - Heuristic and model-driven analysis of astrological patterns
- **? Headless JSON API** - RESTful endpoints for third-party integrations
- **?? Serverless Architecture** - Built on Cloudflare Workers for global scalability
- **?? Dynamic Rule Engine** - Rule evaluation system supporting ??? (yoga) and ??? (dosha) detection
- **?? Multi-Language Support** - Sanskrit, Hindi, and English interfaces

### ?? Core Capabilities

1. **Natal Chart Analysis (???? ?????? ????????)**
   - Birth time, location, and date-based chart calculation
   - 12-house analysis with planetary positions
   - Nakshatra and Rashi determination
   - Ascendant (????) and Dasha period computation

2. **Astrological Pattern Detection**
   - Yoga identification (??? ???, ?? ???, etc.)
   - Dosha detection (??????? ???, etc.)
   - Aspect (??????) analysis and planetary relationships
   - Transit (????) impact assessment

3. **AI-Driven Insights**
   - Question-based chart interpretation
   - Personalized astrological guidance
   - Contextual explanations of astrological concepts
   - Glossary with Sanskrit/Hindi astrological terms

4. **API Integration**
   - Production-ready JSON API
   - Standalone SDK for client/server environments
   - Cloud database integration (D1)
   - RAG-enabled AI search (Managed AI Search)

---

## ?? Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Gemini API key (for AI features)

### Installation & Setup

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/acharypdt/nava-astro-ai-sdk.git
   cd nava-astro-ai-sdk
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Add your API keys:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   CLOUDFLARE_ACCOUNT_ID=your_cf_account_id
   CLOUDFLARE_API_TOKEN=your_cf_api_token
   ```

3. **Run locally:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Build for production:**
   ```bash
   npm run build
   npm run start
   ```

---

## ?? Project Structure

```
navaastro/
+-- app/                      # Next.js App Router
�   +-- page.tsx              # Main dashboard UI
�   +-- layout.tsx            # Root layout with metadata
�   +-- api/                  # API routes (astrology endpoints)
�   +-- applet/               # Reusable UI components
�
+-- lib/                      # Core SDK & Logic
�   +-- astrology-sdk.ts      # Main SDK class (analyze, resolveQuestion)
�   +-- astro-core.ts         # Astronomical calculations
�   +-- evaluator.ts          # Rule evaluation engine
�   +-- utils.ts              # Utility functions
�
+-- hooks/                    # React custom hooks
+-- migrations/               # Database migrations (D1)
�
+-- next.config.ts            # Next.js configuration
+-- tsconfig.json             # TypeScript configuration
+-- tailwind.config.js        # Tailwind CSS setup
+-- wrangler.jsonc            # Cloudflare Workers config
�
+-- README.md                 # This file
```

---

## ??? Tech Stack

### Frontend
- **Framework:** Next.js 15 (React 19)
- **Styling:** Tailwind CSS 4 + PostCSS
- **Animations:** Motion (Framer Motion alternative)
- **UI Components:** Lucide React icons, custom shadcn-inspired components
- **Forms:** React Hook Form + Zod validation

### Backend & Infrastructure
- **Runtime:** Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite)
- **Storage:** Cloudflare R2
- **API Framework:** Next.js API Routes

### AI & Computation
- **AI Model:** Google Gemini API
- **Cloudflare AI:** Workers AI, Managed AI Search (RAG)
- **Astro Libraries:**
  - `astronomy-engine` - Precise astronomical calculations
  - `swisseph-wasm` - Swiss Ephemeris (WebAssembly)

### Development Tools
- **Linting:** ESLint 9
- **Package Manager:** npm
- **Type Safety:** TypeScript 5.9
- **Testing:** (add testing framework as needed)

---

## ?? SDK Usage

### Basic Chart Analysis

```typescript
import { NavaAstroSDK } from 'nava-astro-sdk';

const sdk = new NavaAstroSDK({
  apiKey: process.env.GEMINI_API_KEY,
  env: env // Cloudflare env bindings
});

const result = await sdk.analyze({
  year: 1990,
  month: 5,
  day: 24,
  hour: 14,
  minute: 30,
  latitude: 25.2048,
  longitude: 75.8362,
  timezone_offset: 5.5,
  location: 'Indore, India'
});

console.log(result.math);      // Astrological data
console.log(result.activeRules); // Detected yogas/doshas
console.log(result.aiReport);   // AI interpretation
```

### AI-Powered Question Resolution

```typescript
const answer = await sdk.resolveQuestionWithAI(
  'What does my chart say about my career?',
  result.math
);
console.log(answer);
```

---

## ?? API Endpoints

### POST `/api/astro-engine`
Analyze a birth chart and get astrological insights.

**Request:**
```json
{
  "year": 1990,
  "month": 5,
  "day": 24,
  "hour": 14,
  "minute": 30,
  "latitude": 25.2048,
  "longitude": 75.8362,
  "timezone_offset": 5.5,
  "location": "Indore, India"
}
```

**Response:**
```json
{
  "math": { ... },
  "activeRules": [
    { "name": "Raja Yoga", "category": "positive_yoga" },
    { "name": "Manglik Dosha", "category": "dosha" }
  ],
  "aiReport": "Your chart indicates strong leadership qualities..."
}
```

---

## ?? Muhurta Support

This project now supports offline muhurta (auspicious time) recommendations directly from the SDK and through the API.

### SDK Usage

```ts
import { NavaAstroSDK } from 'nava-astro-sdk';

const sdk = new NavaAstroSDK();
const results = await sdk.findMuhurtas({
  year: 1990,
  month: 1,
  day: 1,
  hour: 6,
  minute: 0,
  lat: 28.6139,
  lng: 77.2090,
  timezone: 5.5,
  ayanamsa: 'LAHIRI',
  gender: 'Male',
  birthLocation: 'Delhi, India',
  report_type: 'General'
}, {
  rangeHours: 24,
  stepMinutes: 30,
  top: 5
});

console.log(results);
```

### API Usage

POST `/api/astro-engine/muhurta`

```bash
curl -X POST http://localhost:3000/api/astro-engine/muhurta \
  -H "Content-Type: application/json" \
  -d '{
    "birth_data": {
      "year":1990,
      "month":1,
      "day":1,
      "hour":6,
      "minute":0,
      "lat":28.6139,
      "lng":77.2090,
      "timezone":5.5
    },
    "options": {
      "rangeHours": 24,
      "stepMinutes": 30,
      "top": 5
    }
  }'
```

---

## ?? Development

### Running Tests
```bash
npm run test
```

### Linting
```bash
npm run lint
npm run lint -- --fix
```

### Building
```bash
npm run build
```

### Cleaning Build Cache
```bash
npm run clean
```

---

## ?? Deployment

### Deploy to Cloudflare Workers

```bash
wrangler deploy
```

### Deploy to Vercel (Frontend)

```bash
vercel deploy
```

---

## ?? Environment Variables

Create a `.env.local` file with:

```env
# AI & APIs
GEMINI_API_KEY=your_gemini_key
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token

# Database (if self-hosted)
DATABASE_URL=your_database_url
```

---

## ?? Astrological Concepts Reference

The platform uses authentic Vedic astrology terminology:

- **?????? (Kundli):** Birth chart showing planetary positions
- **???? (Ascendant):** Rising sign at birth time
- **???? (Rasi):** Zodiac sign (30� segments)
- **??? (Bhava):** House system (12 divisions of life)
- **??????? (Nakshatra):** 27 lunar mansions
- **??? (Yoga):** Auspicious planetary combinations
- **??? (Dosha):** Inauspicious planetary combinations
- **?????? (Mahadasha):** Major planetary periods
- **???? (Transit):** Current planetary movements

---

## ?? License

AGPL-3.0 © NavaAstro. See [LICENSE](./LICENSE) for details.

---

## ?? Support & Contact

For questions, feature requests, or collaborations:

- **GitHub:** [@acharypdt](https://github.com/acharypdt)
- **Organization:** NavaSanganakah Multiventures
- **Knowledge Partner:** Yagya Ashram

---

## ?? Acknowledgments

This platform stands on the shoulders of:
- Ancient Vedic astrological knowledge
- Modern AI and cloud technologies
- The astronomy-engine and Swiss Ephemeris libraries
- Cloudflare's serverless infrastructure

---

**Built with ?? by Acharya Pandit Dheerendra Tripathi & Team**
