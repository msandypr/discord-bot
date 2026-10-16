/**
 * Format durasi milidetik ke teks bahasa Indonesia yang mudah dibaca.
 * Contoh: 45000 -> "45 detik", 900000 -> "15 menit", 7320000 -> "2 jam 2 menit"
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${Math.max(1, seconds)} detik`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes} menit ${remainingSeconds} detik` : `${minutes} menit`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours} jam ${remainingMinutes} menit` : `${hours} jam`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days} hari ${remainingHours} jam` : `${days} hari`;
}

/**
 * Mengembalikan durasi sejak waktu lampau (timestamp / Date) hingga sekarang.
 */
export function timeSince(since: number | Date): string {
  const pastTime = typeof since === 'number' ? since : since.getTime();
  const elapsed = Math.max(0, Date.now() - pastTime);
  return formatDuration(elapsed);
}
