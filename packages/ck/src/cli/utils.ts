export function getDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function toSlug(text: string): string {
  const ascii = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 40)
    .replace(/-+$/, '');
  // 日本語等でASCII部分が空になる場合はミリ秒タイムスタンプで補完（衝突回避）
  if (!ascii) {
    return Date.now().toString();
  }
  return ascii;
}
