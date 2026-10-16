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

  it('explicitly forbids refusing absurd questions and enforces sarcastic humor', () => {
    expect(DEFAULT_AI_PERSONA).toContain('DILARANG MENOLAK PERTANYAAN ABSURD');
    expect(DEFAULT_AI_PERSONA).toContain('sarkasme kocak');
  });
});
