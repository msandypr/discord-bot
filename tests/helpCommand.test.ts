import { describe, it, expect, vi } from 'vitest';
import { handleHelpCommand, createHelpEmbed } from '../src/commands/help.js';

describe('Help Command & Embed', () => {
  it('creates an embed containing command list and creator info', () => {
    const embed = createHelpEmbed();
    const json = embed.toJSON();

    expect(json.title).toContain('Menu Bantuan');
    expect(json.fields).toBeDefined();

    const fieldNames = json.fields?.map(f => f.name).join(' ');
    expect(fieldNames).toContain('AI Assistant');
    expect(fieldNames).toContain('Sistem AFK');
    expect(fieldNames).toContain('Informasi');

    const fieldValues = json.fields?.map(f => f.value).join(' ');
    expect(fieldValues).toContain('/ask');
    expect(fieldValues).toContain('!ask');
    expect(fieldValues).toContain('/afk');
    expect(fieldValues).toContain('/reset');
    expect(fieldValues).toContain('/about');

    expect(json.footer?.text).toContain('@msandypr');
  });

  it('handles /help interaction and replies with help embed', async () => {
    const replyMock = vi.fn().mockResolvedValue(undefined);
    const mockInteraction: any = {
      reply: replyMock,
    };

    await handleHelpCommand(mockInteraction);

    expect(replyMock).toHaveBeenCalledTimes(1);
    const callArg = replyMock.mock.calls[0][0];
    expect(callArg.embeds).toBeDefined();
    expect(callArg.embeds).toHaveLength(1);
    expect(callArg.embeds[0].data.title).toContain('Menu Bantuan');
  });
});
