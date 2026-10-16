import { describe, it, expect, vi } from 'vitest';
import { handleResetCommand } from '../src/commands/reset.js';
import { conversationStore } from '../src/services/conversationStore.js';

describe('/reset Command Handler', () => {
  it('clears session from conversationStore and replies with confirmation', async () => {
    vi.spyOn(conversationStore, 'clearSession');

    const replyMock = vi.fn().mockResolvedValue(undefined);
    const mockInteraction: any = {
      user: { id: 'user-to-reset', username: 'ResetUser' },
      reply: replyMock,
    };

    await handleResetCommand(mockInteraction);

    expect(conversationStore.clearSession).toHaveBeenCalledWith('user-to-reset');
    expect(replyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('🧹 Konteks percakapan AI Anda telah di-reset'),
        ephemeral: true,
      })
    );
  });
});
