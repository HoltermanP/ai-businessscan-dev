/**
 * Normaliseert een URL door automatisch https:// toe te voegen als er geen protocol is
 */
export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  
  // Als de URL al een protocol heeft, retourneer zoals het is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  // Voeg https:// toe als er geen protocol is
  return `https://${trimmed}`;
}

/**
 * Valideert of een string een geldige URL is (of kan worden)
 */
export function isValidUrl(url: string): boolean {
  const normalized = normalizeUrl(url);
  
  try {
    new URL(normalized);
    return true;
  } catch {
    return false;
  }
}
