import { describe, it, expect } from 'vitest';
import { formatDuration } from '../src/utils/time.js';
import { formatAfkNickname, hasAfkPrefix, removeAfkPrefix } from '../src/utils/nickname.js';
import { splitDiscordMessage } from '../src/utils/chunker.js';

describe('Time Formatter', () => {
  it('formats seconds correctly', () => {
    expect(formatDuration(5000)).toBe('5 detik');
    expect(formatDuration(45000)).toBe('45 detik');
  });

  it('formats minutes and seconds correctly', () => {
    expect(formatDuration(60000)).toBe('1 menit');
    expect(formatDuration(90000)).toBe('1 menit 30 detik');
    expect(formatDuration(15 * 60 * 1000)).toBe('15 menit');
  });

  it('formats hours and minutes correctly', () => {
    expect(formatDuration(3600000)).toBe('1 jam');
    expect(formatDuration(3600000 + 15 * 60 * 1000)).toBe('1 jam 15 menit');
  });

  it('formats days correctly', () => {
    expect(formatDuration(24 * 3600000)).toBe('1 hari');
    expect(formatDuration(24 * 3600000 + 3 * 3600000)).toBe('1 hari 3 jam');
  });
});

describe('Nickname Utility', () => {
  it('detects [AFK] prefix', () => {
    expect(hasAfkPrefix('[AFK] Alice')).toBe(true);
    expect(hasAfkPrefix(' [AFK] Bob')).toBe(true);
    expect(hasAfkPrefix('Charlie')).toBe(false);
  });

  it('removes [AFK] prefix', () => {
    expect(removeAfkPrefix('[AFK] Alice')).toBe('Alice');
    expect(removeAfkPrefix('[afk] Bob')).toBe('Bob');
    expect(removeAfkPrefix('Charlie')).toBe('Charlie');
  });

  it('formats nickname with [AFK] without exceeding 32 characters', () => {
    expect(formatAfkNickname('Alice')).toBe('[AFK] Alice');
    const veryLongName = 'SuperExtremelyLongDiscordUsernameHere1234567890';
    const formatted = formatAfkNickname(veryLongName);
    expect(formatted.length).toBeLessThanOrEqual(32);
    expect(formatted.startsWith('[AFK] ')).toBe(true);
  });

  it('avoids double [AFK] prefix when user already has [AFK]', () => {
    expect(formatAfkNickname('[AFK] Dave')).toBe('[AFK] Dave');
    expect(formatAfkNickname('[AFK] [AFK] Dave')).toBe('[AFK] Dave');
  });
});

describe('Discord Message Chunker', () => {
  it('returns short message as single chunk', () => {
    const text = 'Halo dunia!';
    const chunks = splitDiscordMessage(text, 2000);
    expect(chunks).toEqual([text]);
  });

  it('splits long message accurately within maxLength', () => {
    const paragraph1 = 'A'.repeat(1500);
    const paragraph2 = 'B'.repeat(1000);
    const fullText = `${paragraph1}\n\n${paragraph2}`;

    const chunks = splitDiscordMessage(fullText, 2000);
    expect(chunks.length).toBe(2);
    expect(chunks[0].length).toBeLessThanOrEqual(2000);
    expect(chunks[1].length).toBeLessThanOrEqual(2000);
  });

  it('handles empty or whitespace strings', () => {
    expect(splitDiscordMessage('')).toHaveLength(1);
    expect(splitDiscordMessage('   ')).toHaveLength(1);
  });
});
