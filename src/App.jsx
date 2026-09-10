import { useEffect, useRef } from 'react';
import { mountGame } from './game/runtime.js';
import { registerOffline } from './registerOffline.js';
import { IMAGE_COUNT } from './game/assets.js';

/** React owns the screen and runtime lifetime; Canvas owns the fixed-step game. */
export default function App() {
  const root = useRef(null);
  useEffect(() => {
    const dispose = mountGame(root.current);
    void registerOffline();
    return dispose;
  }, []);

  return (
    <div id="app" ref={root}>
      <div className="world-backdrop" aria-hidden="true" />
      <canvas id="game" aria-label="Galactic Jumpers play area. Keyboard: A and D to move, Space to jump twice, Shift to boost, Escape to pause." hidden />
      <section id="home" className="home" aria-label="Main menu" />
      <section id="hud" className="hud" aria-label="Game status" hidden />
      <div id="controls" className="controls" aria-label="Touch controls" hidden />
      <div id="game-tip" className="game-tip" role="status" hidden />
      <div id="announcement" className="sr-only" aria-live="polite" />
      <div id="toast" className="toast" role="status" hidden />
      <dialog id="modal" aria-labelledby="dialog-title" />
      <div id="loading" className="loading" role="status">
        <div className="loading-emblem">G<span>J</span></div>
        <p id="loading-text">Getting your adventure ready…</p>
        <progress id="loading-progress" max={IMAGE_COUNT} value="0" aria-label="Loading game artwork" />
        <button id="retry-load" className="primary" hidden>Try again</button>
      </div>
    </div>
  );
}
