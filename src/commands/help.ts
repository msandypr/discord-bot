import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const helpCommandData = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Menampilkan menu bantuan dan daftar perintah bot');

export function createHelpEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('📖 Menu Bantuan')
    .setDescription('Daftar perintah yang tersedia:')
    .addFields(
      {
        name: '🤖 AI Assistant',
        value:
          '• `/ask <prompt>` / `!ask <pertanyaan>` — Tanya AI\n' +
          '• `@Bot <pertanyaan>` — Tanya via mention di channel\n' +
          '• **Reply Pesan Bot** — Balas pesan bot untuk melanjutkan obrolan\n' +
          '• **Reply Teman + @Bot** — Minta komentar bot atas pesan teman\n' +
          '• `/reset` / `!reset` — Reset memori percakapan AI',
      },
      {
        name: '💤 Sistem AFK',
        value:
          '• `/afk [alasan]` / `!afk [alasan]` — Pasang status AFK\n' +
          '• `/unafk` — Cabut status AFK manual\n' +
          '• *Ketik pesan apa saja di server untuk auto-remove AFK*',
      },
      {
        name: 'ℹ️ Informasi',
        value:
          '• `/help` / `!help` — Menu bantuan ini\n' +
          '• `/about` / `!about` — Info copyright & kreator ([@msandypr](https://instagram.com/msandypr))',
      }
    )
    .setFooter({ text: '© msandypr • Dibuat oleh @msandypr' })
    .setTimestamp();
}

export async function handleHelpCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const embed = createHelpEmbed();
  await interaction.reply({ embeds: [embed] });
}
