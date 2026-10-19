import { describe, it, expect } from 'vitest';
import { DEFAULT_AI_PERSONA, buildSystemPrompt } from '../src/services/ai/persona.js';

describe('AI Persona & System Prompt', () => {
  it('contains instructions for short answers, parody tone, and no robotic cliches', () => {
    expect(DEFAULT_AI_PERSONA).toContain('SINGKAT & TO THE POINT');
    expect(DEFAULT_AI_PERSONA).toContain('NO ROBOTIC CLICHES');
    expect(DEFAULT_AI_PERSONA).toContain('parodi');
    expect(DEFAULT_AI_PERSONA).toContain('sarkastik');
  });

  it('injects user display name into system prompt when provided', () => {
    const prompt = buildSystemPrompt('Budi');
    expect(prompt).toContain('Budi');
    expect(prompt).toContain('Nama user yang lagi nanya: "Budi"');
  });

  it('supports overriding with custom system prompt', () => {
    const custom = 'Kamu adalah bot formal nan kaku.';
    const prompt = buildSystemPrompt('Siti', custom);
    expect(prompt).toContain('Kamu adalah bot formal nan kaku.');
    expect(prompt).toContain('Siti');
  });

  it('explicitly forbids refusing absurd questions and enforces sarcastic humor and emojis', () => {
    expect(DEFAULT_AI_PERSONA).toContain('DILARANG MENOLAK PERTANYAAN ABSURD');
    expect(DEFAULT_AI_PERSONA).toContain('WAJIB PAKAI EMOJI EKSPRESIF');
    expect(DEFAULT_AI_PERSONA).toContain('TANGGAPI PESAN REPLY DENGAN NYAMBUNG');
  });

  it('strictly forbids Jaksel code-mixing and enforces natural ngeselin tone without corny jokes', () => {
    expect(DEFAULT_AI_PERSONA).toContain('DILARANG MENGGUNAKAN BAHASA JAKSEL');
    expect(DEFAULT_AI_PERSONA).toContain('literally');
    expect(DEFAULT_AI_PERSONA).toContain('which is');
    expect(DEFAULT_AI_PERSONA).toContain('NATURAL NGESELIN');
    expect(DEFAULT_AI_PERSONA).toContain('JANGAN GARING');
    expect(DEFAULT_AI_PERSONA).toContain('Konteks balasan bot sebelumnya');
  });
});
