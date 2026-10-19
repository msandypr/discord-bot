import { ChatMessage } from '../conversationStore.js';

export interface AIProvider {
  /**
   * Nama provider yang sedang aktif (contoh: "Google Gemini", "Dahl Inference", dsb.)
   */
  readonly name: string;

  /**
   * Nama model yang sedang digunakan (contoh: "MiniMaxAI/MiniMax-M2.7", "gemini-3.8-flash")
   */
  readonly model: string;

  /**
   * Mengirim prompt pertanyaan ke provider AI dengan riwayat obrolan dan mengembalikan respons markdown.
   */
  generateResponse(
    prompt: string,
    userDisplayName?: string,
    history?: ChatMessage[],
    userId?: string
  ): Promise<string>;
}
