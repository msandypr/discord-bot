import OpenAI from 'openai';
import { AIProvider } from './types.js';

export class OpenAICompatibleProvider implements AIProvider {
  public readonly name: string;
  public readonly model: string;
  private client: OpenAI | null = null;

  constructor(apiKey?: string, baseURL?: string, model: string = 'gpt-4o-mini') {
    this.model = model;

    // Tentukan label display provider yang ramah
    if (baseURL) {
      if (baseURL.includes('groq.com')) this.name = 'Groq';
      else if (baseURL.includes('deepseek.com')) this.name = 'DeepSeek';
      else if (baseURL.includes('openrouter.ai')) this.name = 'OpenRouter';
      else if (baseURL.includes('localhost') || baseURL.includes('127.0.0.1')) this.name = 'Local LLM (Ollama/LM Studio)';
      else this.name = 'OpenAI-Compatible';
    } else {
      this.name = 'OpenAI';
    }

    // Untuk provider lokal seperti Ollama, jika apiKey tidak diisi, berikan fallback dummy key
    const effectiveKey = apiKey || (baseURL ? 'ollama-local-key' : '');

    if (effectiveKey) {
      this.client = new OpenAI({
        apiKey: effectiveKey,
        baseURL: baseURL || undefined,
      });
    }
  }

  public async generateResponse(prompt: string, userDisplayName?: string): Promise<string> {
    if (!this.client) {
      return `⚠️ **Konfigurasi Belum Lengkap:** \`OPENAI_API_KEY\` belum diset di file .env server bot.`;
    }

    try {
      const systemInstruction = `Kamu adalah asisten Discord pribadi yang ramah, cerdas, solutif, dan ringkas.
Format jawabanmu menggunakan Markdown Discord yang rapi (bold, bullet point, blockquote, atau code block jika ada kode).
Jawablah dengan bahasa yang sama seperti yang digunakan oleh penanya (default: Bahasa Indonesia santun & natural).
${userDisplayName ? `Pengguna yang sedang bertanya adalah: ${userDisplayName}.` : ''}`;

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt },
        ],
      });

      const reply = completion.choices[0]?.message?.content?.trim();
      if (!reply) {
        return `*(${this.name} tidak mengembalikan teks balasan)*`;
      }

      return reply;
    } catch (error: any) {
      console.error(`[OpenAICompatibleProvider] Error saat memanggil API (${this.name}):`, error);

      const status = error?.status;
      const errorMessage = error?.message || String(error);

      if (status === 401 || errorMessage.includes('invalid_api_key') || errorMessage.includes('Incorrect API key')) {
        return `❌ **Error Autentikasi:** API Key untuk ${this.name} tidak valid. Harap periksa \`OPENAI_API_KEY\`.`;
      }

      if (status === 404 || errorMessage.includes('model_not_found') || errorMessage.includes('The model')) {
        return `❌ **Model Tidak Ditemukan:** Model \`${this.model}\` tidak tersedia di ${this.name}. Periksa konfigurasi \`OPENAI_MODEL\`.`;
      }

      if (status === 429 || errorMessage.includes('rate_limit') || errorMessage.includes('quota')) {
        return `⏳ **Batas Kuota Tercapai:** Batas pemanggilan API ${this.name} sedang tercapai atau kehabisan kredit.`;
      }

      if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed')) {
        return `🔌 **Koneksi Gagal:** Tidak dapat menghubungi endpoint \`${this.name}\`. Jika ini model lokal (Ollama/LM Studio), pastikan layanannya sedang berjalan.`;
      }

      return `❌ Terjadi kesalahan saat memproses permintaan AI (${this.name}): \`${errorMessage.slice(0, 200)}\``;
    }
  }
}
