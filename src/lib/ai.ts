import { GoogleGenAI, Type } from "@google/genai";

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!geminiApiKey) {
  throw new Error("VITE_GEMINI_API_KEY não está configurada.");
}

const geminiClient = new GoogleGenAI({ apiKey: geminiApiKey });

export interface GeminiMomentResult {
  title: string;
  reflection: string;
}

export async function processPhotoWithGemini(
  photoBase64: string,
  description?: string
): Promise<GeminiMomentResult> {
  const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, "");
  const mimeMatch = photoBase64.match(/^data:(image\/[^;]+);base64,/);
  const mimeType = mimeMatch?.[1] ?? "image/jpeg";

  const prompt = description
    ? `Você é um curador minimalista. Crie um título e uma reflexão em português para esta foto e para esta descrição: "${description}".`
    : "Você é um curador minimalista. Crie um título e uma reflexão em português para esta foto.";

  const response = await geminiClient.models.generateContent({
    model: "gemini-3.5-flash",
    contents: [
      { text: prompt },
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Título curto e poético." },
          reflection: { type: Type.STRING, description: "Reflexão em português." },
        },
        required: ["title", "reflection"],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Resposta do Gemini não retornou texto.");
  }

  const parsed = JSON.parse(text) as GeminiMomentResult;

  return {
    title: parsed.title?.trim() ?? "Momento capturado",
    reflection: parsed.reflection?.trim() ?? description ?? "Momento registrado.",
  };
}
