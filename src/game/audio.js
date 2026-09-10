import { musicFor, scoreEvents, INSTRUMENTS } from './music.js';

export class Soundscape {
  constructor(settings) { this.settings = settings; this.ctx = null; this.active = false; this.next = 0; this.note = 0; this.boostNode = null; this.destroyed = false;this.voices=new Set();this.score=musicFor('nova',0); }
  setChapter(character,index,elapsed=0) {
    this.stopVoices('music');this.score=musicFor(character,index);
    this.note=Math.floor(elapsed/(30/this.score.bpm));this.next=(this.ctx?.currentTime??0)+.05;
  }
  stopVoices(channel) {
    for(const voice of [...this.voices])if(!channel||voice.channel===channel)voice.stop();
  }
  async unlock() {
    if (this.destroyed) return;
    if (!this.ctx) {
      const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Context) return;
      this.ctx = new Context(); this.master = this.ctx.createGain(); this.master.gain.value = 0.32; this.master.connect(this.ctx.destination);
      this.music = this.ctx.createGain(); this.effects = this.ctx.createGain(); this.music.connect(this.master); this.effects.connect(this.master); this.applySettings();
    }
    try { if (this.ctx.state === 'suspended') await this.ctx.resume(); } catch { /* Sound is optional; gameplay remains available. */ }
  }
  tone(freq, duration, volume = 0.2, type = 'sine', delay = 0, endFreq = freq, channel = 'effects', attack=.015) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const start = this.ctx.currentTime + delay;
    const oscillator = this.ctx.createOscillator(), gain = this.ctx.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(freq, start); oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), start + duration);
    gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(volume, start + Math.min(attack,duration*.4)); gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain); gain.connect(this[channel]); oscillator.start(start); oscillator.stop(start + duration + 0.03);
    const voice={channel,stop:()=>{
      const now=this.ctx?.currentTime??start;
      gain.gain.cancelScheduledValues(now);gain.gain.setTargetAtTime(.0001,now,.012);
      oscillator.stop(now+.05);this.voices.delete(voice);
    }};
    this.voices.add(voice);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect();this.voices.delete(voice); };
  }
  fx(name) {
    if (!this.settings.effects) return;
    if (name === 'jump') this.tone(220, 0.16, 0.14, 'triangle', 0, 550);
    if (name === 'double') { this.tone(350, 0.18, 0.15, 'triangle', 0, 850); this.tone(700, 0.2, 0.08, 'sine', 0.03, 1000); }
    if(name==='tail'){this.tone(130,.32,.18,'triangle',0,720);this.tone(400,.25,.08,'sine',.08,950);}
    if(name==='hook'){this.tone(1100,.09,.08,'triangle',0,500);this.tone(320,.22,.1,'sine',.045,620);}
    if (name === 'crystal') { this.tone(880, 0.18, 0.16); this.tone(1320, 0.24, 0.12, 'sine', 0.055); }
    if (name === 'relic' || name === 'checkpoint') [440, 554.37, 659.25, 880].forEach((n,i) => this.tone(n, 0.6, 0.13, 'sine', i * 0.08));
    if (name === 'shield') [523, 784].forEach((n,i) => this.tone(n, 0.4, 0.12, 'sine', i * 0.08));
    if (name === 'hurt') { this.tone(160, 0.25, 0.15, 'sawtooth', 0, 55); this.tone(70, 0.25, 0.2); }
    if (name === 'win') [330, 440, 554, 659, 880, 1108].forEach((n,i) => this.tone(n, 1, 0.16, 'sine', i * 0.1));
    if (name === 'lose') [330, 277, 220].forEach((n,i) => this.tone(n, 0.6, 0.12, 'triangle', i * 0.18));
    if (name === 'click') this.tone(600, 0.06, 0.09, 'sine', 0, 720);
  }
  setActive(active) {
    this.active = active;
    if (this.ctx) { this.next = this.ctx.currentTime + 0.1; this.applySettings(); }
    if (!active) {this.stopVoices('music');this.boost(false);}
  }
  applySettings() {
    if (!this.ctx) return;
    this.effects.gain.setTargetAtTime(this.settings.effects ? 1 : 0, this.ctx.currentTime, 0.025);
    this.music.gain.setTargetAtTime(this.active && this.settings.music ? 1 : 0, this.ctx.currentTime, 0.05);
    if(!this.active||!this.settings.music)this.stopVoices('music');
    if(!this.settings.effects){this.stopVoices('effects');this.boost(false);}
  }
  update() {
    if (!this.active || !this.settings.music || !this.ctx || this.ctx.state !== 'running') return;
    const now=this.ctx.currentTime;
    // Rebase after suspension or a stalled frame; never play missed notes in a burst.
    if(this.next<now-.15)this.next=now+.04;
    for(let scheduled=0;this.next<now+.14&&scheduled<4;scheduled++){
      for(const event of scoreEvents(this.score,this.note)){
        const instrument=INSTRUMENTS[event.instrument];
        const freq=440*2**((event.midi-69)/12),duration=event.duration*(instrument.decay??1);
        for(const [ratio,gain,type] of instrument.partials)this.tone(freq*ratio,duration,event.volume*gain,type,this.next-now+event.delay,freq*ratio*(instrument.bend??1),'music',instrument.attack??.012);
      }
      this.note=(this.note+1)%(this.score.beats*2*32);this.next+=30/this.score.bpm;
    }
  }
  boost(enabled) {
    enabled = enabled && this.settings.effects && this.active;
    if (!this.ctx || this.ctx.state !== 'running') return;
    if (enabled && !this.boostNode) {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.type = 'triangle'; o.frequency.value = 72; g.gain.value = 0.045; o.connect(g); g.connect(this.effects); o.start(); this.boostNode = {o,g};
    } else if (!enabled && this.boostNode) {
      const {o,g} = this.boostNode; g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.03); o.stop(this.ctx.currentTime + 0.12); o.onended = () => {o.disconnect();g.disconnect();}; this.boostNode = null;
    }
  }
  destroy() {
    this.destroyed = true; this.setActive(false);
    this.stopVoices();
    const context = this.ctx; this.ctx = null;
    if (context && context.state !== 'closed') void context.close().catch(() => {});
    this.boostNode = null;
  }

}
