/**
 * Provider icon mapping — maps provider type to icon path in public/icons/providers/
 */
export const PROVIDER_ICONS: Record<string, string> = {
  anthropic: '/icons/providers/anthropic.png',
  openai: '/icons/providers/openai.png',
  groq: '/icons/providers/GroqAI.png',
  sumopod: '/icons/providers/sumopod.jpg',
};

export function getProviderIcon(type: string): string | null {
  return PROVIDER_ICONS[type] ?? null;
}
