let pending;

export function registerOffline() {
  // Development uses fresh source and HMR. Offline caching belongs to builds.
  if (!import.meta.env.PROD || !globalThis.isSecureContext || !('serviceWorker' in navigator)) return Promise.resolve(null);
  pending ??= navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
    scope: import.meta.env.BASE_URL,
    updateViaCache: 'none',
  }).catch(error => {
    console.warn('Offline setup did not finish. The game can still be played online.', error);
    pending = null;
    return null;
  });
  return pending;
}
