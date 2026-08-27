let fontsReady: Promise<void> | null = null;

/** Wait for Roboto Mono before canvas text export (web fonts load asynchronously). */
export function ensureExportFonts(): Promise<void> {
  if (fontsReady) return fontsReady;

  fontsReady = (async () => {
    if (typeof document === 'undefined' || !document.fonts) return;
    await Promise.all([
      document.fonts.load('400 16px "Roboto Mono"'),
      document.fonts.load('500 16px "Roboto Mono"'),
      document.fonts.load('600 16px "Roboto Mono"'),
    ]);
    await document.fonts.ready;
  })();

  return fontsReady;
}
