import { Interaction } from 'discord.js';
import { handleAskCommand } from '../commands/ask.js';

export async function handleInteractionCreate(interaction: Interaction): Promise<void> {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  if (interaction.commandName === 'ask') {
    await handleAskCommand(interaction);
  }
}
