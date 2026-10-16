import { Client, ActivityType } from 'discord.js';

export function handleReady(client: Client<true>): void {
  console.log(`🤖 Bot berhasil login sebagai ${client.user.tag} (ID: ${client.user.id})`);
  console.log(`📡 Terhubung ke ${client.guilds.cache.size} server Discord.`);

  client.user.setPresence({
    activities: [
      {
        name: '!afk & /ask (Gemini AI)',
        type: ActivityType.Custom,
        state: 'Ketik !afk atau gunakan /ask untuk bantuan AI',
      },
    ],
    status: 'online',
  });
}
