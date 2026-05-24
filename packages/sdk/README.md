# @nava-astro/sdk

**NavaAstro AI SDK** — Open Source Vedic Astrology engine for accurate Kundali calculations, Yogas, Doshas, Dasha, Muhurta, and AI-powered analysis.

## Installation

```bash
npm install @nava-astro/sdk
```

## Quick Start

### Local Calculation (No API Key Required)

```typescript
import { NavaAstroSDK } from '@nava-astro/sdk';

const sdk = new NavaAstroSDK();
const result = await sdk.analyze({
  year: 1990, month: 5, day: 15,
  hour: 10, minute: 30,
  lat: 28.6139, lng: 77.209,  // Delhi, India
  timezone: 5.5,
  report_type: 'Career'
});

console.log(result.math.planets);     // Planetary positions
console.log(result.activeRules);      // Detected Yogas/Doshas
console.log(result.aiReport);         // Heuristic analysis report
```

### Cloud API (With API Key)

```typescript
import { NavaAstroClient } from '@nava-astro/sdk';

const client = new NavaAstroClient({
  apiKey: 'YOUR_API_KEY',
  endpoint: 'https://api.nava-astro.com/api/v1'
});

const result = await client.analyze({
  year: 1990, month: 5, day: 15,
  hour: 10, minute: 30,
  lat: 40.7128, lng: -74.006,
  timezone: -4,
  report_type: 'Marriage'
});
```

### Validate an Astrological Rule

```typescript
import { evaluateRule } from '@nava-astro/sdk';

const isManglik = evaluateRule({
  operator: 'IN_HOUSE',
  params: { planet: 'Mars', house: [1, 2, 4, 7, 8, 12] }
}, chartData);
```

### Find Muhurtas (Auspicious Times)

```typescript
const muhurtas = await sdk.findMuhurtas(birthData, {
  rangeHours: 48,
  stepMinutes: 30,
  top: 5
});
```

## API

### NavaAstroSDK

| Method | Description |
|--------|-------------|
| `analyze(params)` | Calculate chart + active rules + heuristic report |
| `findMuhurtas(params, opts)` | Find auspicious time slots |
| `validateRule(rule, data)` | Evaluate an AST rule against chart data |
| `resolveQuestionHeuristically(question, data)` | Answer questions using heuristics |

### NavaAstroClient

| Method | Description |
|--------|-------------|
| `analyze(params)` | Calculate chart via cloud API |
| `askAI(question, mathData)` | Ask AI about chart |
| `findMuhurtas(params, opts)` | Find muhurtas via cloud API |
| `getProfile()` | Get user profile |
| `getUsage()` | Get API usage stats |

## License

AGPL-3.0 © NavaAstro
