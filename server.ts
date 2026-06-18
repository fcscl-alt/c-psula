import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const isProd = process.env.NODE_ENV === "production";
const PORT = 3000;

let aiClient: GoogleGenAI | null = null;

// Lazy initialization of Gemini SDK
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();

  // Parse JSON payloads with generous limit for base64 images
  app.use(express.json({ limit: "15mb" }));

  // API Check Endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", geminiConfigured: !!process.env.GEMINI_API_KEY });
  });

  // Reflect Moment endpoint using Gemini API
  app.post("/api/reflect", async (req, res) => {
    const { justification, photo } = req.body;

    try {
      // Validate key availability before any action
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "GEMINI_API_KEY isn't configured in environmental variables.",
          fallbackReflection: `Momento arquivado: "${justification || "Sem justificativa"}".`,
          fallbackTags: ["MOMENTO", "ARQUIVO", "INTEGRIDADE"]
        });
      }

      const client = getGeminiClient();

      const systemInstruction = 
        "Você é o Archivist da Cápsula. Seu trabalho é criar uma reflexão brutalista, minimalista e poética " +
        "sobre o momento que o usuário documentou. A reflexão deve ser em português, evocando o tom de passabilidade, " +
        "futilidade ou perpetuidade do tempo. Seja extremamente conciso, máximo 180 caracteres. " +
        "Identifique 2 ou 3 temas industriais de uma única palavra que expressem o momento e devolva tudo em formato JSON.";

      const promptText = justification 
        ? `Justificativa/Intenção do usuário: "${justification}". Escreva a reflexão com base nisso.`
        : "O usuário registrou um momento em silêncio. Escreva uma reflexão sobre a quietude e a captura intencional.";

      const contents: any[] = [];

      // If base64 photo is provided, attach it as inline data for multimodal processing
      if (photo) {
        try {
          const match = photo.match(/^data:([^;]+);base64,(.*)$/);
          const mimeType = match ? match[1] : "image/jpeg";
          const dataB64 = match ? match[2] : photo;
          
          contents.push({
            inlineData: {
              mimeType,
              data: dataB64
            }
          });
        } catch (err) {
          console.error("Failed to parse photo data for prompt: ", err);
        }
      }

      contents.push({ text: promptText });

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reflection: { 
                type: Type.STRING, 
                description: "Reflexão elegante, poética e minimalista em português, com no máximo 180 caracteres." 
              },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "2 a 3 palavras industriais de uma única palavra em maiúsculo (ex: SILÊNCIO, CAFEÍNA, ROTINA)."
              }
            },
            required: ["reflection", "tags"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response content from Gemini.");
      }

      const result = JSON.parse(responseText);
      res.json(result);

    } catch (error: any) {
      console.error("Gemini reflection endpoint failed:", error);
      // Gracious recovery with localized backup response
      res.json({
        reflection: `Momento guardado com precisão brutalista: "${justification || "Sem texto informativo adicional"}"`,
        tags: ["MEMÓRIA", "PRESENTE", "REGISTRO"]
      });
    }
  });

  // Handle static files / Dev Server setup
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} (isProd: ${isProd})`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
