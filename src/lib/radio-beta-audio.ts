const SAMPLE_RATE = 44_100;
const TEST_DURATION = 16;
const FADE_SECONDS = 0.015;

/** An original test pattern, synthesized in memory without recordings or requests. */
function makeTestSignal(context: AudioContext): AudioBuffer {
  const buffer = context.createBuffer(1, SAMPLE_RATE * TEST_DURATION, SAMPLE_RATE);
  const samples = buffer.getChannelData(0);
  const beat = 60 / 128;
  const tau = Math.PI * 2;

  function add(start: number, duration: number, sample: (time: number, index: number) => number) {
    const first = Math.round(start * SAMPLE_RATE);
    const length = Math.min(Math.round(duration * SAMPLE_RATE), samples.length - first);
    for (let index = 0; index < length; index += 1) {
      samples[first + index] += sample(index / SAMPLE_RATE, index);
    }
  }

  const notes = [55, 55, 65.406, 73.416, 55, 65.406, 82.407, 73.416];
  for (let step = 0; step * beat < TEST_DURATION; step += 1) {
    const start = step * beat;
    add(start, 0.28, (time) => {
      const attack = Math.min(1, time / 0.004);
      const phase = tau * (42 * time + 38 * 0.025 * (1 - Math.exp(-time / 0.025)));
      return Math.sin(phase) * attack * Math.exp(-time / 0.065) * 0.23;
    });

    if (step % 4 !== 3) {
      const frequency = notes[Math.floor(step / 2) % notes.length];
      add(start + beat * 0.25, 0.34, (time) => {
        const attack = Math.min(1, time / 0.007);
        const release = Math.min(1, (0.34 - time) / 0.025);
        const phase = tau * frequency * time;
        const tone = Math.sin(phase) + 0.24 * Math.sin(phase * 2) + 0.07 * Math.sin(phase * 3);
        return tone * attack * release * Math.exp(-time / 0.18) * 0.2;
      });
    }

    let seed = (step + 1) * 2_654_435_761;
    let previousNoise = 0;
    add(start + beat * 0.5, 0.065, (time) => {
      seed = (Math.imul(seed, 1_664_525) + 1_013_904_223) | 0;
      const noise = ((seed >>> 0) / 4_294_967_296) * 2 - 1;
      const highPassed = noise - previousNoise;
      previousNoise = noise;
      return highPassed * Math.min(1, time / 0.002) * Math.exp(-time / 0.014) * 0.025;
    });

    if (step % 4 === 2) {
      add(start, 0.1, (time) => (
        Math.sin(tau * 480 * time) + Math.sin(tau * 713 * time) * 0.35
      ) * Math.min(1, time / 0.002) * Math.exp(-time / 0.026) * 0.07);
    }
  }

  for (let index = 0; index < samples.length; index += 1) {
    const edge = Math.min(1, index / (SAMPLE_RATE * 0.005),
      (samples.length - 1 - index) / (SAMPLE_RATE * 0.06));
    samples[index] = Math.max(-0.72, Math.min(0.72, samples[index])) * edge;
  }
  return buffer;
}

/** Browser-only audio for the isolated radio study. Create it from a user gesture. */
export class RadioBetaAudio {
  readonly analyser: AnalyserNode;
  private readonly context: AudioContext;
  private readonly master: GainNode;
  private buffer: AudioBuffer;
  private source: AudioBufferSourceNode | null = null;
  private readonly sources = new Set<AudioBufferSourceNode>();
  private offset = 0;
  private startedAt = 0;
  private volume = 0.2;
  private disposed = false;
  private transportVersion = 0;
  private fileVersion = 0;
  private playTask: Promise<void> | undefined;
  private disposeTask: Promise<void> | undefined;

  constructor() {
    if (typeof window === "undefined" || !window.AudioContext) {
      throw new Error("This browser does not support Web Audio.");
    }
    this.context = new AudioContext({ sampleRate: SAMPLE_RATE, latencyHint: "interactive" });
    try {
      this.master = this.context.createGain();
      this.master.gain.value = 0;
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.minDecibels = -100;
      this.analyser.maxDecibels = -30;
      this.analyser.smoothingTimeConstant = 0.82;
      this.master.connect(this.analyser);
      this.analyser.connect(this.context.destination);
      this.buffer = makeTestSignal(this.context);
    } catch (error) {
      void this.context.close().catch(() => undefined);
      throw error;
    }
  }

  get playing(): boolean {
    return !this.disposed && this.source !== null && this.context.state === "running";
  }

  get duration(): number {
    return this.buffer.duration;
  }

  get position(): number {
    const elapsed = this.source ? this.context.currentTime - this.startedAt : 0;
    return (this.offset + elapsed) % this.duration;
  }

  play(): Promise<void> {
    if (this.disposed) return Promise.reject(new Error("The radio audio has been closed."));
    if (this.playing) return Promise.resolve();
    if (this.playTask) return this.playTask;
    const version = this.transportVersion;

    // resume() is invoked synchronously from the caller's click, before awaiting.
    const resume = this.context.resume();
    const task = resume.then(() => {
      if (this.disposed || version !== this.transportVersion) return;
      if (this.context.state !== "running") {
        throw new Error("Playback was blocked. Click Play to try again.");
      }
      // An interrupted context can resume its existing source without replacing it.
      if (this.source) return;
      const source = this.context.createBufferSource();
      source.buffer = this.buffer;
      source.loop = true;
      source.connect(this.master);
      source.onended = () => {
        source.disconnect();
        this.sources.delete(source);
      };
      const now = this.context.currentTime;
      this.rampGain(0, now);
      try {
        source.start(now, this.offset);
      } catch (error) {
        source.onended = null;
        source.disconnect();
        throw error;
      }
      this.sources.add(source);
      this.source = source;
      this.startedAt = now;
      this.rampGain(this.volume, now);
    }).finally(() => {
      if (this.playTask === task) this.playTask = undefined;
    });
    this.playTask = task;
    return task;
  }

  pause(): void {
    if (this.disposed) return;
    this.transportVersion += 1;
    this.playTask = undefined;
    const source = this.source;
    if (!source) return;
    this.offset = this.position;
    this.source = null;
    const now = this.context.currentTime;
    this.rampGain(0, now);
    // A short fade prevents a waveform discontinuity while preserving the offset.
    source.stop(now + FADE_SECONDS);
  }

  setVolume(value: number): void {
    if (this.disposed || !Number.isFinite(value)) return;
    this.volume = Math.max(0, Math.min(1, value));
    if (this.source) this.rampGain(this.volume, this.context.currentTime);
  }

  async loadFile(file: File): Promise<void> {
    if (this.disposed) throw new Error("The radio audio has been closed.");
    if (!file.size) throw new Error("Choose an audio file that contains data.");
    const version = ++this.fileVersion;
    // These bytes stay in this browser. There is no upload, URL, or network request.
    const bytes = await file.arrayBuffer();
    if (this.disposed || version !== this.fileVersion) return;
    const decoded = await this.context.decodeAudioData(bytes);
    if (this.disposed || version !== this.fileVersion) return;
    if (!Number.isFinite(decoded.duration) || decoded.duration <= 0) {
      throw new Error("The selected file contains no playable audio.");
    }
    this.pause();
    this.buffer = decoded;
    this.offset = 0;
    // File selection does not autoplay. The next Play gesture starts the new buffer.
  }

  dispose(): Promise<void> {
    if (this.disposeTask) return this.disposeTask;
    this.disposed = true;
    this.transportVersion += 1;
    this.fileVersion += 1;
    this.playTask = undefined;
    this.source = null;
    for (const source of this.sources) {
      source.onended = null;
      source.stop();
      source.disconnect();
    }
    this.sources.clear();
    this.master.disconnect();
    this.analyser.disconnect();
    this.disposeTask = this.context.state === "closed" ? Promise.resolve() : this.context.close();
    return this.disposeTask;
  }

  private rampGain(value: number, now: number): void {
    const gain = this.master.gain;
    if (typeof gain.cancelAndHoldAtTime === "function") {
      gain.cancelAndHoldAtTime(now);
    } else {
      const current = gain.value;
      gain.cancelScheduledValues(now);
      gain.setValueAtTime(current, now);
    }
    gain.linearRampToValueAtTime(value, now + FADE_SECONDS);
  }
}
