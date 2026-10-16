import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export interface AFKRecord {
  userId: string;
  guildId: string;
  originalNickname: string;
  reason: string;
  afkSince: number;
}

export class AFKStore {
  private db: Database.Database | null = null;
  private memoryCache: Map<string, AFKRecord> = new Map();
  private mentionCooldowns: Map<string, number> = new Map();
  private readonly defaultCooldownMs = 10_000; // 10 detik

  constructor(dbPath?: string) {
    if (dbPath) {
      this.initDatabase(dbPath);
    }
  }

  private getKey(userId: string, guildId: string): string {
    return `${guildId}:${userId}`;
  }

  private initDatabase(dbPath: string): void {
    try {
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.db = new Database(dbPath);
      this.db.pragma('journal_mode = WAL');

      this.db.exec(`
        CREATE TABLE IF NOT EXISTS afk_records (
          user_id TEXT NOT NULL,
          guild_id TEXT NOT NULL,
          original_nickname TEXT NOT NULL,
          reason TEXT NOT NULL,
          afk_since INTEGER NOT NULL,
          PRIMARY KEY (user_id, guild_id)
        );
      `);

      // Load existing records into in-memory cache
      const rows = this.db.prepare('SELECT * FROM afk_records').all() as Array<{
        user_id: string;
        guild_id: string;
        original_nickname: string;
        reason: string;
        afk_since: number;
      }>;

      for (const row of rows) {
        const record: AFKRecord = {
          userId: row.user_id,
          guildId: row.guild_id,
          originalNickname: row.original_nickname,
          reason: row.reason,
          afkSince: row.afk_since,
        };
        this.memoryCache.set(this.getKey(record.userId, record.guildId), record);
      }
    } catch (err) {
      console.error('⚠️ Gagal inisialisasi SQLite database, beralih ke in-memory store:', err);
      this.db = null;
    }
  }

  public setAFK(record: AFKRecord): void {
    const key = this.getKey(record.userId, record.guildId);
    this.memoryCache.set(key, record);

    if (this.db) {
      try {
        const stmt = this.db.prepare(`
          INSERT INTO afk_records (user_id, guild_id, original_nickname, reason, afk_since)
          VALUES (@userId, @guildId, @originalNickname, @reason, @afkSince)
          ON CONFLICT(user_id, guild_id) DO UPDATE SET
            original_nickname = excluded.original_nickname,
            reason = excluded.reason,
            afk_since = excluded.afk_since
        `);
        stmt.run(record);
      } catch (err) {
        console.error('Gagal menyimpan AFK ke database:', err);
      }
    }
  }

  public getAFK(userId: string, guildId: string): AFKRecord | undefined {
    return this.memoryCache.get(this.getKey(userId, guildId));
  }

  public isAFK(userId: string, guildId: string): boolean {
    return this.memoryCache.has(this.getKey(userId, guildId));
  }

  public removeAFK(userId: string, guildId: string): AFKRecord | undefined {
    const key = this.getKey(userId, guildId);
    const existing = this.memoryCache.get(key);
    if (!existing) {
      return undefined;
    }

    this.memoryCache.delete(key);

    if (this.db) {
      try {
        this.db.prepare('DELETE FROM afk_records WHERE user_id = ? AND guild_id = ?').run(
          userId,
          guildId
        );
      } catch (err) {
        console.error('Gagal menghapus status AFK dari database:', err);
      }
    }

    return existing;
  }

  /**
   * Cek apakah notifikasi mention untuk user ini sedang dalam cooldown anti-spam.
   * Jika tidak dalam cooldown, reset cooldown timer dan return true.
   */
  public canSendMentionNotification(userId: string, cooldownMs: number = this.defaultCooldownMs): boolean {
    const now = Date.now();
    const lastNotified = this.mentionCooldowns.get(userId) || 0;

    if (now - lastNotified < cooldownMs) {
      return false;
    }

    this.mentionCooldowns.set(userId, now);
    return true;
  }

  public close(): void {
    if (this.db) {
      try {
        this.db.close();
      } catch {
        // Abaikan saat shutdown
      }
    }
  }
}

import { config } from '../config.js';
export const afkStore = new AFKStore(config.databasePath);

