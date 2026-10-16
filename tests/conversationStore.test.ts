import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConversationStore } from '../src/services/conversationStore.js';

describe('ConversationStore', () => {
  let store: ConversationStore;

  beforeEach(() => {
    // 1 jam TTL (3600000 ms), max 6 messages for testing caps
    store = new ConversationStore(60 * 60 * 1000, 6);
  });

  it('returns empty array when user has no active session', () => {
    const history = store.getHistory('user-unknown');
    expect(history).toEqual([]);
  });

  it('stores multi-turn conversation and retrieves it within 1 hour', () => {
    store.addTurn('user-1', 'Halo bot!', 'Halo Budi, ada yang bisa dibantu?');
    store.addTurn('user-1', 'Siapa penemu listrik?', 'Michael Faraday dan Thomas Edison berkontribusi...');

    const history = store.getHistory('user-1');
    expect(history).toHaveLength(4);
    expect(history[0]).toEqual({ role: 'user', content: 'Halo bot!' });
    expect(history[1]).toEqual({ role: 'assistant', content: 'Halo Budi, ada yang bisa dibantu?' });
    expect(history[2]).toEqual({ role: 'user', content: 'Siapa penemu listrik?' });
    expect(history[3]).toEqual({ role: 'assistant', content: 'Michael Faraday dan Thomas Edison berkontribusi...' });
  });

  it('expires context after 1 hour (3600000 ms)', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    store.addTurn('user-ttl', 'Pertanyaan 1', 'Jawaban 1');
    expect(store.getHistory('user-ttl')).toHaveLength(2);

    // Maju 30 menit (masih aktif)
    vi.spyOn(Date, 'now').mockReturnValue(now + 30 * 60 * 1000);
    expect(store.getHistory('user-ttl')).toHaveLength(2);

    // Maju lebih dari 1 jam (61 menit) dari turn terakhir
    vi.spyOn(Date, 'now').mockReturnValue(now + 61 * 60 * 1000);
    expect(store.getHistory('user-ttl')).toHaveLength(0);

    vi.restoreAllMocks();
  });

  it('extends 1-hour expiration window on new turn (sliding TTL)', () => {
    const start = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(start);

    store.addTurn('user-sliding', 'Turn 1', 'Reply 1');

    // 50 menit kemudian, user bertanya lagi (seharusnya belum expired)
    vi.spyOn(Date, 'now').mockReturnValue(start + 50 * 60 * 1000);
    store.addTurn('user-sliding', 'Turn 2', 'Reply 2');

    // 30 menit setelah Turn 2 (total 80 menit dari start, tapi baru 30 menit dari Turn 2)
    vi.spyOn(Date, 'now').mockReturnValue(start + 80 * 60 * 1000);
    // Masih harus aktif karena dihitung dari pesan terakhir
    expect(store.getHistory('user-sliding')).toHaveLength(4);

    vi.restoreAllMocks();
  });

  it('caps history size to maxMessages (sliding window)', () => {
    // maxMessages = 6 (3 turns)
    store.addTurn('user-cap', 'T1', 'R1');
    store.addTurn('user-cap', 'T2', 'R2');
    store.addTurn('user-cap', 'T3', 'R3');
    store.addTurn('user-cap', 'T4', 'R4');

    const history = store.getHistory('user-cap');
    expect(history).toHaveLength(6);
    // T1 dan R1 harus sudah terbuang (FIFO)
    expect(history[0].content).toBe('T2');
    expect(history[history.length - 1].content).toBe('R4');
  });

  it('clears session explicitly via clearSession', () => {
    store.addTurn('user-clear', 'Pertanyaan', 'Jawaban');
    expect(store.getHistory('user-clear')).toHaveLength(2);

    const cleared = store.clearSession('user-clear');
    expect(cleared).toBe(true);
    expect(store.getHistory('user-clear')).toEqual([]);
  });

  it('removes only expired sessions during cleanupExpired', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    store.addTurn('user-active', 'Halo', 'Hai');
    store.addTurn('user-expired', 'Kuno', 'Lama');

    // Buat user-expired lampau
    vi.spyOn(Date, 'now').mockReturnValue(now + 65 * 60 * 1000);
    // user-active tetap aktif di timestamp baru
    store.addTurn('user-active', 'Update baru', 'Balasan baru');

    store.cleanupExpired();

    expect(store.getHistory('user-active').length).toBeGreaterThan(0);
    expect(store.getHistory('user-expired')).toHaveLength(0);

    vi.restoreAllMocks();
  });
});
