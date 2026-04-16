require('dotenv').config();
const express = require('express');
const axios = require('axios');

const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json());

// CORS — allow GitHub Pages demo site
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const demoLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { error: 'Too many demo requests, please wait a minute.' },
});

app.use('/demo/score', demoLimiter);

const INTL_REGEX = /^\+?[1-9]\d{6,14}$/;
const TOLL_FREE = /^\+1(800|888|877|866|855|844|833)/;
const VOIP_PREFIXES = /^\+1(500|521|522|523|524|525|526|527|528|529)/;

function auth(req, res, next) {
  if (req.headers['x-api-key'] !== process.env.API_KEY)
    return res.status(401).json({ error: 'unauthorized' });
  next();
}

function normalizePhone(phone, country_code) {
  let p = phone.replace(/[\s\-().]/g, '');
  if (!p.startsWith('+')) p = '+' + (country_code || '1') + p.replace(/^0+/, '');
  return p;
}

function calcScore(data, phone) {
  if (!data.valid) return 0;
  let score = 100;
  if (data.line_type === 'voip' || VOIP_PREFIXES.test(phone)) score -= 25;
  if (data.line_type === 'prepaid') score -= 20;
  if (TOLL_FREE.test(phone)) score -= 10;
  if (data.line_type === 'pager') score -= 15;
  return Math.max(0, score);
}

app.post('/api/score-phone', auth, async (req, res) => {
  try {
    const { phone_number, country_code } = req.body;
    const phone = normalizePhone(String(phone_number || ''), country_code);

    if (!INTL_REGEX.test(phone))
      return res.json({ phone, valid: false, reputation_score: 0, risk_level: 'high', recommendation: 'block' });

    const { data } = await axios.get(
      `https://api.numlookupapi.com/v1/validate/${phone}?apikey=${process.env.NUMLOOKUP_API_KEY}`
    );

    const is_voip = data.line_type === 'voip' || VOIP_PREFIXES.test(phone);
    const is_burner_risk = is_voip || data.line_type === 'prepaid';
    const score = calcScore(data, phone);
    const risk_level = score >= 70 ? 'low' : score >= 40 ? 'medium' : 'high';
    const recommendation = score >= 70 ? 'safe_to_accept' : score >= 40 ? 'review_manually' : 'block';

    res.json({
      phone,
      valid: data.valid || false,
      country: data.country_code || country_code || null,
      carrier: data.carrier || null,
      line_type: data.line_type || 'unknown',
      is_voip,
      is_burner_risk,
      spam_reports: 0,
      reputation_score: score,
      risk_level,
      recommendation
    });
  } catch (e) {
    console.error('Lookup error:', e.message);
    res.status(500).json({ error: 'lookup failed' });
  }
});

// Public demo endpoint — no API key required
app.post('/demo/score', async (req, res) => {
  try {
    const { phone_number, country_code } = req.body;
    if (!phone_number) return res.status(400).json({ error: 'phone_number is required' });

    const phone = normalizePhone(String(phone_number), country_code);

    if (!INTL_REGEX.test(phone))
      return res.json({ phone, valid: false, reputation_score: 0, risk_level: 'high', recommendation: 'block' });

    const { data } = await axios.get(
      `https://api.numlookupapi.com/v1/validate/${phone}?apikey=${process.env.NUMLOOKUP_API_KEY}`
    );

    const is_voip = data.line_type === 'voip' || VOIP_PREFIXES.test(phone);
    const is_burner_risk = is_voip || data.line_type === 'prepaid';
    const score = calcScore(data, phone);
    const risk_level = score >= 70 ? 'low' : score >= 40 ? 'medium' : 'high';
    const recommendation = score >= 70 ? 'safe_to_accept' : score >= 40 ? 'review_manually' : 'block';

    res.json({
      phone,
      valid: data.valid || false,
      country: data.country_code || country_code || null,
      carrier: data.carrier || null,
      line_type: data.line_type || 'unknown',
      is_voip,
      is_burner_risk,
      spam_reports: 0,
      reputation_score: score,
      risk_level,
      recommendation
    });
  } catch (e) {
    console.error('Demo lookup error:', e.message);
    res.status(500).json({ error: 'lookup failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Phone reputation scorer listening on port ${PORT}`));
