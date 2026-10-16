import { Client, GatewayIntentBits, Events } from 'discord.js';
import { config } from './config.js';
import { handleReady } from './events/ready.js';
import { handleInteractionCreate } from './events/interactionCreate.js';
import { handleMessageCreate } from './events/messageCreate.js';
import { afkStore } from './services/afkStore.js';

// Pastikan token tersedia sebelum inisialisasi
if (!config.discordToken) {
  console.error('❌ DISCORD_BOT_TOKEN belum diset di file .env!');
  console.error('👉 Salin .env.example menjadi .env dan masukkan token bot Anda.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Event Handlers
client.once(Events.ClientReady, handleReady);
client.on(Events.InteractionCreate, handleInteractionCreate);
client.on(Events.MessageCreate, handleMessageCreate);

// Graceful Shutdown
function handleShutdown(signal: string) {
  console.log(`\n🛑 Menerima sinyal ${signal}, menutup bot dengan rapi...`);
  afkStore.close();
  client.destroy();
  process.exit(0);
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

// Login to Discord
client.login(config.discordToken).catch(err => {
  console.error('❌ Gagal login ke Discord:', err);
  process.exit(1);
});
