/**
 * Memecah teks yang melebihi batas karakter Discord (2000 karakter)
 * menjadi beberapa potongan pesan tanpa merusak baris atau blok kode.
 */
export function splitDiscordMessage(text: string, maxLength: number = 2000): string[] {
  if (!text || text.trim().length === 0) {
    return ['*(Tidak ada konten balasan)*'];
  }

  if (text.length <= maxLength) {
    return [text];
  }

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    // Cari titik pemotongan terbaik dalam batas maxLength
    let splitIndex = -1;

    // 1. Coba potong di double newline (paragraf)
    const paragraphIndex = remaining.lastIndexOf('\n\n', maxLength);
    if (paragraphIndex > maxLength * 0.4) {
      splitIndex = paragraphIndex + 2;
    } else {
      // 2. Coba potong di single newline
      const newlineIndex = remaining.lastIndexOf('\n', maxLength);
      if (newlineIndex > maxLength * 0.4) {
        splitIndex = newlineIndex + 1;
      } else {
        // 3. Coba potong di spasi
        const spaceIndex = remaining.lastIndexOf(' ', maxLength);
        if (spaceIndex > maxLength * 0.4) {
          splitIndex = spaceIndex + 1;
        } else {
          // 4. Hard cut jika tidak ada pemisah yang baik
          splitIndex = maxLength;
        }
      }
    }

    const chunk = remaining.slice(0, splitIndex).trimEnd();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    remaining = remaining.slice(splitIndex).trimStart();
  }

  return chunks;
}
