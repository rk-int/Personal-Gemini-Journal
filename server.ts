import express, { Request, Response } from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = 3000;

// Lazy initialization for GoogleGenAI
function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in the environment variables.');
  }
  return new GoogleGenAI({ apiKey });
}

// Fallback Model Ladder as specified in guidelines
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
] as const;

interface FallbackOptions {
  contents: any;
  systemInstruction?: string;
  config?: Record<string, any>;
}

/**
 * Executes a Gemini generation request with an automated fallback ladder.
 * Catch recoverable HTTP/API errors (503, 429, 404, 500) and attempts fallback models.
 */
async function generateContentWithFallback(options: FallbackOptions): Promise<{ text: string; modelUsed: string }> {
  const ai = getGenAIClient();
  let lastError: any = null;

  for (const modelName of MODEL_FALLBACK_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: options.contents,
        config: {
          systemInstruction: options.systemInstruction,
          ...options.config,
        },
      });

      const responseText = response.text || '';
      return {
        text: responseText,
        modelUsed: modelName,
      };
    } catch (err: any) {
      console.warn(`[Gemini Fallback] Model ${modelName} failed. Error:`, err?.message || err);
      lastError = err;
      // Continue to next model in fallback ladder
    }
  }

  throw new Error(`All fallback models failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

async function startServer() {
  const app = express();

  // 1. Top-Level Request Deserialization (Ordering Guarantee)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // API Health Check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'ReflectAI Server',
      timestamp: Date.now(),
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // POST /api/chat - Multi-turn conversational journaling & reflection
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const { messages, mode, reflectionTitle, currentMood } = body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required and cannot be empty.' });
      }

      // Convert conversation messages into Google GenAI content format
      // Map user/assistant to user/model
      const conversationContents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(m.content || '') }],
      }));

      // Define persona and mode guidance
      let modeGuidance = 'Be an empathetic, thoughtful reflection partner. Help the user explore thoughts, validate feelings, and prompt gentle deeper inquiries.';
      if (mode === 'socratic') {
        modeGuidance = 'Adopt a Socratic questioning method. Ask clarifying questions that challenge assumptions, uncover core motivations, and guide self-discovery without preaching.';
      } else if (mode === 'brainstorm') {
        modeGuidance = 'Act as an energetic creative thought partner and ideation catalyst. Provide fresh perspectives, structured brainstorming angles, and creative pathways.';
      } else if (mode === 'action') {
        modeGuidance = 'Act as an executive action-oriented coach. Help translate introspections into clear, realistic micro-steps, habit adjustments, and manageable action plans.';
      } else if (mode === 'gratitude') {
        modeGuidance = 'Act as a mindfulness and gratitude guide. Cultivate positive savoring, presence, and appreciation for subtleties.';
      }

      const systemInstruction = `You are ReflectAI, a world-class reflective journaling partner and mindful cognitive companion.
The user is writing in their private, secure digital journal.
Context:
- Journal Entry Title: ${reflectionTitle || 'Untitled Reflection'}
- Mood State: ${currentMood || 'Reflective'}
- Mode Style: ${modeGuidance}

Directives:
1. Speak in a warm, grounded, attentive, and non-judgmental voice.
2. Provide thoughtful, well-structured feedback using concise paragraphs and occasional formatting (bullet points or bold highlights) where it creates clarity.
3. Validate emotional honesty and celebrate insights.
4. Conclude with 1 or 2 targeted, open-ended reflection questions that encourage the user to continue unpacking their thoughts if appropriate.
5. Avoid overly clinical, robotic jargon, or hollow clichés.`;

      const result = await generateContentWithFallback({
        contents: conversationContents,
        systemInstruction,
        config: {
          temperature: 0.7,
        },
      });

      return res.json({
        reply: result.text,
        modelUsed: result.modelUsed,
      });
    } catch (error: any) {
      console.error('Error in /api/chat:', error);
      return res.status(500).json({
        error: error?.message || 'Failed to generate reflection response.',
      });
    }
  });

  // POST /api/summarize - Summarize journal entry into structured insights
  app.post('/api/summarize', async (req: Request, res: Response) => {
    try {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const { messages, title } = body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required for summarization.' });
      }

      const dialogueTranscript = messages
        .map((m: { role: string; content: string }) => `${m.role === 'assistant' ? 'Gemini' : 'User'}: ${m.content}`)
        .join('\n\n');

      const systemInstruction = `You are an expert cognitive psychologist and executive reflection summarizer.
Given the user's journal conversation, analyze and summarize the reflection into structured key components.

Respond ONLY with valid JSON in this exact structure:
{
  "summary": "A concise 2-3 sentence overarching synthesis of what the user reflected upon and learned.",
  "mood": "Detected dominant mood (e.g., Inspired, Contemplative, Grateful, Overwhelmed, Determined, Peaceful)",
  "takeaways": [
    "Key insight or revelation 1",
    "Key insight or revelation 2",
    "Key insight or revelation 3"
  ],
  "actionItems": [
    "Suggested concrete micro-step or takeaway habit"
  ],
  "tags": ["Mindset", "Productivity", "Personal Growth"]
}`;

      const prompt = `Here is the journal reflection session to analyze:\n\nTitle: ${title || 'Untitled Session'}\n\nTranscript:\n${dialogueTranscript}\n\nProduce the JSON analysis now.`;

      const result = await generateContentWithFallback({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction,
        config: {
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      });

      let parsedData: any = {};
      try {
        parsedData = JSON.parse(result.text);
      } catch (jsonErr) {
        // In case JSON parsing had subtle wrapper backticks
        const clean = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedData = JSON.parse(clean);
      }

      return res.json({
        summary: parsedData.summary || 'A meaningful reflection on current life, goals, and thoughts.',
        mood: parsedData.mood || 'Reflective',
        takeaways: Array.isArray(parsedData.takeaways) ? parsedData.takeaways : [],
        actionItems: Array.isArray(parsedData.actionItems) ? parsedData.actionItems : [],
        tags: Array.isArray(parsedData.tags) ? parsedData.tags : ['Journal'],
        modelUsed: result.modelUsed,
      });
    } catch (error: any) {
      console.error('Error in /api/summarize:', error);
      return res.status(500).json({
        error: error?.message || 'Failed to synthesize journal entry summary.',
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ReflectAI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error during server startup:', err);
  process.exit(1);
});
