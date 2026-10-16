export interface AIProvider {
  /**
   * Nama provider yang sedang aktif (contoh: "Google Gemini", "OpenAI-Compatible (Groq)", dsb.)
   */
  readonly name: string;

  /**
   * Nama model yang sedang digunakan (contoh: "gemini-2.5-flash", "gpt-4o-mini", "llama-3.3-70b-versatile")
   */
  readonly model: string;

  /**
   * Mengirim prompt pertanyaan ke provider AI dan mengembalikan respons teks markdown.
   */
  generateResponse(prompt: string, userDisplayName?: string): Promise<string>;
}
