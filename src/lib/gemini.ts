import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface AudioInsight {
  transcript: string;
  summary: string;
  extracted_updates: {
    income?: number;
    net_worth?: number;
    risk_tolerance?: string;
    time_horizon?: string;
    tax_bracket?: string;
    notes?: string;
    member_updates?: Array<{ name: string; field: string; value: string }>;
    account_updates?: Array<{ account_number?: string; field: string; value: string }>;
    new_members?: Array<{ name: string; email?: string; phone?: string }>;
  };
}

export async function processAudio(audioBuffer: Buffer, mimeType: string): Promise<AudioInsight> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  const base64Audio = audioBuffer.toString('base64');

  const prompt = `You are analyzing a conversation between a wealth manager and their client.

Please:
1. Provide a full transcript of the conversation
2. Write a concise summary of key points discussed
3. Extract any data updates, corrections, or new information mentioned

Return your response as a JSON object with this exact structure:
{
  "transcript": "full transcript here",
  "summary": "concise summary of key discussion points",
  "extracted_updates": {
    "income": null or number,
    "net_worth": null or number,
    "risk_tolerance": null or "Low/Medium/High",
    "time_horizon": null or string like "10-15 years",
    "tax_bracket": null or string like "32%",
    "notes": null or string with important goals/preferences mentioned,
    "member_updates": [] or array of {name, field, value} for updates to existing members,
    "account_updates": [] or array of {account_number, field, value} for account changes,
    "new_members": [] or array of {name, email, phone} for newly mentioned people
  }
}

Return ONLY the JSON, no markdown, no extra text.`;

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: mimeType as 'audio/mp3' | 'audio/wav' | 'audio/mpeg' | 'audio/ogg',
        data: base64Audio,
      },
    },
    prompt,
  ]);

  const text = result.response.text().trim();
  
  try {
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(cleaned);
  } catch {
    // Fallback if JSON parse fails
    return {
      transcript: text,
      summary: 'Audio processed - see transcript for details',
      extracted_updates: { notes: text },
    };
  }
}