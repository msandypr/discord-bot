import { aiService, AIService } from './ai/index.js';

export { aiService, AIService };

/**
 * Backward-compatible helper yang meneruskan panggilan ke aiService
 */
export class GeminiService {
  public async askGemini(prompt: string, userDisplayName?: string): Promise<string> {
    return aiService.askAI(prompt, userDisplayName);
  }
}

export const geminiService = new GeminiService();
