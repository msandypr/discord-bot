export interface MentionUser {
  id: string;
  name: string;
}

/**
 * Mengonversi teks plain mention seperti "@sandy" atau "@Budi" menjadi format mention resmi Discord "<@userId>"
 * jika model AI secara tidak sengaja menghasilkan teks biasa alih-alih tag Discord asli.
 */
export function formatDiscordMentions(text: string, users: MentionUser[]): string {
  let formatted = text;

  for (const user of users) {
    if (!user.id || !user.name) continue;

    // Bersihkan nama dari spasi atau karakter spesial untuk regex
    const trimmedName = user.name.trim();
    if (!trimmedName) continue;

    const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Cocokkan @NamaUser yang belum diawali oleh karakter '<' (bukan <@id>)
    const regex = new RegExp(`(?<!<)@${escapedName}\\b`, 'gi');
    formatted = formatted.replace(regex, `<@${user.id}>`);
  }

  return formatted;
}
