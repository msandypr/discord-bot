import { config, Config } from '../../config.js';
import { AIProvider } from './types.js';
import { GeminiProvider } from './geminiProvider.js';
import { OpenAICompatibleProvider } from './openaiProvider.js';
import { conversationStore } from '../conversationStore.js';

export * from './types.js';
export * from './persona.js';
export * from './geminiProvider.js';
export * from './openaiProvider.js';

export function createAIProvider(cfg: Config = config): AIProvider {
  if (cfg.aiProvider === 'gemini') {
    return new GeminiProvider(cfg.geminiApiKey, cfg.geminiModel, cfg.aiSystemPrompt);
  }

  if (cfg.aiProvider === 'openai') {
    return new OpenAICompatibleProvider(cfg.openaiApiKey, cfg.openaiBaseUrl, cfg.openaiModel, cfg.aiSystemPrompt);
  }

  // Auto-detection logic:
  // 1. Jika konfigurasi OpenAI / baseURL lokal diisi dan Gemini kosong -> pakai OpenAI
  if ((cfg.openaiApiKey || cfg.openaiBaseUrl) && !cfg.geminiApiKey) {
    return new OpenAICompatibleProvider(cfg.openaiApiKey, cfg.openaiBaseUrl, cfg.openaiModel, cfg.aiSystemPrompt);
  }

  // 2. Default: gunakan Gemini
  return new GeminiProvider(cfg.geminiApiKey, cfg.geminiModel, cfg.aiSystemPrompt);
}

export class AIService {
  private provider: AIProvider;

  constructor(provider?: AIProvider) {
    this.provider = provider || createAIProvider();
  }

  public get currentProvider(): AIProvider {
    return this.provider;
  }

  public setProvider(provider: AIProvider): void {
    this.provider = provider;
  }

  public async askAI(prompt: string, userDisplayName?: string, userId?: string): Promise<string> {
    const history = userId ? conversationStore.getHistory(userId) : [];
    const reply = await this.provider.generateResponse(prompt, userDisplayName, history);

    // Simpan interaksi ke sesi jika berhasil dan userId ada
    if (userId && reply && reply !== 'Maaf bro, gue lagi sibuk') {
      conversationStore.addTurn(userId, prompt, reply);
    }

    return reply;
  }
}

export const aiService = new AIService();
