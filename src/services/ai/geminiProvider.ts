import { GoogleGenAI } from '@google/genai';
import { AIProvider } from './types.js';
import { ChatMessage } from '../conversationStore.js';
import { buildSystemPrompt } from './persona.js';

export class GeminiProvider implements AIProvider {
  public readonly name = 'Google Gemini';
  public readonly model: string;
  public readonly temperature: number;
  private systemPrompt?: string;
  private ai: GoogleGenAI | null = null;

  constructor(apiKey?: string, model: string = 'gemini-3.8-flash', systemPrompt?: string, temperature: number = 0.7) {
    this.model = model;
    this.systemPrompt = systemPrompt;
    this.temperature = temperature;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  public async generateResponse(
    prompt: string,
    userDisplayName?: string,
    history: ChatMessage[] = [],
    userId?: string
  ): Promise<string> {
    if (!this.ai) {
      return '⚠️ **Konfigurasi Belum Lengkap:** `GEMINI_API_KEY` belum diset di file .env server bot.';
    }

    try {
      const systemInstruction = buildSystemPrompt(userDisplayName, this.systemPrompt, userId);

      const contents = [
        ...history.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        })),
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ];

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents,
        config: {
          systemInstruction,
          temperature: this.temperature,
        },
      });

      const reply = response.text?.trim();
      if (!reply) {
        return '*(Gemini tidak mengembalikan teks balasan)*';
      }

      return reply;
    } catch (error: any) {
      console.error('[GeminiProvider] Error saat memanggil Google Gemini API:', error);
      return 'Maaf bro, gue lagi sibuk';
    }
  }
}
