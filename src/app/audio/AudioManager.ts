/**
 * Web Audio playback for SFX and music. Files are optional: anything missing from `public/audio/`
 * is skipped silently (docs/AUDIO.md lists what the game asks for).
 */

const MUSIC_VOLUME = 0.45
const DUCKED_VOLUME = 0.15
const LOOP_VOLUME = 0.35
const FADE = 0.4

export class AudioManager {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private musicGain: GainNode | null = null
  private readonly buffers = new Map<string, Promise<AudioBuffer | null>>()
  private readonly loops = new Map<string, { source: AudioBufferSourceNode | null; gain: GainNode }>()
  private music: { name: string; source: AudioBufferSourceNode | null } | null = null
  private readonly lastPlayed = new Map<string, number>()
  private readonly missing = new Set<string>()
  private enabled = true
  private ducked = false

  constructor(private readonly base: string) {}

  /** Browsers only allow audio after a user gesture; call from the first click/keydown. */
  unlock() {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.master = this.ctx.createGain()
      this.master.connect(this.ctx.destination)
      this.musicGain = this.ctx.createGain()
      this.musicGain.gain.value = MUSIC_VOLUME
      this.musicGain.connect(this.master)
      this.master.gain.value = this.enabled ? 1 : 0
      if (this.music) this.startMusic(this.music.name)
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(enabled ? 1 : 0, this.ctx.currentTime, 0.05)
  }

  /** One-shot. `rate` changes pitch; `minGap` (s) drops repeats that arrive too quickly. */
  play(name: string, { gain = 1, rate = 1, minGap = 0 } = {}) {
    const ctx = this.ctx
    if (!ctx || !this.master || !this.enabled) return
    const now = ctx.currentTime
    if (minGap > 0 && now - (this.lastPlayed.get(name) ?? -Infinity) < minGap) return
    this.lastPlayed.set(name, now)
    void this.load(name).then((buffer) => {
      if (!buffer || !this.master) return
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.playbackRate.value = rate
      const g = ctx.createGain()
      g.gain.value = gain
      source.connect(g).connect(this.master)
      source.start()
    })
  }

  /** Starts or stops a looping ambience (conveyor hum, fan). */
  loop(name: string, on: boolean) {
    const ctx = this.ctx
    const current = this.loops.get(name)
    if (!on) {
      if (current && ctx) {
        current.gain.gain.setTargetAtTime(0, ctx.currentTime, FADE / 3)
        current.source?.stop(ctx.currentTime + FADE)
      }
      this.loops.delete(name)
      return
    }
    if (current || !ctx || !this.master) return
    const gain = ctx.createGain()
    gain.gain.value = 0
    const placeholder: { source: AudioBufferSourceNode | null; gain: GainNode } = { source: null, gain }
    this.loops.set(name, placeholder)
    void this.load(name).then((buffer) => {
      if (!buffer || !this.master || this.loops.get(name) !== placeholder) return
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.loop = true
      source.connect(gain).connect(this.master)
      source.start()
      gain.gain.setTargetAtTime(LOOP_VOLUME, ctx.currentTime, FADE / 3)
      placeholder.source = source
    })
  }

  stopLoops() {
    for (const name of [...this.loops.keys()]) this.loop(name, false)
  }

  /** Crossfades to a music track; null stops music. Remembered until audio is unlocked. */
  setMusic(name: string | null) {
    if (this.music?.name === name) return
    this.fadeOutMusic()
    this.music = name ? { name, source: null } : null
    if (name && this.ctx) this.startMusic(name)
  }

  /** Lowers music while a result panel is open. */
  duck(on: boolean) {
    this.ducked = on
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(on ? DUCKED_VOLUME : MUSIC_VOLUME, this.ctx.currentTime, 0.2)
    }
  }

  private startMusic(name: string) {
    const ctx = this.ctx
    if (!ctx || !this.musicGain) return
    const entry = this.music
    void this.load(name).then((buffer) => {
      if (!buffer || !this.musicGain || this.music !== entry || !entry) return
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.loop = true
      const fade = ctx.createGain()
      fade.gain.value = 0
      fade.gain.setTargetAtTime(1, ctx.currentTime, FADE)
      source.connect(fade).connect(this.musicGain)
      source.start()
      entry.source = source
      this.duck(this.ducked)
    })
  }

  private fadeOutMusic() {
    const source = this.music?.source
    if (source && this.ctx) source.stop(this.ctx.currentTime + 0.05)
  }

  private load(name: string) {
    let pending = this.buffers.get(name)
    if (!pending) {
      const ctx = this.ctx!
      pending = fetch(`${this.base}${name}.mp3`)
        .then((res) => (res.ok ? res.arrayBuffer() : Promise.reject(new Error(String(res.status)))))
        .then((data) => ctx.decodeAudioData(data))
        .catch(() => {
          if (!this.missing.has(name)) {
            this.missing.add(name)
            console.info(`[audio] ${name}.mp3 not found in public/audio — skipping`)
          }
          return null
        })
      this.buffers.set(name, pending)
    }
    return pending
  }
}
