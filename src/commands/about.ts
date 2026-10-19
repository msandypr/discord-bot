import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';

export const INSTAGRAM_URL = 'https://instagram.com/msandypr';

export const aboutCommandData = new SlashCommandBuilder()
  .setName('about')
  .setDescription('Info copyright dan kreator bot (@msandypr)');

export function createAboutEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🤖 About')
    .setDescription('Bot ini dibuat oleh [@msandypr](https://instagram.com/msandypr)')
    .setFooter({ text: '© msandypr' })
    .setTimestamp();
}

export function createAboutComponents(): ActionRowBuilder<ButtonBuilder>[] {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel('Instagram (@msandypr)')
      .setStyle(ButtonStyle.Link)
      .setURL(INSTAGRAM_URL)
  );
  return [row];
}

export async function handleAboutCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const embed = createAboutEmbed();
  const components = createAboutComponents();
  await interaction.reply({ embeds: [embed], components });
}
