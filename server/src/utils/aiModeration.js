import { GoogleGenAI } from '@google/genai';

export async function checkFoulLanguage(text) {
  if (!text) return false;
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return false; // Fallback to safe if no API key

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `Analyze the following review text for any foul language, profanity, or highly inappropriate/abusive words in English or any Indian language. 
Return ONLY the word "FOUL" if it contains such language, and "CLEAN" if it does not. Do not include any other text.
Review: "${text}"`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { temperature: 0.1 }
    });
    const result = response.text?.trim().toUpperCase();
    return result.includes('FOUL') ? 'FOUL' : 'CLEAN';
  } catch (error) {
    console.error('AI Moderation error:', error);
    // If we have an OpenRouter fallback
    try {
        if (!process.env.OPENROUTER_API_KEY) return 'ERROR';
        
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
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1
            })
        });

        if (openRouterResponse.ok) {
            const openRouterData = await openRouterResponse.json();
            const msg = openRouterData.choices[0]?.message?.content?.trim().toUpperCase();
            return msg?.includes('FOUL') ? 'FOUL' : 'CLEAN';
        }
    } catch (e) {
        console.error('OpenRouter fallback failed:', e);
    }
    return 'ERROR'; // Fallback to error state when APIs fail
  }
}
