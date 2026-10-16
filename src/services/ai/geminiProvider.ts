import { GoogleGenAI } from '@google/genai';
import { AIProvider } from './types.js';

export class GeminiProvider implements AIProvider {
  public readonly name = 'Google Gemini';
  public readonly model: string;
  private ai: GoogleGenAI | null = null;

  constructor(apiKey?: string, model: string = 'gemini-2.5-flash') {
    this.model = model;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  public async generateResponse(prompt: string, userDisplayName?: string): Promise<string> {
    if (!this.ai) {
      return '⚠️ **Konfigurasi Belum Lengkap:** `GEMINI_API_KEY` belum diset di file .env server bot.';
    }

    try {
      const systemInstruction = `Kamu adalah asisten Discord pribadi yang ramah, cerdas, solutif, dan ringkas.
Format jawabanmu menggunakan Markdown Discord yang rapi (bold, bullet point, blockquote, atau code block jika ada kode).
Jawablah dengan bahasa yang sama seperti yang digunakan oleh penanya (default: Bahasa Indonesia santun & natural).
${userDisplayName ? `Pengguna yang sedang bertanya adalah: ${userDisplayName}.` : ''}`;

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          systemInstruction,
        },
      });

      const reply = response.text?.trim();
      if (!reply) {
        return '*(Gemini tidak mengembalikan teks balasan)*';
      }

      return reply;
    } catch (error: any) {
      console.error('[GeminiProvider] Error saat memanggil Google Gemini API:', error);

      const errorMessage = error?.message || String(error);
      if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('invalid api key')) {
        return '❌ **Error Autentikasi:** API Key Gemini tidak valid. Harap periksa `GEMINI_API_KEY`.';
      }
      if (
        errorMessage.includes('QUOTA_EXCEEDED') ||
        errorMessage.includes('ResourceExhausted') ||
        errorMessage.includes('rate limit')
      ) {
        return '⏳ **Batas Kuota Tercapai:** Kuota Gemini API sedang habis atau terkena rate limit. Silakan coba sesaat lagi.';
      }
      if (errorMessage.includes('SAFETY') || errorMessage.includes('blocked')) {
        return '🛡️ **Konten Ditolak:** Pertanyaan tidak dapat dijawab karena melanggar kebijakan keamanan konten Google AI.';
      }

      return `❌ Terjadi kesalahan saat memproses permintaan AI (Gemini): \`${errorMessage.slice(0, 200)}\``;
    }
  }
}
