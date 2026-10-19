import { Interaction } from 'discord.js';
import { handleAskCommand } from '../commands/ask.js';
import { handleResetCommand } from '../commands/reset.js';
import { handleAfkCommand, handleUnafkCommand } from '../commands/afk.js';
import { handleHelpCommand } from '../commands/help.js';
import { handleAboutCommand } from '../commands/about.js';

export async function handleInteractionCreate(interaction: Interaction): Promise<void> {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  if (interaction.commandName === 'ask') {
    await handleAskCommand(interaction);
  } else if (interaction.commandName === 'reset') {
    await handleResetCommand(interaction);
  } else if (interaction.commandName === 'afk') {
    await handleAfkCommand(interaction);
  } else if (interaction.commandName === 'unafk') {
    await handleUnafkCommand(interaction);
  } else if (interaction.commandName === 'help') {
    await handleHelpCommand(interaction);
  } else if (interaction.commandName === 'about') {
    await handleAboutCommand(interaction);
  }
}
