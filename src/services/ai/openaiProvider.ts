import OpenAI from 'openai';
import { AIProvider } from './types.js';
import { ChatMessage } from '../conversationStore.js';
import { buildSystemPrompt } from './persona.js';

export class OpenAICompatibleProvider implements AIProvider {
  public readonly name: string;
  public readonly model: string;
  public readonly temperature: number;
  private systemPrompt?: string;
  private client: OpenAI | null = null;

  constructor(
    apiKey?: string,
    baseURL?: string,
    model: string = 'llama-3.1-8b-instant',
    systemPrompt?: string,
    temperature: number = 0.7
  ) {
    this.model = model;
    this.systemPrompt = systemPrompt;
    this.temperature = temperature;

    // Otomatis gunakan Groq jika apiKey berawalan 'gsk_' dan baseURL belum diatur
    const effectiveBaseURL = baseURL || (apiKey?.startsWith('gsk_') ? 'https://api.groq.com/openai/v1' : undefined);

    // Tentukan label display provider yang ramah
    if (effectiveBaseURL) {
      if (effectiveBaseURL.includes('groq.com')) this.name = 'Groq';
      else if (effectiveBaseURL.includes('deepseek.com')) this.name = 'DeepSeek';
      else if (effectiveBaseURL.includes('openrouter.ai')) this.name = 'OpenRouter';
      else if (effectiveBaseURL.includes('dahl.global')) this.name = 'Dahl Inference';
      else if (effectiveBaseURL.includes('localhost') || effectiveBaseURL.includes('127.0.0.1')) this.name = 'Local LLM (Ollama/LM Studio)';
      else this.name = 'OpenAI-Compatible';
    } else {
      this.name = 'OpenAI';
    }

    // Untuk provider lokal seperti Ollama, jika apiKey tidak diisi, berikan fallback dummy key
    const effectiveKey = apiKey || (effectiveBaseURL ? 'ollama-local-key' : '');

    if (effectiveKey) {
      this.client = new OpenAI({
        apiKey: effectiveKey,
        baseURL: effectiveBaseURL || undefined,
      });
    }
  }

  public async generateResponse(
    prompt: string,
    userDisplayName?: string,
    history: ChatMessage[] = [],
    userId?: string
  ): Promise<string> {
    if (!this.client) {
      return `⚠️ **Konfigurasi Belum Lengkap:** \`OPENAI_API_KEY\` belum diset di file .env server bot.`;
    }

    try {
      const systemInstruction = buildSystemPrompt(userDisplayName, this.systemPrompt, userId);

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemInstruction },
        ...history.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        { role: 'user', content: prompt },
      ];

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: this.temperature,
      });

      const reply = completion.choices[0]?.message?.content?.trim();
      if (!reply) {
        return `*(${this.name} tidak mengembalikan teks balasan)*`;
      }

      return reply;
    } catch (error: any) {
      console.error(`[OpenAICompatibleProvider] Error saat memanggil API (${this.name}):`, error);
      return 'Maaf bro, gue lagi sibuk';
    }
  }
}
