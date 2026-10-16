import { Client, ActivityType } from 'discord.js';
import { aiService } from '../services/ai/index.js';

export function handleReady(client: Client<true>): void {
  console.log(`🤖 Bot berhasil login sebagai ${client.user.tag} (ID: ${client.user.id})`);
  console.log(`📡 Terhubung ke ${client.guilds.cache.size} server Discord.`);
  console.log(`🧠 AI Provider Aktif: ${aiService.currentProvider.name} (Model: ${aiService.currentProvider.model})`);

  client.user.setPresence({
    activities: [
      {
        name: `!afk & /ask (${aiService.currentProvider.name})`,
        type: ActivityType.Custom,
        state: `Ketik !afk atau gunakan /ask untuk bantuan AI`,
      },
    ],
    status: 'online',
  });
}
