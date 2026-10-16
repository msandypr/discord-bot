import { describe, it, expect, vi } from 'vitest';
import { handleAskCommand } from '../src/commands/ask.js';
import { aiService } from '../src/services/ai/index.js';

describe('/ask Command Handler', () => {
  it('calls deferReply, queries AI service, and sends response via editReply', async () => {
    vi.spyOn(aiService, 'askAI').mockResolvedValue('Ini adalah balasan AI dari model aktif.');

    const deferReplyMock = vi.fn().mockResolvedValue(undefined);
    const editReplyMock = vi.fn().mockResolvedValue(undefined);
    const followUpMock = vi.fn().mockResolvedValue(undefined);

    const mockInteraction: any = {
      options: {
        getString: vi.fn().mockReturnValue('Jelaskan teori relativitas'),
      },
      user: { id: 'user-123', username: 'TestUser', displayName: 'TestUser' },
      member: null,
      deferReply: deferReplyMock,
      editReply: editReplyMock,
      followUp: followUpMock,
      deferred: true,
      replied: false,
    };

    await handleAskCommand(mockInteraction);

    expect(deferReplyMock).toHaveBeenCalled();
    expect(aiService.askAI).toHaveBeenCalledWith('Jelaskan teori relativitas', 'TestUser', 'user-123');
    expect(editReplyMock).toHaveBeenCalledWith({ content: 'Ini adalah balasan AI dari model aktif.' });
    expect(followUpMock).not.toHaveBeenCalled();
  });

  it('chunks response and sends follow-ups when answer exceeds 2000 characters', async () => {
    const longAnswer = 'Paragraf 1: ' + 'A'.repeat(1500) + '\n\n' + 'Paragraf 2: ' + 'B'.repeat(1000);
    vi.spyOn(aiService, 'askAI').mockResolvedValue(longAnswer);

    const deferReplyMock = vi.fn().mockResolvedValue(undefined);
    const editReplyMock = vi.fn().mockResolvedValue(undefined);
    const followUpMock = vi.fn().mockResolvedValue(undefined);

    const mockInteraction: any = {
      options: {
        getString: vi.fn().mockReturnValue('Tulis esai panjang'),
      },
      user: { username: 'LongUser', displayName: 'LongUser' },
      member: null,
      deferReply: deferReplyMock,
      editReply: editReplyMock,
      followUp: followUpMock,
      deferred: true,
      replied: false,
    };

    await handleAskCommand(mockInteraction);

    expect(deferReplyMock).toHaveBeenCalled();
    expect(editReplyMock).toHaveBeenCalled();
    expect(followUpMock).toHaveBeenCalled();
  });
});
