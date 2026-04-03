module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { model, system, user, max_tokens = 700 } = req.body;

  try {
    let text = '';

    if (model === 'claude') {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-opus-4-5', max_tokens, system, messages: [{ role: 'user', content: user }] }),
      });
      const d = await r.json();
      text = d.content?.[0]?.text || '';

    } else if (model === 'gpt4o') {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: 'gpt-4o', max_tokens, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
      });
      const d = await r.json();
      text = d.choices?.[0]?.message?.content || '';

    } else if (model === 'gemini') {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GOOGLE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system_instruction: { parts: [{ text: system }] }, contents: [{ parts: [{ text: user }] }], generationConfig: { maxOutputTokens: max_tokens } }),
      });
      const d = await r.json();
      text = d.candidates?.[0]?.content?.parts?.[0]?.text || '';

    } else if (model === 'gemini_trends') {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: user }] }], tools: [{ google_search: {} }], generationConfig: { maxOutputTokens: 500 } }),
      });
      const d = await r.json();
      text = d.candidates?.[0]?.content?.parts?.[0]?.text || '';

    } else if (model === 'grok') {
      const r = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.XAI_API_KEY}` },
        body: JSON.stringify({ model: 'grok-3', max_tokens, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
      });
      const d = await r.json();
      text = d.choices?.[0]?.message?.content || '';

    } else {
      return res.status(400).json({ error: 'unknown model' });
    }

    return res.status(200).json({ text });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
