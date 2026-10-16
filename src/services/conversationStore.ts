export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface UserSession {
  messages: ChatMessage[];
  lastActive: number; // Unix timestamp dalam milidetik
}

export class ConversationStore {
  private sessions: Map<string, UserSession> = new Map();
  private readonly ttlMs: number;
  private readonly maxMessages: number;

  /**
   * @param ttlMs Masa aktif memori konteks dalam milidetik (default: 1 jam = 3.600.000 ms)
   * @param maxMessages Jumlah pesan maksimal yang disimpan per user (default: 20 pesan = 10 tanya-jawab)
   */
  constructor(ttlMs: number = 60 * 60 * 1000, maxMessages: number = 20) {
    this.ttlMs = ttlMs;
    this.maxMessages = maxMessages;
  }

  /**
   * Mengambil riwayat percakapan user jika masih dalam batas waktu 1 jam.
   * Jika sudah lebih dari 1 jam sejak pesan terakhir, memori otomatis di-reset.
   */
  public getHistory(userId: string): ChatMessage[] {
    const session = this.sessions.get(userId);
    if (!session) {
      return [];
    }

    const now = Date.now();
    if (now - session.lastActive > this.ttlMs) {
      // Sesi telah kedaluwarsa (> 1 jam)
      this.sessions.delete(userId);
      return [];
    }

    return [...session.messages];
  }

  /**
   * Menambahkan satu putaran tanya-jawab ke dalam konteks user dan memperbarui timer 1 jam.
   */
  public addTurn(userId: string, userPrompt: string, assistantReply: string): void {
    const now = Date.now();
    let session = this.sessions.get(userId);

    if (!session || now - session.lastActive > this.ttlMs) {
      session = {
        messages: [],
        lastActive: now,
      };
      this.sessions.set(userId, session);
    }

    session.messages.push(
      { role: 'user', content: userPrompt },
      { role: 'assistant', content: assistantReply }
    );

    // Batasi jumlah pesan agar tidak menghabiskan batas token model
    if (session.messages.length > this.maxMessages) {
      session.messages = session.messages.slice(-this.maxMessages);
    }

    session.lastActive = now;
  }

  /**
   * Menghapus memori konteks user secara manual (misal ketika user mengetik !reset)
   */
  public clearSession(userId: string): boolean {
    return this.sessions.delete(userId);
  }

  /**
   * Membersihkan semua sesi yang sudah kedaluwarsa dari RAM
   */
  public cleanupExpired(): void {
    const now = Date.now();
    for (const [userId, session] of this.sessions.entries()) {
      if (now - session.lastActive > this.ttlMs) {
        this.sessions.delete(userId);
      }
    }
  }
}

export const conversationStore = new ConversationStore();
