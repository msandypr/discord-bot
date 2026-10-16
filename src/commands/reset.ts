import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { conversationStore } from '../services/conversationStore.js';

export const resetCommandData = new SlashCommandBuilder()
  .setName('reset')
  .setDescription('Reset memori konteks percakapan AI Anda (memulai topik baru)');

export async function handleResetCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const userId = interaction.user.id;
  conversationStore.clearSession(userId);

  await interaction.reply({
    content: '🧹 Konteks percakapan AI Anda telah di-reset! Sekarang kita bisa mulai topik baru.',
    ephemeral: true,
  });
}
