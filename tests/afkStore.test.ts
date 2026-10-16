import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AFKStore } from '../src/services/afkStore.js';
import fs from 'node:fs';
import path from 'node:path';

describe('AFKStore with SQLite persistence', () => {
  const testDbPath = path.join(process.cwd(), 'tests', 'temp_test_afk.sqlite');

  afterEach(() => {
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch {
        // ignore
      }
    }
  });

  it('stores and retrieves AFK record correctly', () => {
    const store = new AFKStore(testDbPath);
    const record = {
      userId: 'user123',
      guildId: 'guild456',
      originalNickname: 'Budi',
      reason: 'Sedang makan siang',
      afkSince: Date.now(),
    };

    store.setAFK(record);
    expect(store.isAFK('user123', 'guild456')).toBe(true);

    const retrieved = store.getAFK('user123', 'guild456');
    expect(retrieved).toBeDefined();
    expect(retrieved?.originalNickname).toBe('Budi');
    expect(retrieved?.reason).toBe('Sedang makan siang');

    store.close();
  });

  it('persists records across store instances', () => {
    const record = {
      userId: 'user999',
      guildId: 'guild888',
      originalNickname: 'Siti',
      reason: 'AFK bentar',
      afkSince: 1700000000000,
    };

    // Store in first instance
    const store1 = new AFKStore(testDbPath);
    store1.setAFK(record);
    store1.close();

    // Reopen in second instance
    const store2 = new AFKStore(testDbPath);
    const retrieved = store2.getAFK('user999', 'guild888');
    expect(retrieved).toBeDefined();
    expect(retrieved?.originalNickname).toBe('Siti');
    expect(retrieved?.reason).toBe('AFK bentar');
    expect(retrieved?.afkSince).toBe(1700000000000);

    store2.close();
  });

  it('removes AFK record accurately', () => {
    const store = new AFKStore(testDbPath);
    const record = {
      userId: 'user123',
      guildId: 'guild456',
      originalNickname: 'Budi',
      reason: 'Makan',
      afkSince: Date.now(),
    };

    store.setAFK(record);
    expect(store.isAFK('user123', 'guild456')).toBe(true);

    const removed = store.removeAFK('user123', 'guild456');
    expect(removed?.originalNickname).toBe('Budi');
    expect(store.isAFK('user123', 'guild456')).toBe(false);

    store.close();
  });

  it('handles mention notification cooldown properly', () => {
    const store = new AFKStore();
    const userId = 'user_cooldown';

    // First call -> allowed
    expect(store.canSendMentionNotification(userId, 500)).toBe(true);

    // Immediate second call -> denied (in cooldown)
    expect(store.canSendMentionNotification(userId, 500)).toBe(false);
  });
});
