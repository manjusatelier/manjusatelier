import { GoogleGenAI } from '@google/genai';

/**
 * Text foul language and abuse detection.
 */
export async function checkFoulLanguage(text) {
  if (!text) return 'CLEAN';

  const prompt = `Analyze the following review text for any foul language, profanity, obscene insults, or highly inappropriate/abusive words in English or any Indian language. 
Return ONLY the word "FOUL" if it contains such language, and "CLEAN" if it does not. Do not include any other text.
Review: "${text}"`;

  // 1. Try Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { temperature: 0.1 },
      });
      const result = response.text?.trim().toUpperCase();
      return result?.includes('FOUL') ? 'FOUL' : 'CLEAN';
    } catch (error) {
      console.warn('Gemini text moderation error, falling back to OpenRouter:', error.message);
    }
  }

  // 2. Try OpenRouter
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.CLIENT_URL || 'https://manjusatelier.in',
          'X-Title': "Manju's Atelier",
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
        }),
      });

      if (openRouterResponse.ok) {
        const openRouterData = await openRouterResponse.json();
        const msg = openRouterData.choices[0]?.message?.content?.trim().toUpperCase();
        return msg?.includes('FOUL') ? 'FOUL' : 'CLEAN';
      }
    } catch (e) {
      console.error('OpenRouter text moderation fallback failed:', e);
    }
  }

  return 'CLEAN';
}

/**
 * Zero-Tolerance AI Vision Image Moderation.
 * Intercepts obscene images, human private parts, nudity, crime, violence, weapons, or illicit content.
 * 
 * Uses OpenRouter Vision Model (or Gemini Vision fallback).
 * Returns: { isSafe: boolean, verdict: 'SAFE' | 'UNSAFE', reason: string, categories: string[], modelUsed: string }
 */
export async function moderateReviewImage({ imageUrl, base64Buffer, mimeType = 'image/jpeg' }) {
  if (!imageUrl && !base64Buffer) {
    return { isSafe: true, verdict: 'SAFE', reason: 'No image provided', categories: [], modelUsed: 'none' };
  }

  const prompt = `You are a strict automated content moderation AI for an e-commerce platform called "Manju's Atelier" (selling handmade craft products, resin art, and crochet).
Analyze this uploaded customer review image. We enforce a STRICT ZERO-TOLERANCE POLICY.

IMMEDIATELY FLAG AS UNSAFE IF THE IMAGE CONTAINS:
1. Nudity, obscene imagery, human private parts (genitals, buttocks, exposed breasts/nipples, sexual acts, sex toys, erotic/pornographic content).
2. Crime, weapons (guns, knives held threateningly), illegal drugs, physical violence, blood, gore, dead bodies, self-harm.
3. Hate symbols, extreme vulgar gestures, terror imagery, or severe harassment.
4. Grotesque, disturbing, or offensive imagery completely inappropriate for a family-friendly retail craft website.

ALLOWED / SAFE CONTENT:
- Handmade crafts, resin art, crochet, jewelry, flowers, gift boxes, packaging, smiling customers holding products, household backgrounds, normal hands holding items.

You MUST respond with a RAW JSON object ONLY (no markdown backticks, no markdown codeblock):
{
  "isSafe": true,
  "verdict": "SAFE",
  "reason": "Brief explanation of image contents",
  "categories": ["none"],
  "confidence": 0.95
}
OR if unsafe:
{
  "isSafe": false,
  "verdict": "UNSAFE",
  "reason": "Specific reason for violation (e.g. human private parts / obscene content / violence)",
  "categories": ["nudity", "sexual", "violence", "crime", "drugs", "grotesque"],
  "confidence": 0.99
}`;

  // Helper to parse JSON from AI response safely
  const parseAiJson = (rawText, modelName) => {
    let clean = String(rawText || '').trim();
    if (clean.startsWith('```json')) clean = clean.substring(7);
    if (clean.startsWith('```')) clean = clean.substring(3);
    if (clean.endsWith('```')) clean = clean.substring(0, clean.length - 3);
    clean = clean.trim();

    try {
      const parsed = JSON.parse(clean);
      const isSafe = Boolean(parsed.isSafe && String(parsed.verdict).toUpperCase() === 'SAFE');
      const categories = Array.isArray(parsed.categories) ? parsed.categories.map((c) => String(c).toLowerCase()) : [];
      const hasProhibitedCategory = categories.some((c) =>
        ['nudity', 'sexual', 'violence', 'crime', 'drugs', 'hate', 'grotesque', 'weapons', 'blood'].includes(c)
      );

      return {
        isSafe: isSafe && !hasProhibitedCategory,
        verdict: isSafe && !hasProhibitedCategory ? 'SAFE' : 'UNSAFE',
        reason: parsed.reason || (isSafe ? 'Image verified and approved' : 'Image flagged as violating safety standards'),
        categories: categories.length > 0 ? categories : isSafe ? ['none'] : ['prohibited_content'],
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.95,
        modelUsed: modelName,
      };
    } catch {
      // Fallback keyword detection if LLM returned non-JSON text
      const upper = clean.toUpperCase();
      const isUnsafe =
        upper.includes('UNSAFE') ||
        upper.includes('NUDE') ||
        upper.includes('OBSCENE') ||
        upper.includes('PRIVATE PART') ||
        upper.includes('SEXUAL') ||
        upper.includes('VIOLENCE') ||
        upper.includes('CRIME') ||
        upper.includes('PROHIBITED');

      return {
        isSafe: !isUnsafe,
        verdict: isUnsafe ? 'UNSAFE' : 'SAFE',
        reason: isUnsafe ? 'Prohibited or obscene elements detected in image.' : 'Image appeared safe.',
        categories: isUnsafe ? ['prohibited_content'] : ['none'],
        confidence: 0.9,
        modelUsed: modelName,
      };
    }
  };

  // 1. Try OpenRouter Vision API (Primary)
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const visionModel = process.env.OPENROUTER_VISION_MODEL || 'google/gemini-2.0-flash-001';
      const imagePayload = imageUrl
        ? { url: imageUrl }
        : { url: `data:${mimeType};base64,${base64Buffer}` };

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.CLIENT_URL || 'https://manjusatelier.in',
          'X-Title': "Manju's Atelier Review Moderation",
        },
        body: JSON.stringify({
          model: visionModel,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: imagePayload },
              ],
            },
          ],
          temperature: 0.1,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const result = parseAiJson(content, `openrouter:${visionModel}`);
          return result;
        }
      } else {
        const errBody = await response.text();
        console.warn('OpenRouter Vision API returned error status:', response.status, errBody);
      }
    } catch (err) {
      console.warn('OpenRouter Vision API error, falling back to Gemini:', err.message);
    }
  }

  // 2. Fallback to Google Gemini Multimodal Vision API
  if (process.env.GEMINI_API_KEY) {
    try {
      let base64Data = base64Buffer;
      let detectedMime = mimeType;

      if (!base64Data && imageUrl) {
        const imgRes = await fetch(imageUrl);
        if (imgRes.ok) {
          const arrBuf = await imgRes.arrayBuffer();
          base64Data = Buffer.from(arrBuf).toString('base64');
          detectedMime = imgRes.headers.get('content-type') || 'image/jpeg';
        }
      }

      if (base64Data) {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            prompt,
            { inlineData: { data: base64Data, mimeType: detectedMime } },
          ],
          config: { temperature: 0.1 },
        });

        const content = response.text;
        if (content) {
          return parseAiJson(content, 'gemini-2.5-flash');
        }
      }
    } catch (err) {
      console.error('Gemini Vision fallback error:', err);
    }
  }

  // If no AI keys configured or both failed, fail-safe rule:
  console.warn('⚠️ No AI vision provider was reachable for image moderation.');
  return {
    isSafe: true,
    verdict: 'SAFE',
    reason: 'Auto-passed (AI service unreachable)',
    categories: ['unverified'],
    confidence: 0.5,
    modelUsed: 'none',
  };
}
