import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
} from 'discord.js';
import { afkStore } from '../services/afkStore.js';
import { formatAfkNickname, removeAfkPrefix } from '../utils/nickname.js';
import { timeSince } from '../utils/time.js';

export const afkCommandData = new SlashCommandBuilder()
  .setName('afk')
  .setDescription('Set status AFK kamu dan ubah nickname sementara')
  .addStringOption(option =>
    option
      .setName('reason')
      .setDescription('Alasan kamu AFK (contoh: lagi makan siang, meeting, istirahat)')
      .setRequired(false)
  );

export const unafkCommandData = new SlashCommandBuilder()
  .setName('unafk')
  .setDescription('Cabut status AFK kamu secara manual dan kembalikan nickname asli');

export async function handleAfkCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild || !interaction.member) {
    await interaction.reply({
      content: '❌ Perintah `/afk` hanya dapat digunakan di dalam server Discord.',
      ephemeral: true,
    });
    return;
  }

  const member = interaction.member as GuildMember;
  const userId = interaction.user.id;
  const guildId = interaction.guild.id;
  const reason = interaction.options.getString('reason')?.trim() || 'AFK';

  // Dapatkan nama asli
  const existingRecord = afkStore.getAFK(userId, guildId);
  let originalName: string;
  if (existingRecord?.originalNickname) {
    originalName = existingRecord.originalNickname;
  } else {
    const currentName = member.nickname || member.displayName || interaction.user.username;
    originalName = removeAfkPrefix(currentName) || interaction.user.username;
  }

  const newNickname = formatAfkNickname(originalName);
  let nicknameNotice = '';

  // Coba ubah nickname
  try {
    if (member.nickname !== newNickname) {
      await member.setNickname(newNickname);
    }
  } catch (err: any) {
    console.warn(`[AFK] Tidak dapat mengubah nickname untuk ${interaction.user.tag}:`, err?.message || err);
    nicknameNotice = '\n*(Catatan: Nickname tidak dapat diubah otomatis karena batasan izin role atau kepemilikan server).*';
  }

  // Simpan ke state AFK
  afkStore.setAFK({
    userId,
    guildId,
    originalNickname: originalName,
    reason,
    afkSince: Date.now(),
  });

  await interaction.reply({
    content: `💤 <@${userId}> sekarang sedang AFK: **${reason}**${nicknameNotice}`,
  });
}

export async function handleUnafkCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild || !interaction.member) {
    await interaction.reply({
      content: '❌ Perintah `/unafk` hanya dapat digunakan di dalam server Discord.',
      ephemeral: true,
    });
    return;
  }

  const member = interaction.member as GuildMember;
  const userId = interaction.user.id;
  const guildId = interaction.guild.id;

  const record = afkStore.removeAFK(userId, guildId);
  if (!record) {
    await interaction.reply({
      content: 'ℹ️ Kamu saat ini memang tidak sedang dalam status AFK.',
      ephemeral: true,
    });
    return;
  }

  // Coba kembalikan nama asli
  try {
    await member.setNickname(record.originalNickname);
  } catch (err: any) {
    console.warn(`[AFK] Gagal mengembalikan nickname untuk ${interaction.user.tag}:`, err?.message || err);
  }

  const duration = timeSince(record.afkSince);
  await interaction.reply({
    content: `👋 Selamat datang kembali <@${userId}>, status AFK kamu telah dicabut (AFK selama: **${duration}**).`,
  });
}
