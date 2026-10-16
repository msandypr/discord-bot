import { describe, it, expect } from 'vitest';
import { formatDiscordMentions } from '../src/utils/mentions.js';

describe('formatDiscordMentions', () => {
  it('converts plain @username to <@userId>', () => {
    const input = 'Halo @sandy, lu ngapain sih?';
    const users = [{ id: '123456789', name: 'sandy' }];
    const output = formatDiscordMentions(input, users);

    expect(output).toBe('Halo <@123456789>, lu ngapain sih?');
  });

  it('is case-insensitive when matching usernames', () => {
    const input = 'Woi @Sandy dan @SANDY!';
    const users = [{ id: '123456789', name: 'sandy' }];
    const output = formatDiscordMentions(input, users);

    expect(output).toBe('Woi <@123456789> dan <@123456789>!');
  });

  it('leaves existing <@userId> mentions untouched', () => {
    const input = 'Halo <@123456789>, lu ngapain sih?';
    const users = [{ id: '123456789', name: 'sandy' }];
    const output = formatDiscordMentions(input, users);

    expect(output).toBe('Halo <@123456789>, lu ngapain sih?');
  });

  it('handles multiple users correctly (user and referenced friend)', () => {
    const input = 'Kata @sandy si @budi itu aneh.';
    const users = [
      { id: '111', name: 'sandy' },
      { id: '222', name: 'budi' },
    ];
    const output = formatDiscordMentions(input, users);

    expect(output).toBe('Kata <@111> si <@222> itu aneh.');
  });
});
