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

/**
 * Controleert of een website bereikbaar is
 * @returns true als de website bereikbaar is, false anders
 */
export async function isWebsiteReachable(url: string): Promise<{ reachable: boolean; error?: string }> {
  try {
    const response = await fetch(url, {
      method: 'HEAD', // Gebruik HEAD om alleen headers op te halen (sneller)
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(10000), // 10 seconden timeout
    });

    // Controleer of de response OK is (status 200-299)
    if (response.ok) {
      return { reachable: true };
    } else {
      return { 
        reachable: false, 
        error: `Website is niet bereikbaar (HTTP ${response.status})` 
      };
    }
  } catch (error) {
    // Vang verschillende soorten errors op
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { 
        reachable: false, 
        error: 'Website bestaat niet of is niet bereikbaar. Controleer of de URL correct is.' 
      };
    }
    
    if (error instanceof Error && error.name === 'AbortError') {
      return { 
        reachable: false, 
        error: 'Website reageert niet binnen 10 seconden. De website is mogelijk niet beschikbaar.' 
      };
    }

    return { 
      reachable: false, 
      error: 'Website is niet bereikbaar. Controleer of de URL correct is en of de website online is.' 
    };
  }
}
