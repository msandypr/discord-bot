# Discord Assistant & AFK Manager Bot 🤖💤

Bot Discord multifungsi yang memadukan **AI Personal Assistant** berbasis multi-provider (**Google Gemini & OpenAI-Compatible**: DeepSeek, Groq, OpenRouter, Ollama, OpenAI) dengan sistem **Presence & AFK Management** otomatis.

---

## 🌟 Fitur Utama

1. **Multi-Provider AI Assistant (`/ask` Slash Command):**
   * **Google Gemini:** Native support via `@google/genai` (`gemini-2.5-flash`, `gemini-1.5-flash`).
   * **OpenAI-Compatible Providers:**
     * **Groq:** Inferensi ultra-cepat gratis (`llama-3.3-70b-versatile`).
     * **DeepSeek:** Model penalaran & chat hemat biaya (`deepseek-chat`, `deepseek-reasoner`).
     * **OpenRouter:** Akses ratusan model open-source & proprietary.
     * **Local LLM (Offline):** Dukungan penuh untuk Ollama (`http://localhost:11434/v1`) dan LM Studio tanpa biaya API.
     * **OpenAI Resmi:** `gpt-4o`, `gpt-4o-mini`.
   * **Auto Deferral & Anti-Timeout:** Merespons seketika (`deferReply()`) agar tidak terkena batas waktu timeout Discord (3 detik).
   * **Message Chunking:** Otomatis membagi jawaban panjang $> 2000$ karakter secara cerdas agar tidak terpotong.

2. **Sistem AFK Pintar (`!afk [alasan]`):**
   * **Set AFK:** Mengetik `!afk [alasan]` (contoh: `!afk lagi makan`) otomatis menambahkan status AFK dan mengubah nama server menjadi `[AFK] <Nama>`.
   * **Batas 32 Karakter & Anti-Double Prefix:** Nama otomatis dipotong rapi maksimal 32 karakter dan tidak akan menghasilkan `[AFK] [AFK] ...`.
   * **Penanganan Server Owner / Izin:** Jika user adalah pemilik server (owner) atau bot berada di bawah hierarki role, bot tetap mencatat status AFK dan memberikan notifikasi sopan tanpa mengalami crash.
   * **Auto-Remove AFK:** Status AFK otomatis dicabut dan nickname dikembalikan ke nama aslinya seketika user kembali aktif mengetik di channel, disertai kalkulasi durasi AFK (misal: `AFK selama: 15 menit`).
   * **Mention Auto-Responder:** Member lain yang me-mention/tag user yang sedang AFK akan diberitahu alasan dan durasi AFK user tersebut, dilengkapi anti-spam cooldown (10 detik per user).

3. **Penyimpanan Persisten (SQLite):**
   * Status AFK disimpan menggunakan SQLite lokal (`data/afk.sqlite`), sehingga data tidak hilang saat bot di-restart.

---

## 🚀 Panduan Setup & Menjalankan Bot

### 1. Prasyarat Discord Developer Portal
Kunjungi [Discord Developer Portal](https://discord.com/developers/applications):
1. Buat aplikasi dan tambahkan bot.
2. Di tab **Bot** -> **Privileged Gateway Intents**, aktifkan:
   * ✅ **Message Content Intent** (Wajib untuk membaca `!afk` dan mention)
   * ✅ **Server Members Intent** (Direkomendasikan untuk manajemen nickname)
3. Di server Discord Anda, pastikan role bot berada **di atas** role member yang ingin diubah nicknamenya di `Server Settings -> Roles`.

### 2. Konfigurasi Lingkungan (`.env`)
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Isi kredensial Discord:
```ini
DISCORD_BOT_TOKEN=token_bot_anda_di_sini
DISCORD_APPLICATION_ID=application_id_bot_anda
DISCORD_GUILD_ID=id_server_anda_untuk_testing_cepat (opsional)
```

Pilih provider AI sesuai kebutuhan:

#### Opsi A: Google Gemini (Default)
```ini
AI_PROVIDER=gemini
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-2.5-flash
```

#### Opsi B: Groq (Inferensi Ultra-Cepat)
```ini
AI_PROVIDER=openai
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_API_KEY=gsk_...
OPENAI_MODEL=llama-3.3-70b-versatile
```

#### Opsi C: DeepSeek
```ini
AI_PROVIDER=openai
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_API_KEY=sk-...
OPENAI_MODEL=deepseek-chat
```

#### Opsi D: Local LLM via Ollama (Gratis & Offline)
```ini
AI_PROVIDER=openai
OPENAI_BASE_URL=http://localhost:11434/v1
OPENAI_API_KEY=ollama
OPENAI_MODEL=llama3.2
```

### 3. Daftarkan Slash Command (`/ask`)
Jalankan perintah ini satu kali untuk mendaftarkan command `/ask` ke Discord:
```bash
npm run deploy-commands
```

### 4. Jalankan Bot
Mode development (hot reload):
```bash
npm run dev
```

Mode production:
```bash
npm run build
npm start
```

---

## 🧪 Pengujian Unit Test

Jalankan suite pengujian unit menggunakan Vitest:
```bash
npm test
```
Suite mencakup 31 skenario pengujian:
* Pemotongan nama maksimal 32 karakter dan pencegahan duplikasi prefix `[AFK]`.
* Formatter durasi waktu relatif ("15 menit", "1 jam 20 menit").
* Message chunking untuk batas pesan Discord 2000 karakter.
* Persistensi SQLite dan cooldown limiter pada `AFKStore`.
* Pipeline event `messageCreate` (Set AFK, Auto-remove, Mention auto-responder, Graceful permission handling).
* Deteksi otomatis & factory selector multi-provider AI (Gemini vs OpenAI vs Groq vs Ollama).
* Error handling provider (API key salah, kuota habis, connection refused).
* Slash command `/ask` deferral & AI response formatting.
