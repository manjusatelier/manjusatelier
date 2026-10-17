import { asyncHandler, ApiError } from '../middleware/error.js';
import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';

export const generateProductDetails = asyncHandler(async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) {
    throw new ApiError(400, 'Image URL is required');
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new ApiError(500, 'GEMINI_API_KEY is not configured in the backend.');
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    // 1. Fetch the image to get its base64 buffer since Gemini requires inline data
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image from ${imageUrl}`);
    }
    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    const prompt = `You are an AI assistant for a handmade crafts store called "Manju's Atelier".
Analyze this product image and generate a structured JSON object containing:
- "name": A catchy, SEO-friendly name for this product (max 60 characters).
- "description": A beautiful, compelling product description (1-2 paragraphs) highlighting its craftsmanship, aesthetic appeal, and potential uses.
- "category": Choose the single most appropriate category from: ['crochet', 'bags', 'home-decor', 'accessories', 'amigurumi', 'clothing']. If none fit perfectly, pick the closest one or suggest a simple 1-word lowercase category.
- "color": The primary dominant color of the product in lowercase (e.g., "red", "beige", "navy blue", "multicolor").
- "tags": An array of 3 to 6 relevant lowercase tags (e.g., ["handmade", "gift", "boho", "sustainable"]).
- "includedInBox": An array of items included in the shipment package (e.g., ["2x Handcrafted Crochet Roses", "Care instruction card"]). If decorative props like pots, vases, or stands are visible in the photo, do NOT include them as package contents.
- "packageNote": If photography/decorative props (like flower pots, vases, trays, stands) are visible in the image, specify a brief note clarifying they are not included (e.g., "Flower pot shown in pictures is for styling only and is not included"). Otherwise, leave empty string "".
- "socialCaption": An engaging, ready-to-post social media caption for this product including emojis and 3-5 relevant hashtags. You MUST always include the hashtag #manjusatelier. MUST BE STRICTLY UNDER 220 CHARACTERS to fit Twitter limits.

Return ONLY the raw JSON object. Do not include markdown code blocks or any other text.`;

    let aiMessage;
    let lastError;
    
    try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            prompt,
            { inlineData: { data: base64Image, mimeType } }
          ],
          config: { temperature: 0.4 }
        });
        aiMessage = response.text;
    } catch (e) {
        console.warn(`Gemini failed: ${e.message}. Falling back to OpenRouter...`);
        if (!process.env.OPENROUTER_API_KEY) {
            throw new Error('Gemini failed and OPENROUTER_API_KEY is not configured for fallback.');
        }
        
        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.CLIENT_URL || 'https://manjusatelier.in',
                'X-Title': "Manju's Atelier"
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o-mini',
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
                        ]
                    }
                ],
                temperature: 0.4
            })
        });

        if (!openRouterResponse.ok) {
            const errText = await openRouterResponse.text();
            throw new Error(`OpenRouter API error: ${errText}`);
        }

        const openRouterData = await openRouterResponse.json();
        aiMessage = openRouterData.choices[0]?.message?.content;
        
        if (!aiMessage) throw new Error('OpenRouter returned an empty response.');
    }

    // Attempt to parse JSON. Sometimes LLMs return markdown anyway.
    let jsonStr = aiMessage.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.substring(7);
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.substring(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }

    const parsed = JSON.parse(jsonStr.trim());

    res.json({ success: true, data: parsed });
  } catch (error) {
    console.error('AI Error:', error);
    throw new ApiError(500, 'Failed to generate product details with AI. ' + (error.message || ''));
  }
});
