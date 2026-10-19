import { describe, it, expect, vi } from 'vitest';
import { handleAboutCommand, createAboutEmbed, createAboutComponents, INSTAGRAM_URL } from '../src/commands/about.js';

describe('About Command & Embed', () => {
  it('creates an embed showing creator @msandypr with Instagram link and copyright', () => {
    const embed = createAboutEmbed();
    const json = embed.toJSON();

    expect(json.title).toBe('🤖 About');
    expect(json.description).toContain('[@msandypr](https://instagram.com/msandypr)');
    expect(json.footer?.text).toContain('© msandypr');
  });

  it('creates a button component linking to Instagram', () => {
    const components = createAboutComponents();
    expect(components).toHaveLength(1);

    const button = (components[0].components[0] as any).data;
    expect(button.url).toBe(INSTAGRAM_URL);
    expect(button.label).toContain('@msandypr');
  });

  it('handles /about interaction and replies with embed and components', async () => {
    const replyMock = vi.fn().mockResolvedValue(undefined);
    const mockInteraction: any = {
      reply: replyMock,
    };

    await handleAboutCommand(mockInteraction);

    expect(replyMock).toHaveBeenCalledTimes(1);
    const callArg = replyMock.mock.calls[0][0];
    expect(callArg.embeds).toBeDefined();
    expect(callArg.components).toBeDefined();
    expect(callArg.embeds[0].data.title).toBe('🤖 About');
    expect(callArg.embeds[0].data.description).toContain('https://instagram.com/msandypr');
  });
});
