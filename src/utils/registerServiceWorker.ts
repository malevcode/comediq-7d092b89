/**
 * Registers the offline service worker (see public/sw.js).
 *
 * Only runs in a production build. In dev the service worker would sit in front
 * of Vite's module graph and serve stale code, which is a miserable way to work.
 */
export function registerServiceWorker() {
  if (!import.meta.env.PROD) return;
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("[sw] registration failed:", error);
    });
  });
}
