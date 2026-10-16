const DISCORD_MAX_NICKNAME_LENGTH = 32;
const AFK_PREFIX = '[AFK] ';

/**
 * Mengecek apakah nickname saat ini sudah memiliki prefix [AFK].
 */
export function hasAfkPrefix(nickname: string): boolean {
  return nickname.trim().startsWith('[AFK]');
}

/**
 * Menghapus seluruh prefix [AFK] dari awal nama (meskipun berulang).
 */
export function removeAfkPrefix(nickname: string): string {
  return nickname.replace(/^(?:\[AFK\]\s*)+/i, '').trim();
}

/**
 * Memformat nickname dengan prefix [AFK] dan memotongnya maksimal 32 karakter sesuai batas Discord.
 * Menghindari prefix ganda jika user sudah memiliki nama berawalan [AFK].
 */
export function formatAfkNickname(displayName: string): string {
  const baseName = removeAfkPrefix(displayName) || 'Member';
  const newNickname = `${AFK_PREFIX}${baseName}`;
  return newNickname.slice(0, DISCORD_MAX_NICKNAME_LENGTH);
}
