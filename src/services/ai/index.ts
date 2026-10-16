import { config, Config } from '../../config.js';
import { AIProvider } from './types.js';
import { GeminiProvider } from './geminiProvider.js';
import { OpenAICompatibleProvider } from './openaiProvider.js';

export * from './types.js';
export * from './geminiProvider.js';
export * from './openaiProvider.js';

export function createAIProvider(cfg: Config = config): AIProvider {
  if (cfg.aiProvider === 'gemini') {
    return new GeminiProvider(cfg.geminiApiKey, cfg.geminiModel);
  }

  if (cfg.aiProvider === 'openai') {
    return new OpenAICompatibleProvider(cfg.openaiApiKey, cfg.openaiBaseUrl, cfg.openaiModel);
  }

  // Auto-detection logic:
  // 1. Jika konfigurasi OpenAI / baseURL lokal diisi dan Gemini kosong -> pakai OpenAI
  if ((cfg.openaiApiKey || cfg.openaiBaseUrl) && !cfg.geminiApiKey) {
    return new OpenAICompatibleProvider(cfg.openaiApiKey, cfg.openaiBaseUrl, cfg.openaiModel);
  }

  // 2. Default: gunakan Gemini
  return new GeminiProvider(cfg.geminiApiKey, cfg.geminiModel);
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

  public async askAI(prompt: string, userDisplayName?: string): Promise<string> {
    return this.provider.generateResponse(prompt, userDisplayName);
  }
}

export const aiService = new AIService();
