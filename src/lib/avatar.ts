// Single source of truth for avatar URLs
// Always uses lowercase wallet as seed for consistency
export function getAvatarUrl(wallet: string): string {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${wallet.toLowerCase()}&backgroundColor=b6e3f4`;
}
