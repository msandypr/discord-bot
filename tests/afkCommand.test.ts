import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleAfkCommand, handleUnafkCommand } from '../src/commands/afk.js';
import { afkStore } from '../src/services/afkStore.js';

describe('/afk and /unafk Slash Commands', () => {
  beforeEach(() => {
    afkStore.removeAFK('user_slash', 'guild_slash');
  });

  it('sets AFK and mutates nickname via /afk interaction', async () => {
    const setNicknameMock = vi.fn().mockResolvedValue(undefined);
    const replyMock = vi.fn().mockResolvedValue(undefined);

    const mockInteraction: any = {
      guild: { id: 'guild_slash' },
      user: { id: 'user_slash', username: 'Charlie', tag: 'Charlie#0001' },
      member: {
        nickname: 'Charlie',
        displayName: 'Charlie',
        setNickname: setNicknameMock,
      },
      options: {
        getString: vi.fn().mockReturnValue('makan malam'),
      },
      reply: replyMock,
    };

    await handleAfkCommand(mockInteraction);

    expect(setNicknameMock).toHaveBeenCalledWith('[AFK] Charlie');
    expect(afkStore.isAFK('user_slash', 'guild_slash')).toBe(true);

    const record = afkStore.getAFK('user_slash', 'guild_slash');
    expect(record?.reason).toBe('makan malam');

    expect(replyMock).toHaveBeenCalled();
    const replyContent = replyMock.mock.calls[0][0].content;
    expect(replyContent).toContain('💤 <@user_slash> sekarang sedang AFK: **makan malam**');
  });

  it('removes AFK and restores nickname via /unafk interaction', async () => {
    afkStore.setAFK({
      userId: 'user_slash',
      guildId: 'guild_slash',
      originalNickname: 'CharlieOriginal',
      reason: 'makan malam',
      afkSince: Date.now() - 30000,
    });

    const setNicknameMock = vi.fn().mockResolvedValue(undefined);
    const replyMock = vi.fn().mockResolvedValue(undefined);

    const mockInteraction: any = {
      guild: { id: 'guild_slash' },
      user: { id: 'user_slash', username: 'Charlie', tag: 'Charlie#0001' },
      member: {
        nickname: '[AFK] CharlieOriginal',
        displayName: '[AFK] CharlieOriginal',
        setNickname: setNicknameMock,
      },
      options: {
        getString: vi.fn().mockReturnValue(null),
      },
      reply: replyMock,
    };

    await handleUnafkCommand(mockInteraction);

    expect(setNicknameMock).toHaveBeenCalledWith('CharlieOriginal');
    expect(afkStore.isAFK('user_slash', 'guild_slash')).toBe(false);

    expect(replyMock).toHaveBeenCalled();
    const replyContent = replyMock.mock.calls[0][0].content;
    expect(replyContent).toContain('👋 Selamat datang kembali <@user_slash>');
  });
});
