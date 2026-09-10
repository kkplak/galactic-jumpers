const KEYS = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', ShiftLeft: 'boost', ShiftRight: 'boost', KeyX: 'boost' };
export class Controls {
  constructor(element, onPause) {
    this.element = element; this.onPause = onPause; this.active = false; this.held = new Map(); this.jumpQueued = false; this.releaseQueued = false; this.abort = new AbortController();
    const opts = {signal: this.abort.signal};
    window.addEventListener('keydown', event => {
      if (!this.active) return;
      if (event.code === 'Escape' || event.code === 'KeyP') {event.preventDefault(); if (!event.repeat) this.onPause(); return;}
      const focusedControl = event.target.closest?.('[data-control]');
      if (focusedControl && ['Enter', 'Space'].includes(event.code)) {event.preventDefault();if (!event.repeat) this.press(`key-${event.code}`, focusedControl.dataset.control);this.syncVisual();return;}
      const action = KEYS[event.code]; if (!action) return;
      if (event.target instanceof HTMLElement && event.target.closest('button, input, dialog')) return;
      event.preventDefault(); if (!event.repeat) this.press(`key-${event.code}`, action);
    }, opts);
    window.addEventListener('keyup', event => { if (KEYS[event.code] || event.code === 'Enter') {if (this.active) event.preventDefault();this.release(`key-${event.code}`);this.syncVisual();} }, opts);
    element.addEventListener('pointerdown', event => {
      const button = event.target.closest('[data-control]'); if (!button || !this.active) return;
      event.preventDefault(); button.setPointerCapture(event.pointerId); this.press(`pointer-${event.pointerId}`, button.dataset.control); this.syncVisual();
    }, opts);
    for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) element.addEventListener(eventName, event => {this.release(`pointer-${event.pointerId}`);this.syncVisual();}, opts);
    element.addEventListener('contextmenu', event => event.preventDefault(), opts);
    window.addEventListener('blur', () => this.clear(), opts);
  }
  press(source, action) { if (this.held.has(source)) return; this.held.set(source, action); if (action === 'jump') this.jumpQueued = true; }
  release(source) { const action = this.held.get(source); this.held.delete(source); if (action === 'jump' && !this.down('jump')) this.releaseQueued = true; }
  down(action) { return [...this.held.values()].includes(action); }
  read() { const input = { left: this.down('left'), right: this.down('right'), boost: this.down('boost'), jump: this.jumpQueued, jumpReleased: this.releaseQueued }; this.jumpQueued = false;this.releaseQueued = false;return input; }
  clear() { this.held.clear();this.jumpQueued = false;this.releaseQueued = false;this.syncVisual(); }
  syncVisual() { for (const button of this.element.querySelectorAll('[data-control]')) button.classList.toggle('pressed', this.down(button.dataset.control)); }
  destroy() { this.active = false;this.clear();this.abort.abort(); }
}
