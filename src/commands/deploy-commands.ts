import { REST, Routes } from 'discord.js';
import { config } from '../config.js';
import { askCommandData } from './ask.js';
import { resetCommandData } from './reset.js';
import { afkCommandData, unafkCommandData } from './afk.js';
import { helpCommandData } from './help.js';
import { aboutCommandData } from './about.js';

const commands = [
  askCommandData.toJSON(),
  resetCommandData.toJSON(),
  afkCommandData.toJSON(),
  unafkCommandData.toJSON(),
  helpCommandData.toJSON(),
  aboutCommandData.toJSON(),
];

const rest = new REST({ version: '10' }).setToken(config.discordToken);

async function deploy() {
  if (!config.discordToken || !config.applicationId) {
    console.error('❌ DISCORD_BOT_TOKEN dan DISCORD_APPLICATION_ID wajib diisi di .env untuk mendaftarkan slash command.');
    process.exit(1);
  }

  try {
    console.log(`Memulai pendaftaran ${commands.length} application (/) command(s)...`);

    if (config.guildId) {
      console.log(`📍 Mendaftarkan command ke Guild ID: ${config.guildId} (Instant deployment)`);
      await rest.put(
        Routes.applicationGuildCommands(config.applicationId, config.guildId),
        { body: commands }
      );
      console.log('✅ Berhasil mendaftarkan slash commands ke guild!');
    } else {
      console.log('🌍 Mendaftarkan command secara Global (bisa memakan waktu beberapa menit untuk propagasi)...');
      await rest.put(
        Routes.applicationCommands(config.applicationId),
        { body: commands }
      );
      console.log('✅ Berhasil mendaftarkan slash commands secara global!');
    }
  } catch (error) {
    console.error('❌ Gagal mendaftarkan slash command:', error);
    process.exit(1);
  }
}

deploy();
