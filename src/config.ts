import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config();

export type AIProviderType = 'auto' | 'gemini' | 'openai';

export interface Config {
  discordToken: string;
  applicationId: string;
  guildId?: string;
  databasePath: string;

  // AI Configuration
  aiProvider: AIProviderType;
  geminiApiKey: string;
  geminiModel: string;
  openaiApiKey: string;
  openaiBaseUrl?: string;
  openaiModel: string;
}

export function loadConfig(): Config {
  const discordToken = process.env.DISCORD_BOT_TOKEN || '';
  const applicationId = process.env.DISCORD_APPLICATION_ID || '';
  const geminiApiKey = process.env.GEMINI_API_KEY || '';
  const openaiApiKey = process.env.OPENAI_API_KEY || '';
  const openaiBaseUrl = process.env.OPENAI_BASE_URL || undefined;

  const rawProvider = (process.env.AI_PROVIDER || 'auto').toLowerCase();
  const aiProvider: AIProviderType =
    rawProvider === 'gemini' || rawProvider === 'openai' ? rawProvider : 'auto';

  if (!discordToken) {
    console.warn('⚠️ DISCORD_BOT_TOKEN belum diset di file .env');
  }

  if (!applicationId) {
    console.warn('⚠️ DISCORD_APPLICATION_ID belum diset di file .env');
  }

  if (!geminiApiKey && !openaiApiKey && !openaiBaseUrl) {
    console.warn('⚠️ Belum ada API key AI yang dikonfigurasi (GEMINI_API_KEY atau OPENAI_API_KEY/OPENAI_BASE_URL). Perintah /ask tidak akan dapat merespons.');
  }

  return {
    discordToken,
    applicationId,
    guildId: process.env.DISCORD_GUILD_ID || undefined,
    databasePath: process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'afk.sqlite'),

    aiProvider,
    geminiApiKey,
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    openaiApiKey,
    openaiBaseUrl,
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  };
}

export const config = loadConfig();
