import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleMessageCreate } from '../src/events/messageCreate.js';
import { afkStore } from '../src/services/afkStore.js';
import { aiService } from '../src/services/ai/index.js';

describe('messageCreate Pipeline', () => {
  beforeEach(() => {
    // Reset any AFK state for test users
    afkStore.removeAFK('user_normal', 'guild_test');
    afkStore.removeAFK('user_owner', 'guild_test');
    afkStore.removeAFK('user_target', 'guild_test');
  });

  it('sets AFK status and changes nickname when !afk is typed', async () => {
    const setNicknameMock = vi.fn().mockResolvedValue(undefined);
    const replyMock = vi.fn().mockResolvedValue(undefined);

    const mockMessage: any = {
      author: { id: 'user_normal', bot: false, username: 'Budi' },
      guild: { id: 'guild_test' },
      member: {
        nickname: 'Budi',
        displayName: 'Budi',
        user: { username: 'Budi', tag: 'Budi#1234' },
        setNickname: setNicknameMock,
      },
      channel: { sendTyping: vi.fn(), send: vi.fn() },
      content: '!afk Sedang makan siang',
      reply: replyMock,
      mentions: { users: new Map() },
    };

    await handleMessageCreate(mockMessage);

    expect(setNicknameMock).toHaveBeenCalledWith('[AFK] Budi');
    expect(afkStore.isAFK('user_normal', 'guild_test')).toBe(true);

    const record = afkStore.getAFK('user_normal', 'guild_test');
    expect(record?.reason).toBe('Sedang makan siang');
    expect(record?.originalNickname).toBe('Budi');

    expect(replyMock).toHaveBeenCalled();
    const replyContent = replyMock.mock.calls[0][0].content;
    expect(replyContent).toContain('💤 <@user_normal> sekarang sedang AFK: **Sedang makan siang**');
  });

  it('handles server owner permission restriction (50013) gracefully', async () => {
    const error50013 = new Error('Missing Permissions');
    (error50013 as any).code = 50013;
    const setNicknameMock = vi.fn().mockRejectedValue(error50013);
    const replyMock = vi.fn().mockResolvedValue(undefined);

    const mockMessage: any = {
      author: { id: 'user_owner', bot: false, username: 'Boss' },
      guild: { id: 'guild_test' },
      member: {
        nickname: 'Boss',
        displayName: 'Boss',
        user: { username: 'Boss', tag: 'Boss#0001' },
        setNickname: setNicknameMock,
      },
      channel: { sendTyping: vi.fn(), send: vi.fn() },
      content: '!afk Ada urusan kantor',
      reply: replyMock,
      mentions: { users: new Map() },
    };

    // Should not throw
    await handleMessageCreate(mockMessage);

    expect(afkStore.isAFK('user_owner', 'guild_test')).toBe(true);
    expect(replyMock).toHaveBeenCalled();
    const replyContent = replyMock.mock.calls[0][0].content;
    expect(replyContent).toContain('tidak dapat diubah otomatis');
  });

  it('auto-removes AFK status and restores nickname when user chats', async () => {
    // Pre-set user to AFK
    afkStore.setAFK({
      userId: 'user_normal',
      guildId: 'guild_test',
      originalNickname: 'BudiAsli',
      reason: 'Istirahat',
      afkSince: Date.now() - 60000, // 1 menit yang lalu
    });

    const setNicknameMock = vi.fn().mockResolvedValue(undefined);
    const replyMock = vi.fn().mockResolvedValue(undefined);

    const mockMessage: any = {
      author: { id: 'user_normal', bot: false, username: 'Budi' },
      guild: { id: 'guild_test' },
      member: {
        nickname: '[AFK] BudiAsli',
        displayName: '[AFK] BudiAsli',
        user: { username: 'Budi', tag: 'Budi#1234' },
        setNickname: setNicknameMock,
      },
      channel: { sendTyping: vi.fn(), send: vi.fn() },
      content: 'Halo teman-teman, saya sudah kembali!',
      reply: replyMock,
      mentions: { users: new Map() },
    };

    await handleMessageCreate(mockMessage);

    // Nickname should be restored to original
    expect(setNicknameMock).toHaveBeenCalledWith('BudiAsli');
    // AFK status should be cleared
    expect(afkStore.isAFK('user_normal', 'guild_test')).toBe(false);

    expect(replyMock).toHaveBeenCalled();
    const replyContent = replyMock.mock.calls[0][0].content;
    expect(replyContent).toContain('👋 Selamat datang kembali <@user_normal>');
    expect(replyContent).toContain('AFK selama:');
  });

  it('responds when an AFK user is mentioned', async () => {
    afkStore.setAFK({
      userId: 'user_target',
      guildId: 'guild_test',
      originalNickname: 'TargetUser',
      reason: 'Belajar Coding',
      afkSince: Date.now() - 120000,
    });

    const replyMock = vi.fn().mockResolvedValue(undefined);
    const mentionsMap = new Map();
    mentionsMap.set('user_target', { id: 'user_target', bot: false });

    const mockMessage: any = {
      author: { id: 'user_other', bot: false, username: 'OtherUser' },
      guild: { id: 'guild_test' },
      member: {
        user: { username: 'OtherUser' },
      },
      channel: { sendTyping: vi.fn(), send: vi.fn() },
      content: 'Hey @user_target kamu di mana?',
      reply: replyMock,
      mentions: { users: mentionsMap },
    };

    await handleMessageCreate(mockMessage);

    expect(replyMock).toHaveBeenCalled();
    const replyContent = replyMock.mock.calls[0][0].content;
    expect(replyContent).toContain('ℹ️ <@user_target> saat ini sedang AFK: **Belajar Coding**');
  });

  it('handles !ask text command and replies with AI answer', async () => {
    vi.spyOn(aiService, 'askAI').mockResolvedValue('RAM adalah memori sementara, ROM adalah memori permanen.');

    const sendTypingMock = vi.fn().mockResolvedValue(undefined);
    const replyMock = vi.fn().mockResolvedValue(undefined);

    const mockMessage: any = {
      author: { id: 'user_normal', bot: false, username: 'Budi' },
      guild: { id: 'guild_test' },
      member: {
        displayName: 'Budi',
        user: { username: 'Budi' },
      },
      channel: { sendTyping: sendTypingMock, send: vi.fn() },
      content: '!ask apa perbedaan RAM dan ROM?',
      reply: replyMock,
      mentions: { users: new Map() },
    };

    await handleMessageCreate(mockMessage);

    expect(sendTypingMock).toHaveBeenCalled();
    expect(aiService.askAI).toHaveBeenCalledWith('apa perbedaan RAM dan ROM?', 'Budi', 'user_normal');
    expect(replyMock).toHaveBeenCalledWith({
      content: 'RAM adalah memori sementara, ROM adalah memori permanen.',
      allowedMentions: { repliedUser: true, parse: ['users'] },
    });
  });

  it('shows reminder when !ask is called without a question', async () => {
    const replyMock = vi.fn().mockResolvedValue(undefined);

    const mockMessage: any = {
      author: { id: 'user_normal', bot: false, username: 'Budi' },
      guild: { id: 'guild_test' },
      member: { displayName: 'Budi', user: { username: 'Budi' } },
      channel: { sendTyping: vi.fn(), send: vi.fn() },
      content: '!ask',
      reply: replyMock,
      mentions: { users: new Map() },
    };

    await handleMessageCreate(mockMessage);

    expect(replyMock).toHaveBeenCalled();
    const replyContent = replyMock.mock.calls[0][0].content;
    expect(replyContent).toContain('Harap sertakan pertanyaan Anda');
  });

  it('clears conversation session when !reset is typed', async () => {
    const replyMock = vi.fn().mockResolvedValue(undefined);

    const mockMessage: any = {
      author: { id: 'user_normal', bot: false, username: 'Budi' },
      guild: { id: 'guild_test' },
      member: { displayName: 'Budi', user: { username: 'Budi' } },
      channel: { sendTyping: vi.fn(), send: vi.fn() },
      content: '!reset',
      reply: replyMock,
      mentions: { users: new Map() },
    };

    await handleMessageCreate(mockMessage);

    expect(replyMock).toHaveBeenCalled();
    const replyContent = replyMock.mock.calls[0][0].content;
    expect(replyContent).toContain('🧹 Konteks percakapan AI Anda telah di-reset');
  });

  it('triggers AI when user replies to the bot without !ask', async () => {
    vi.spyOn(aiService, 'askAI').mockResolvedValue('Mohammad Hatta wakilnya.');

    const sendTypingMock = vi.fn().mockResolvedValue(undefined);
    const replyMock = vi.fn().mockResolvedValue(undefined);

    const mockMessage: any = {
      author: { id: 'user_normal', bot: false, username: 'Budi' },
      guild: { id: 'guild_test' },
      member: { displayName: 'Budi', user: { username: 'Budi' } },
      channel: {
        sendTyping: sendTypingMock,
        send: vi.fn(),
        messages: {
          cache: new Map([['bot_msg_1', { author: { id: 'bot_app_id' } }]]),
        },
      },
      client: { user: { id: 'bot_app_id' } },
      reference: { messageId: 'bot_msg_1' },
      content: 'terus wakilnya siapa?',
      reply: replyMock,
      mentions: { users: new Map(), repliedUser: { id: 'bot_app_id' } },
    };

    await handleMessageCreate(mockMessage);

    expect(sendTypingMock).toHaveBeenCalled();
    expect(aiService.askAI).toHaveBeenCalledWith('terus wakilnya siapa?', 'Budi', 'user_normal');
    expect(replyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'Mohammad Hatta wakilnya.',
      })
    );
  });

  it('triggers AI when user directly mentions the bot without !ask', async () => {
    vi.spyOn(aiService, 'askAI').mockResolvedValue('Langit biru karena hamburan cahaya.');

    const sendTypingMock = vi.fn().mockResolvedValue(undefined);
    const replyMock = vi.fn().mockResolvedValue(undefined);
    const mentionsMap = new Map([['bot_app_id', { id: 'bot_app_id', bot: true }]]);

    const mockMessage: any = {
      author: { id: 'user_normal', bot: false, username: 'Budi' },
      guild: { id: 'guild_test' },
      member: { displayName: 'Budi', user: { username: 'Budi' } },
      channel: { sendTyping: sendTypingMock, send: vi.fn() },
      client: { user: { id: 'bot_app_id' } },
      content: '<@bot_app_id> kenapa langit biru?',
      reply: replyMock,
      mentions: { users: mentionsMap },
    };

    await handleMessageCreate(mockMessage);

    expect(sendTypingMock).toHaveBeenCalled();
    expect(aiService.askAI).toHaveBeenCalledWith('kenapa langit biru?', 'Budi', 'user_normal');
    expect(replyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'Langit biru karena hamburan cahaya.',
      })
    );
  });

  it('replies with annoyance when bot is mentioned with empty text', async () => {
    const replyMock = vi.fn().mockResolvedValue(undefined);
    const mentionsMap = new Map([['bot_app_id', { id: 'bot_app_id', bot: true }]]);

    const mockMessage: any = {
      author: { id: 'user_normal', bot: false, username: 'Budi' },
      guild: { id: 'guild_test' },
      member: { displayName: 'Budi', user: { username: 'Budi' } },
      channel: { sendTyping: vi.fn(), send: vi.fn() },
      client: { user: { id: 'bot_app_id' } },
      content: '<@bot_app_id>',
      reply: replyMock,
      mentions: { users: mentionsMap },
    };

    await handleMessageCreate(mockMessage);

    expect(replyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('Napa manggil-manggil gue?'),
      })
    );
  });

  it('includes context when replying to a friend and tagging @Bot', async () => {
    vi.spyOn(aiService, 'askAI').mockResolvedValue('Budi ngawur, HTML itu bukan bahasa pemrograman buat ngehack.');

    const sendTypingMock = vi.fn().mockResolvedValue(undefined);
    const replyMock = vi.fn().mockResolvedValue(undefined);
    const mentionsMap = new Map([['bot_app_id', { id: 'bot_app_id', bot: true }]]);

    const mockMessage: any = {
      author: { id: 'user_normal', bot: false, username: 'Agus' },
      guild: { id: 'guild_test' },
      member: { displayName: 'Agus', user: { username: 'Agus' } },
      channel: {
        sendTyping: sendTypingMock,
        send: vi.fn(),
        messages: {
          cache: new Map([
            [
              'friend_msg_1',
              {
                author: { id: 'user_friend', username: 'Budi' },
                member: { displayName: 'Budi' },
                content: 'Gue mau ngehack NASA pake tag <div> HTML bro.',
              },
            ],
          ]),
        },
      },
      client: { user: { id: 'bot_app_id' } },
      reference: { messageId: 'friend_msg_1' },
      content: '<@bot_app_id> bener gak sih kata dia?',
      reply: replyMock,
      mentions: { users: mentionsMap, repliedUser: { id: 'user_friend' } },
    };

    await handleMessageCreate(mockMessage);

    expect(sendTypingMock).toHaveBeenCalled();
    expect(aiService.askAI).toHaveBeenCalledWith(
      expect.stringContaining('[Konteks pesan yang sedang di-reply dari Budi (tag: <@user_friend>)]: "Gue mau ngehack NASA pake tag <div> HTML bro."'),
      'Agus',
      'user_normal'
    );
    expect(aiService.askAI).toHaveBeenCalledWith(
      expect.stringContaining('[Tanggapan/Pertanyaan dari Agus]: "bener gak sih kata dia?"'),
      'Agus',
      'user_normal'
    );
    expect(replyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'Budi ngawur, HTML itu bukan bahasa pemrograman buat ngehack.',
      })
    );
  });

  it('includes context when replying to a friend using !ask', async () => {
    vi.spyOn(aiService, 'askAI').mockResolvedValue('Mending beli motor daripada laptop 50jt buat Zuma.');

    const sendTypingMock = vi.fn().mockResolvedValue(undefined);
    const replyMock = vi.fn().mockResolvedValue(undefined);

    const mockMessage: any = {
      author: { id: 'user_normal', bot: false, username: 'Agus' },
      guild: { id: 'guild_test' },
      member: { displayName: 'Agus', user: { username: 'Agus' } },
      channel: {
        sendTyping: sendTypingMock,
        send: vi.fn(),
        messages: {
          cache: new Map([
            [
              'friend_msg_2',
              {
                author: { id: 'user_friend', username: 'Budi' },
                member: { displayName: 'Budi' },
                content: 'Gue mau beli laptop 50 juta buat main Zuma.',
              },
            ],
          ]),
        },
      },
      client: { user: { id: 'bot_app_id' } },
      reference: { messageId: 'friend_msg_2' },
      content: '!ask mending beli apa?',
      reply: replyMock,
      mentions: { users: new Map(), repliedUser: { id: 'user_friend' } },
    };

    await handleMessageCreate(mockMessage);

    expect(sendTypingMock).toHaveBeenCalled();
    expect(aiService.askAI).toHaveBeenCalledWith(
      expect.stringContaining('[Konteks pesan yang sedang di-reply dari Budi (tag: <@user_friend>)]: "Gue mau beli laptop 50 juta buat main Zuma."'),
      'Agus',
      'user_normal'
    );
    expect(aiService.askAI).toHaveBeenCalledWith(
      expect.stringContaining('[Tanggapan/Pertanyaan dari Agus]: "mending beli apa?"'),
      'Agus',
      'user_normal'
    );
  });
});
