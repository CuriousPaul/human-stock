const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function parseDataUrl(input = '') {
  const match = String(input).match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, Number(n) || 0));
}

function fallbackScore(value, fallback) {
  return Math.round(clamp(value ?? fallback, 0, 100));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return json(res, 503, {
      ok: false,
      error: 'MISSING_GEMINI_API_KEY',
      message: 'GEMINI_API_KEY 환경변수가 아직 설정되지 않았어.'
    });
  }

  try {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : {};
    const parsed = parseDataUrl(body.imageDataUrl);
    if (!parsed) return json(res, 400, { ok: false, error: 'INVALID_IMAGE_DATA' });

    const prompt = `너는 소셜 성장 주식 앱의 사진 인증 심판이야. 사용자가 올린 사진이 오늘 공시한 할 일 인증으로 적절한지 평가해.
목표/투두: ${body.goal || '미제공'}
체크리스트: ${(body.todos || []).join(', ') || '없음'}
반드시 JSON만 반환해. 스키마:
{
 "verdict":"APPROVED|REVIEW|REJECT",
 "realtime":"PASS|WARN",
 "duplicate":"PASS|WARN",
 "aiSuspicion":0-100,
 "goalRelevance":0-100,
 "confidence":0-100,
 "difficulty":1-5,
 "importance":1-5,
 "authenticity":1-5,
 "summary":"한 문장 요약",
 "reason":"판단 근거 1~2문장",
 "marketTone":"good|neutral|bad"
}
주의: 사진만 보고 확실하지 않은 것은 WARN/REVIEW로 보수적으로 판단해.`;

    const geminiRes = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            { text: prompt },
            { inline_data: { mime_type: parsed.mimeType, data: parsed.data } }
          ]
        }],
        generationConfig: {
          temperature: 0.25,
          response_mime_type: 'application/json'
        }
      })
    });

    const payload = await geminiRes.json();
    if (!geminiRes.ok) {
      return json(res, geminiRes.status, { ok: false, error: 'GEMINI_API_ERROR', details: payload });
    }

    const text = payload?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim() || '{}';
    let parsedJson;
    try { parsedJson = JSON.parse(text); }
    catch { parsedJson = JSON.parse(text.replace(/^```json\s*/i, '').replace(/```$/,'').trim()); }

    const result = {
      verdict: ['APPROVED', 'REVIEW', 'REJECT'].includes(parsedJson.verdict) ? parsedJson.verdict : 'REVIEW',
      realtime: ['PASS', 'WARN'].includes(parsedJson.realtime) ? parsedJson.realtime : 'WARN',
      duplicate: ['PASS', 'WARN'].includes(parsedJson.duplicate) ? parsedJson.duplicate : 'PASS',
      aiSuspicion: fallbackScore(parsedJson.aiSuspicion, 25),
      goalRelevance: fallbackScore(parsedJson.goalRelevance, 60),
      confidence: fallbackScore(parsedJson.confidence, 65),
      difficulty: Math.round(clamp(parsedJson.difficulty, 1, 5)),
      importance: Math.round(clamp(parsedJson.importance, 1, 5)),
      authenticity: Math.round(clamp(parsedJson.authenticity, 1, 5)),
      summary: String(parsedJson.summary || '사진 인증을 분석했어.').slice(0, 160),
      reason: String(parsedJson.reason || '목표 관련성과 진정성을 기준으로 판정했어.').slice(0, 320),
      marketTone: ['good', 'neutral', 'bad'].includes(parsedJson.marketTone) ? parsedJson.marketTone : 'neutral'
    };

    return json(res, 200, { ok: true, result });
  } catch (error) {
    return json(res, 500, { ok: false, error: 'ANALYZE_FAILED', message: error.message });
  }
};
