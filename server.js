import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // AI Triage API
  app.post('/api/triage', async (req, res) => {
    try {
      const { title, category, description, location, severity, image } = req.body;

      let contents = [
        {
          text: `You are a community hazard triage AI. Analyze the following report and provide a concise, 1-sentence "AI Triage Note" for a public dashboard.
          
          Report Details:
          - Title: ${title}
          - Category: ${category}
          - Severity: ${severity}
          - Description: ${description}
          - Location: ${location}
          
          Guidelines:
          - Summarize the specific hazard.
          - Contextualize based on severity.
          - Maintain a professional, safety-oriented tone.
          - Example: "AI Triage: Verified [Category] with [Severity] urgency context. Queue routed for public safety review."
          - Keep it under 20 words.`
        }
      ];

      if (image && image.includes('base64,')) {
        const base64Data = image.split('base64,')[1];
        const mimeType = image.split(';')[0].split(':')[1];
        contents.push({
          inlineData: {
            mimeType,
            data: base64Data
          }
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: contents }
      });

      const triageNote = response.text?.trim() || "AI Triage: Report received and indexed for manual review.";
      
      res.json({ triageNote });
    } catch (error) {
      console.error('Triage Error:', error);
      res.status(500).json({ error: 'Failed to generate AI triage note' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
