import { Message } from 'discord.js';
import { afkStore } from '../services/afkStore.js';
import { aiService } from '../services/ai/index.js';
import { conversationStore } from '../services/conversationStore.js';
import { formatAfkNickname, removeAfkPrefix } from '../utils/nickname.js';
import { splitDiscordMessage } from '../utils/chunker.js';
import { timeSince } from '../utils/time.js';

const AFK_COMMAND_REGEX = /^!afk(?:\s+(.*))?$/i;
const ASK_COMMAND_REGEX = /^!ask(?:\s+(.*))?$/i;
const RESET_COMMAND_REGEX = /^!reset$/i;

async function processAiQuery(
  message: Message,
  prompt: string,
  displayName: string,
  userId: string
): Promise<void> {
  try {
    // Tampilkan indikator status "Bot is typing..." jika channel mendukung
    if ('sendTyping' in message.channel) {
      await message.channel.sendTyping();
    }

    const answer = await aiService.askAI(prompt, displayName, userId);

    // Pisahkan teks jika melebihi batas 2000 karakter Discord
    const chunks = splitDiscordMessage(answer, 2000);

    // Reply langsung ke pesan pengirim untuk potongan pertama
    await message.reply({
      content: chunks[0],
      allowedMentions: { repliedUser: true },
    });

    // Kirim sisa potongan jika ada
    if ('send' in message.channel) {
      for (let i = 1; i < chunks.length; i++) {
        await message.channel.send({ content: chunks[i] });
      }
    }
  } catch (error) {
    console.error('Error saat memproses pertanyaan AI:', error);
    await message.reply({
      content: 'Maaf bro, gue lagi sibuk',
    });
  }
}

async function getReferencedMessageContext(
  message: Message,
  botId?: string
): Promise<{ isReplyingToBot: boolean; referencedContext: string }> {
  let isReplyingToBot = false;
  let referencedContext = '';

  if (!message.reference?.messageId) {
    return { isReplyingToBot, referencedContext };
  }

  // Cek apakah user me-reply dengan ping aktif ke bot
  if (botId && message.mentions.repliedUser?.id === botId) {
    isReplyingToBot = true;
  }

  if (message.channel && 'messages' in message.channel) {
    try {
      const refMsg =
        message.channel.messages.cache.get(message.reference.messageId) ||
        (await message.channel.messages.fetch(message.reference.messageId));

      if (refMsg) {
        if (botId && refMsg.author?.id === botId) {
          isReplyingToBot = true;
        } else {
          const authorName = refMsg.member?.displayName || refMsg.author?.username || 'User Lain';
          const cleanRefContent = refMsg.content?.trim();
          if (cleanRefContent) {
            referencedContext = `[Konteks pesan yang sedang di-reply dari @${authorName}]: "${cleanRefContent}"\n`;
          }
        }
      }
    } catch {
      // Abaikan jika pesan referensi gagal di-fetch (misal sudah dihapus atau tidak ada permission)
    }
  }

  return { isReplyingToBot, referencedContext };
}

export async function handleMessageCreate(message: Message): Promise<void> {
  // 1. Abaikan pesan dari bot atau pesan di luar server (Direct Message)
  if (message.author.bot || !message.guild || !message.member) {
    return;
  }

  const content = message.content.trim();
  const guildId = message.guild.id;
  const userId = message.author.id;
  const member = message.member;
  const displayName = member.displayName || message.author.username;

  // 2. Rule 1: Set AFK Command (!afk [alasan])
  const afkMatch = content.match(AFK_COMMAND_REGEX);
  if (afkMatch) {
    const rawReason = afkMatch[1]?.trim();
    const reason = rawReason && rawReason.length > 0 ? rawReason : 'AFK';

    // Cek apakah user sebelumnya sudah tercatat AFK
    const existingRecord = afkStore.getAFK(userId, guildId);

    // Dapatkan nama asli tanpa prefix [AFK]
    let originalName: string;
    if (existingRecord?.originalNickname) {
      originalName = existingRecord.originalNickname;
    } else {
      const currentName = member.nickname || member.displayName || member.user.username;
      originalName = removeAfkPrefix(currentName) || member.user.username;
    }

    const newNickname = formatAfkNickname(originalName);
    let nicknameNotice = '';

    // Coba ganti nickname
    try {
      if (member.nickname !== newNickname) {
        await member.setNickname(newNickname);
      }
    } catch (err: any) {
      // Tangani error Discord 50013 (Missing Permissions - Server Owner / Role Hierarchy)
      console.warn(`[AFK] Tidak dapat mengubah nickname untuk ${member.user.tag}:`, err?.message || err);
      nicknameNotice = '\n*(Catatan: Nickname tidak dapat diubah otomatis karena batasan izin role atau kepemilikan server).*';
    }

    // Simpan ke AFK store
    afkStore.setAFK({
      userId,
      guildId,
      originalNickname: originalName,
      reason,
      afkSince: Date.now(),
    });

    await message.reply({
      content: `💤 <@${userId}> sekarang sedang AFK: **${reason}**${nicknameNotice}`,
      allowedMentions: { users: [userId] },
    });
    return;
  }

  // 3. Rule 2: Auto-Remove AFK (User Kembali Mengetik)
  if (afkStore.isAFK(userId, guildId)) {
    const record = afkStore.removeAFK(userId, guildId);

    if (record) {
      // Coba kembalikan nickname ke nama asli
      try {
        await member.setNickname(record.originalNickname);
      } catch (err: any) {
        console.warn(`[AFK] Gagal mengembalikan nickname untuk ${member.user.tag}:`, err?.message || err);
      }

      const duration = timeSince(record.afkSince);
      await message.reply({
        content: `👋 Selamat datang kembali <@${userId}>, status AFK kamu telah dicabut (AFK selama: **${duration}**).`,
        allowedMentions: { users: [userId] },
      });
    }
  }

  // Cek apakah pesan ini me-reply pesan lain di server
  const botId = message.client?.user?.id;
  const { isReplyingToBot, referencedContext } = await getReferencedMessageContext(message, botId);

  // 4. Rule 3: Text Command !ask [pertanyaan]
  const askMatch = content.match(ASK_COMMAND_REGEX);
  if (askMatch) {
    let prompt = askMatch[1]?.trim() || '';
    if (!prompt && !referencedContext) {
      await message.reply({
        content: '⚠️ Harap sertakan pertanyaan Anda.\nContoh: `!ask apa perbedaan RAM dan ROM?`',
      });
      return;
    }

    if (!prompt && referencedContext) {
      prompt = 'Gimana menurut lu? Komentarin atau tanggapi pesan di atas.';
    }

    const fullPrompt = referencedContext
      ? `${referencedContext}[Tanggapan/Pertanyaan dari ${displayName}]: "${prompt}"`
      : prompt;

    await processAiQuery(message, fullPrompt, displayName, userId);
    return;
  }

  // 5. Rule 4: Text Command !reset (Reset AI conversation memory)
  if (RESET_COMMAND_REGEX.test(content)) {
    conversationStore.clearSession(userId);
    await message.reply({
      content: '🧹 Konteks percakapan AI Anda telah di-reset! Sekarang kita bisa mulai topik baru.',
      allowedMentions: { repliedUser: true },
    });
    return;
  }

  // 6. Rule 5: Reply ke pesan Bot atau Mention Bot langsung (@Bot) tanpa !ask
  const isDirectBotMention = Boolean(botId && message.mentions.users.has(botId));

  if (isReplyingToBot || isDirectBotMention) {
    // Bersihkan tag mention bot jika ada
    let cleanPrompt = content;
    if (botId) {
      cleanPrompt = cleanPrompt.replace(new RegExp(`<@!?${botId}>`, 'g'), '').trim();
    }

    // Kasus 1: User me-reply pesan teman/orang lain sambil me-mention bot
    if (referencedContext) {
      const userQuestion = cleanPrompt || 'Gimana menurut lu? Komentarin atau tanggapi pesan di atas.';
      const fullPrompt = `${referencedContext}[Tanggapan/Pertanyaan dari ${displayName}]: "${userQuestion}"`;
      await processAiQuery(message, fullPrompt, displayName, userId);
      return;
    }

    // Kasus 2: User mention bot langsung tapi pesan kosong (tanpa reply)
    if (!cleanPrompt) {
      await message.reply({
        content: 'Napa manggil-manggil gue? Mau nanya apaan, buruan. 🗿',
        allowedMentions: { repliedUser: true },
      });
      return;
    }

    // Kasus 3: User me-reply bot langsung, atau mention bot dengan pertanyaan
    await processAiQuery(message, cleanPrompt, displayName, userId);
    return;
  }

  // 7. Rule 6: AFK Mention Auto-Responder (Ping Notification)
  if (message.mentions.users.size > 0) {
    for (const [mentionedId, mentionedUser] of message.mentions.users) {
      // Abaikan self-mention dan bot
      if (mentionedId === userId || mentionedUser.bot) {
        continue;
      }

      const afkData = afkStore.getAFK(mentionedId, guildId);
      if (afkData) {
        // Cek cooldown anti-spam (10 detik per user)
        if (afkStore.canSendMentionNotification(mentionedId)) {
          const duration = timeSince(afkData.afkSince);
          await message.reply({
            content: `ℹ️ <@${mentionedId}> saat ini sedang AFK: **${afkData.reason}** (${duration} yang lalu).`,
            allowedMentions: { users: [mentionedId] },
          });
        }
      }
    }
  }
}
