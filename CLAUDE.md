# CLAUDE.md — Phone Reputation Scorer API

## Project Overview

This is a side hustle API project built to generate passive income. The goal is to run it at zero cost, list it on API marketplaces, and let it earn money without requiring active maintenance. It is NOT a main focus — it is designed to be lightweight, self-sustaining, and low-effort to manage.

The API scores any phone number's reputation using real carrier data from numlookupapi.com. It detects VoIP numbers, burner phones, and invalid numbers, returning a structured risk score and recommendation. Primary use cases include fraud prevention, free trial abuse prevention, SMS verification validation, and lead quality checking.

---

## Business Model

- Listed on **RapidAPI Hub** at: `https://rapidapi.com/flusnot/api/phone-reputation-scorer`
- **Free tier:** 5 requests/hour — lets users test before committing
- **Pro tier:** $9.99/month, 50 requests/hour
- Payouts go to **PayPal**: judahroekle@gmail.com
- RapidAPI takes ~20% cut, remainder goes to PayPal automatically
- No Stripe setup needed — RapidAPI handles all billing and customer management

**Why 50 requests/hour for Pro (not higher):** The numlookupapi.com free plan only allows 100 requests/month total. Pro rate limit was kept low to avoid burning through the quota. If revenue justifies it, upgrade numlookupapi plan to increase limits.

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Phone data provider:** numlookupapi.com (free tier — 100 requests/month)
- **Key packages:** `express`, `axios`, `dotenv`
- **Hosting:** Render.com free tier
- **Repo:** https://github.com/flusnot/phone-reputation-scorer

---

## numlookupapi.com Details

- **Account:** judahroekle@gmail.com
- **Free plan:** 100 requests/month, 10 requests/minute rate limit
- **API key format:** `num_live_xxxxxxxxxxxxxxxxx`
- **Correct endpoint:** `GET https://api.numlookupapi.com/v1/validate/{phone}?apikey={key}`
- **NOTE:** The `/v1/info/` endpoint does NOT work — use `/v1/validate/` instead
- Phone number must be passed with the `+` prefix (e.g., `+14155552671`)

---

## API Endpoint

### `POST /api/score-phone`

**Authentication:** Header `x-api-key` must match `process.env.API_KEY`

**Request body:**
```json
{
  "phone_number": "+14155552671",
  "country_code": "1"
}
```

- `phone_number` — phone number in international format with `+` prefix, or local format
- `country_code` — used to normalize numbers that don't start with `+` (e.g., `"1"` for US)

**Response:**
```json
{
  "phone": "+14155552671",
  "valid": true,
  "country": "US",
  "carrier": "AT&T",
  "line_type": "mobile",
  "is_voip": false,
  "is_burner_risk": false,
  "spam_reports": 0,
  "reputation_score": 85,
  "risk_level": "low",
  "recommendation": "safe_to_accept"
}
```

**Response fields:**
- `phone` — normalized international format phone number
- `valid` — whether the number is real and dialable
- `country` — ISO country code (e.g., "US", "GB")
- `carrier` — network carrier name (may be empty for some numbers)
- `line_type` — mobile / landline / voip / special_services / prepaid / unknown
- `is_voip` — true if VoIP number detected
- `is_burner_risk` — true if number is likely a burner or prepaid
- `spam_reports` — always 0 currently (future feature placeholder)
- `reputation_score` — 0 to 100, where 100 = completely clean trusted number
- `risk_level` — one of: `low`, `medium`, `high`
- `recommendation` — one of: `safe_to_accept`, `review_manually`, `block`

**Error response:**
```json
{ "error": "lookup failed" }
```

---

## Reputation Score Logic

Starting score: 100

Deductions:
- Invalid number → score = 0
- VoIP detected → -25
- Burner/prepaid risk → -10
- Toll-free number → -10
- Prepaid line type → -15

Score thresholds:
- 70–100 → `risk_level: low`, `recommendation: safe_to_accept`
- 40–69 → `risk_level: medium`, `recommendation: review_manually`
- 0–39 → `risk_level: high`, `recommendation: block`

Toll-free detection regex: US numbers starting with 800, 888, 877, 866, 855, 844, 833

---

## Phone Number Normalization

The server normalizes input before sending to numlookupapi:
1. Strip spaces, dashes, dots, parentheses
2. If number doesn't start with `+`, prepend `+` + country_code
3. Strip leading zeros from local numbers

---

## Environment Variables

```
API_KEY=prs-mK7vX2nQpL9wJhB4tRyDzC6eF
NUMLOOKUP_API_KEY=num_live_xxxxxxxxxxxxxxxxx
PORT=3000 (Render sets this automatically to 10000)
```

- `.env` file is gitignored — never commit it
- `.env.example` is committed as a template
- On Render, environment variables are set in the dashboard under Environment tab

---

## Deployment — Render.com

- **Service URL:** `https://phone-reputation-scorer.onrender.com`
- **Plan:** Free
- **Build command:** `npm install`
- **Start command:** `node server.js`
- **Branch:** master
- **Auto-deploy:** enabled on push to master

**Important:** Free tier spins down after 15 minutes of inactivity. First request after idle takes ~30-50 seconds to wake up. This is disclosed in the RapidAPI listing description.

---

## RapidAPI Listing Details

- **Name:** Phone Reputation Scorer
- **Category:** Data / Communication
- **Short description:** Check any phone number's reputation. Returns validity, carrier, line type, VoIP detection, and a risk score.
- **Long description includes:** all returned fields explained, fraud prevention use case, 50-second cold start disclaimer, note that rate limits will increase as service grows
- **Endpoint configured:** `POST /api/score-phone`
- **Security scheme:** API Key in Header with key name `x-api-key`, value set to the API_KEY env var
- **Visibility:** Public
- **Recommended plan:** Pro

---

## RapidAPI Security Setup

RapidAPI forwards requests to Render with the `x-api-key` header automatically injected. The value stored in RapidAPI's security configuration is `prs-mK7vX2nQpL9wJhB4tRyDzC6eF`. Customers never see this key — they only use their RapidAPI key.

---

## ProductHunt Launch

- **Status:** Could not list — ProductHunt showed "URL already associated with existing product" error for both the RapidAPI link and the Render URL. Possibly a bug. Try again later by going to producthunt.com and submitting a new product.
- **Suggested tagline:** Instantly detect VoIP and burner numbers to stop fake signups and trial abuse

---

## Marketing Efforts Completed

- Reddit comment posted in r/SaaS on "How do you deal with free trial abuse? Users creating multiple accounts" thread (16 days old, active)
- Reddit comment posted in r/SaaS on "For devs with free tiers/trials: how do you handle people abusing it?" thread (3 months old, 31 comments)
- Reddit comment posted in r/Entrepreneur on "How are founders reducing fake signups without hurting real user onboarding?" thread
- Reddit comment posted in r/FulfillmentByAmazon on fake review / spam number thread
- dev.to article published: "How I built a phone number reputation API in a weekend (and listed it for sale)"

---

## Key Marketing Angle

The strongest messaging for this API is around **signup abuse and free trial farming**. People use VoIP and burner numbers to create multiple accounts and exploit rewards programs, free trials, and signup bonuses. This API catches that at the point of entry.

Sample post that performed well:
> "people are abusing your signups with fake phone numbers — built an API that catches them. run any number through it and it'll tell you if it's real, what carrier it's on, if it's a VoIP or burner, and whether to accept, review, or block it. useful for anything with SMS verification, free trials, or rewards programs"

---

## Known Limitations

1. **numlookupapi free tier is only 100 requests/month** — this is the biggest constraint. If Pro customers use the API heavily, quota will run out. Upgrade numlookupapi plan when revenue justifies it.
2. **Render free tier cold starts** — 30-50 second delay after inactivity. Disclosed in listing.
3. **Carrier field sometimes empty** — numlookupapi doesn't always return carrier name. This is a data limitation of the provider, not a bug.
4. **spam_reports always 0** — placeholder field. No free spam database was integrated. Could add this in the future using open-source spam databases.
5. **No per-customer rate limiting** — heavy free users could burn through numlookupapi quota.

---

## Future Improvements (if revenue justifies it)

- Upgrade numlookupapi plan to increase monthly request quota and Pro rate limits
- Add actual spam report lookup from a free database
- Add bulk phone number checking endpoint
- Upgrade Render to paid tier to eliminate cold starts
- Consider switching to a different phone data provider with more generous free tier

---

## File Structure

```
phone-reputation-scorer/
├── server.js         # Main Express API — single file, under 100 lines
├── package.json      # Dependencies: express, axios, dotenv
├── package-lock.json
├── Procfile          # web: node server.js
├── .env              # Secret keys — NEVER commit this
├── .env.example      # Template — committed to repo
├── .gitignore        # Ignores node_modules and .env
└── CLAUDE.md         # This file
```

---

## How to Run Locally

```bash
# Install dependencies
npm install

# Create .env file with your keys (see .env.example)

# Start server
node server.js

# Test with PowerShell
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/score-phone" -Headers @{"Content-Type"="application/json"; "x-api-key"="prs-mK7vX2nQpL9wJhB4tRyDzC6eF"} -Body '{"phone_number": "+14155552671", "country_code": "1"}'
```

---

## Account Info (for reference only — no secrets here)

- GitHub: flusnot
- RapidAPI: flusnot
- Render: connected via GitHub OAuth
- PayPal payout: judahroekle@gmail.com
- dev.to: flusnot
- numlookupapi: judahroekle@gmail.com
