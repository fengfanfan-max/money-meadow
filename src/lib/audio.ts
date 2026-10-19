/**
 * Sound, synthesised rather than loaded.
 *
 * Every sound here is a few oscillators with a gain envelope. That means no audio
 * files, no sprite sheets, no decode step and — more to the point for this brief —
 * no third-party audio host, so the app still makes zero network requests at
 * runtime. It is also tiny: the whole sound design is under 1 kB of source.
 *
 * Three rules this module follows:
 *   1. It never throws. No Web Audio, no user gesture, a suspended context — all
 *      of it degrades to silence, because a broken sound must not break a game.
 *   2. It never plays unless explicitly enabled. Sound is off by default.
 *   3. It stays quiet. Peaks are around -26 dBFS; these are blips, not fanfares.
 */

export type SoundName = 'tap' | 'coin' | 'correct' | 'wrong' | 'win' | 'pop'

type Note = {
  /** Hertz. */
  freq: number
  /** Seconds after the sound starts. */
  delay?: number
  /** Seconds. */
  duration?: number
  type?: OscillatorType
  /** Peak gain, 0-1, before the master trim. */
  gain?: number
}

export const SOUNDS: Record<SoundName, readonly Note[]> = {
  tap: [{ freq: 330, duration: 0.06, type: 'triangle', gain: 0.5 }],
  pop: [
    { freq: 660, duration: 0.05, type: 'sine', gain: 0.45 },
    { freq: 990, delay: 0.04, duration: 0.07, type: 'sine', gain: 0.3 },
  ],
  coin: [
    { freq: 988, duration: 0.07, type: 'triangle', gain: 0.4 },
    { freq: 1319, delay: 0.05, duration: 0.16, type: 'triangle', gain: 0.32 },
  ],
  correct: [
    { freq: 523.25, duration: 0.1, type: 'sine', gain: 0.45 },
    { freq: 659.25, delay: 0.09, duration: 0.1, type: 'sine', gain: 0.45 },
    { freq: 783.99, delay: 0.18, duration: 0.22, type: 'sine', gain: 0.45 },
  ],
  wrong: [
    { freq: 220, duration: 0.12, type: 'sawtooth', gain: 0.22 },
    { freq: 165, delay: 0.1, duration: 0.2, type: 'sawtooth', gain: 0.2 },
  ],
  win: [
    { freq: 523.25, duration: 0.11, type: 'sine', gain: 0.45 },
    { freq: 659.25, delay: 0.1, duration: 0.11, type: 'sine', gain: 0.45 },
    { freq: 783.99, delay: 0.2, duration: 0.11, type: 'sine', gain: 0.45 },
    { freq: 1046.5, delay: 0.3, duration: 0.4, type: 'sine', gain: 0.5 },
  ],
}

/** Master trim applied on top of each note's own gain. */
export const MASTER_GAIN = 0.22

export interface SoundPlayer {
  play(name: SoundName): void
  /** Closes the AudioContext. Safe to call when nothing was ever created. */
  dispose(): void
  /** Whether a real AudioContext is available at all. */
  readonly supported: boolean
}

type AudioContextCtor = new () => AudioContext

function resolveAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    AudioContext?: AudioContextCtor
    webkitAudioContext?: AudioContextCtor
  }
  return w.AudioContext ?? w.webkitAudioContext ?? null
}

/**
 * Creates a player whose output is gated by `isEnabled`.
 *
 * The gate is a callback rather than a captured boolean so that toggling the
 * sound switch takes effect immediately, including inside a note that is already
 * scheduled. The AudioContext itself is created lazily on the first real
 * `play()` that passes the gate — creating one at import time would both trip
 * browser autoplay warnings and allocate an audio thread for children who never
 * turn sound on.
 */
export function createSoundPlayer(isEnabled: () => boolean): SoundPlayer {
  const Ctor = resolveAudioContextCtor()
  let context: AudioContext | null = null
  let master: GainNode | null = null
  let broken = false

  function ensureContext(): AudioContext | null {
    if (broken || !Ctor) return null
    if (context) return context
    try {
      context = new Ctor()
      master = context.createGain()
      master.gain.value = MASTER_GAIN
      master.connect(context.destination)
      return context
    } catch {
      broken = true
      context = null
      master = null
      return null
    }
  }

  function play(name: SoundName): void {
    if (!isEnabled()) return
    const ctx = ensureContext()
    if (!ctx || !master) return

    // iOS suspends the context until a gesture resumes it. Calling resume() on an
    // already-running context is a no-op, so it is safe to do unconditionally.
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {})
    }

    const notes = SOUNDS[name]
    const start = ctx.currentTime

    for (const note of notes) {
      try {
        const at = start + (note.delay ?? 0)
        const duration = note.duration ?? 0.1
        const peak = (note.gain ?? 0.4) * 0.6

        const osc = ctx.createOscillator()
        osc.type = note.type ?? 'sine'
        osc.frequency.setValueAtTime(note.freq, at)

        const envelope = ctx.createGain()
        // A short attack avoids the click a hard start produces; the exponential
        // release sounds natural where a linear ramp sounds like a cut-off.
        envelope.gain.setValueAtTime(0.0001, at)
        envelope.gain.exponentialRampToValueAtTime(peak, at + 0.008)
        envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration)

        osc.connect(envelope)
        envelope.connect(master)
        osc.start(at)
        osc.stop(at + duration + 0.02)
      } catch {
        // A single failed note should not silence the rest of the sound.
      }
    }
  }

  function dispose(): void {
    try {
      void context?.close()
    } catch {
      /* already closed, or never open */
    }
    context = null
    master = null
  }

  return {
    play,
    dispose,
    get supported() {
      return Ctor !== null && !broken
    },
  }
}
