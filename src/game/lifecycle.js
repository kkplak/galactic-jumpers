/** One React mount owns all listeners and frame callbacks, including focus work. */
export function createLifecycle({
  requestFrame = callback => globalThis.requestAnimationFrame(callback),
  cancelFrame = id => globalThis.cancelAnimationFrame(id),
} = {}) {
  const abort = new AbortController(), frames = new Set();
  let disposed = false;
  return {
    get disposed() { return disposed; },
    listen(target, event, listener) {
      if (!disposed) target.addEventListener(event, listener, { signal: abort.signal });
    },
    request(callback) {
      if (disposed) return null;
      const id = requestFrame(time => {
        frames.delete(id);
        if (!disposed) callback(time);
      });
      frames.add(id);
      return id;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      abort.abort();
      for (const id of frames) cancelFrame(id);
      frames.clear();
    },
  };
}
