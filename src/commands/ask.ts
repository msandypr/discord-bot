import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { aiService } from '../services/ai/index.js';
import { splitDiscordMessage } from '../utils/chunker.js';

export const askCommandData = new SlashCommandBuilder()
  .setName('ask')
  .setDescription('Tanyakan apa saja ke AI Assistant (Gemini / OpenAI / Groq / Ollama)')
  .addStringOption(option =>
    option
      .setName('prompt')
      .setDescription('Pertanyaan atau instruksi yang ingin diajukan')
      .setRequired(true)
  );

export async function handleAskCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const prompt = interaction.options.getString('prompt', true);

  // Defer reply seketika (< 3 detik) untuk mencegah Discord interaction timeout
  await interaction.deferReply();

  try {
    const displayName =
      interaction.member instanceof GuildMember
        ? interaction.member.displayName
        : interaction.user.displayName || interaction.user.username;

    const answer = await aiService.askAI(prompt, displayName);

    // Discord message limit is 2000 characters
    const chunks = splitDiscordMessage(answer, 2000);

    // Edit pesan deferral pertama
    await interaction.editReply({ content: chunks[0] });

    // Kirim sisa potongan sebagai pesan follow-up jika balasan sangat panjang
    for (let i = 1; i < chunks.length; i++) {
      await interaction.followUp({ content: chunks[i] });
    }
  } catch (error) {
    console.error('Error handling /ask command:', error);
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          content: '❌ Maaf, terjadi kesalahan internal saat memproses perintah `/ask`.',
        });
      } else {
        await interaction.reply({
          content: '❌ Maaf, terjadi kesalahan internal saat memproses perintah `/ask`.',
          ephemeral: true,
        });
      }
    } catch {
      // Ignore if interaction token expired
    }
  }
}
