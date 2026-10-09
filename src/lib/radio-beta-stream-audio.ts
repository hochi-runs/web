const FADE_SECONDS = 0.015;
const PREVIEW_ERROR = "This preview could not be played. Try again or open Bandcamp.";

/** Native preview playback through the beta's same-origin streaming route. */
export class RadioBetaStreamAudio {
  readonly analyser: AnalyserNode;
  readonly element: HTMLAudioElement;
  private readonly context: AudioContext;
  private readonly gain: GainNode;
  private readonly source: MediaElementAudioSourceNode;
  private volume = 0.2;
  private started = false;
  private shouldPlay = false;
  private disposed = false;
  private version = 0;
  private reportedPlaying: boolean | undefined;
  private lastError: string | undefined;
  private playTask: Promise<void> | undefined;
  private disposeTask: Promise<void> | undefined;

  constructor(
    private readonly onStateChange?: (playing: boolean) => void,
    private readonly onError?: (message: string) => void,
    private readonly onStatusChange?: (status: string) => void,
    private readonly onProgress?: (position: number, duration: number) => void,
  ) {
    if (typeof window === "undefined" || !window.AudioContext) {
      throw new Error("This browser does not support Web Audio.");
    }
    this.element = new Audio();
    this.element.preload = "metadata";
    this.element.autoplay = false;
    this.element.loop = false;
    this.element.controls = false;
    this.context = new AudioContext({ latencyHint: "interactive" });
    try {
      this.source = this.context.createMediaElementSource(this.element);
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.minDecibels = -100;
      this.analyser.maxDecibels = -30;
      this.analyser.smoothingTimeConstant = 0.82;
      this.gain = this.context.createGain();
      this.gain.gain.value = 0;
      this.source.connect(this.analyser);
      this.analyser.connect(this.gain);
      this.gain.connect(this.context.destination);
      this.element.addEventListener("playing", this.handlePlaying);
      this.element.addEventListener("pause", this.handlePaused);
      this.element.addEventListener("ended", this.handleEnded);
      this.element.addEventListener("waiting", this.handleWaiting);
      this.element.addEventListener("error", this.handleError);
      this.element.addEventListener("timeupdate", this.handleProgress);
      this.element.addEventListener("durationchange", this.handleProgress);
      this.context.addEventListener("statechange", this.handleContextState);
    } catch (error) {
      void this.context.close().catch(() => undefined);
      throw error;
    }
  }

  get playing(): boolean {
    return !this.disposed && this.started && !this.element.paused && !this.element.ended
      && this.context.state === "running";
  }

  get active(): boolean { return this.shouldPlay && !this.disposed; }

  get duration(): number {
    if (!this.element.getAttribute("src")) return 0;
    return Number.isFinite(this.element.duration) ? Math.max(0, this.element.duration) : 0;
  }

  get position(): number {
    if (!this.element.getAttribute("src")) return 0;
    return Number.isFinite(this.element.currentTime) ? Math.max(0, this.element.currentTime) : 0;
  }

  get sampleRate(): number {
    return this.context.sampleRate;
  }

  /** Retain the click's Web Audio activation while preview identity is fetched. */
  unlock(): Promise<void> {
    if (this.disposed) return Promise.reject(new Error("The preview player has been closed."));
    try {
      // Resume synchronously from the gesture; no source or playback is started.
      return this.context.resume();
    } catch {
      return Promise.reject(new Error(PREVIEW_ERROR));
    }
  }

  play(): Promise<void> {
    if (this.disposed) return Promise.reject(new Error("The preview player has been closed."));
    if (!this.element.getAttribute("src")) return Promise.reject(new Error("Choose a preview first."));
    if (this.playing) return Promise.resolve();
    if (this.playTask) return this.playTask;
    // Retry a failed network load instead of retaining the element's error state.
    if (this.element.error) this.element.load();
    if (this.element.ended) this.element.currentTime = 0;
    const version = ++this.version;
    this.shouldPlay = true;
    this.onStatusChange?.("Loading");
    this.lastError = undefined;

    let resume: Promise<void>;
    let playback: Promise<void>;
    try {
      // Both activation calls belong to the click's synchronous stack. Awaiting
      // context.resume() first can consume the gesture needed by element.play().
      resume = this.context.resume();
      playback = this.element.play();
    } catch {
      this.pause();
      this.reportError(PREVIEW_ERROR);
      return Promise.reject(new Error(PREVIEW_ERROR));
    }
    const task = Promise.all([resume, playback]).then(() => {
      if (this.disposed || version !== this.version) return;
      if (this.context.state !== "running") throw new Error(PREVIEW_ERROR);
      this.started = !this.element.paused && !this.element.ended;
      this.rampGain(this.volume);
      this.notifyState();
    }).catch((error: unknown) => {
      if (this.disposed || version !== this.version) return;
      const message = error instanceof Error && error.name === "NotAllowedError"
        ? "Playback was blocked. Click Play to try again."
        : PREVIEW_ERROR;
      this.pause();
      this.reportError(message);
      throw new Error(message);
    }).finally(() => {
      if (this.playTask === task) this.playTask = undefined;
    });
    this.playTask = task;
    return task;
  }

  pause(): void {
    if (this.disposed) return;
    this.version += 1;
    this.playTask = undefined;
    this.shouldPlay = false;
    this.started = false;
    this.element.pause();
    this.onStatusChange?.("Paused");
    this.rampGain(0);
    this.notifyState();
  }

  setSource(url: string): void {
    if (this.disposed) throw new Error("The preview player has been closed.");
    const parsed = new URL(url, window.location.href);
    if (parsed.origin !== window.location.origin
      || !/^\/beta\/radio\/stream\/[a-z0-9-]+\/?$/i.test(parsed.pathname)) {
      throw new Error("Choose a valid preview source.");
    }
    this.pause();
    this.lastError = undefined;
    this.element.src = parsed.href;
    this.element.load();
    this.handleProgress();
    this.notifyState(true);
  }

  /** Release an old selection while retaining the activated audio graph. */
  clearSource(): void {
    if (this.disposed) return;
    this.pause();
    this.lastError = undefined;
    this.element.removeAttribute("src");
    this.element.load();
    this.handleProgress();
    this.notifyState(true);
  }

  setVolume(value: number): void {
    if (this.disposed || !Number.isFinite(value)) return;
    this.volume = Math.max(0, Math.min(1, value));
    if (this.started) this.rampGain(this.volume);
  }

  seek(seconds: number): void {
    if (this.disposed || !Number.isFinite(seconds) || this.duration <= 0) return;
    this.element.currentTime = Math.max(0, Math.min(this.duration, seconds));
  }

  dispose(): Promise<void> {
    if (this.disposeTask) return this.disposeTask;
    this.disposed = true;
    this.version += 1;
    this.playTask = undefined;
    this.shouldPlay = false;
    this.started = false;
    this.element.removeEventListener("playing", this.handlePlaying);
    this.element.removeEventListener("pause", this.handlePaused);
    this.element.removeEventListener("ended", this.handleEnded);
    this.element.removeEventListener("waiting", this.handleWaiting);
    this.element.removeEventListener("error", this.handleError);
    this.element.removeEventListener("timeupdate", this.handleProgress);
    this.element.removeEventListener("durationchange", this.handleProgress);
    this.context.removeEventListener("statechange", this.handleContextState);
    this.element.pause();
    this.element.removeAttribute("src");
    this.element.load();
    this.source.disconnect();
    this.analyser.disconnect();
    this.gain.disconnect();
    this.notifyState();
    this.disposeTask = this.context.state === "closed" ? Promise.resolve() : this.context.close();
    return this.disposeTask;
  }

  private handlePlaying = (): void => {
    if (this.disposed) return;
    if (!this.shouldPlay) {
      this.element.pause();
      return;
    }
    this.started = true;
    this.onStatusChange?.("Playing");
    this.rampGain(this.volume);
    this.notifyState();
  };

  private handlePaused = (): void => {
    this.started = false;
    this.notifyState();
  };

  private handleEnded = (): void => {
    this.shouldPlay = false;
    this.started = false;
    this.onStatusChange?.("Ended");
    this.rampGain(0);
    this.notifyState();
  };

  private handleWaiting = (): void => {
    this.started = false;
    if (this.shouldPlay) this.onStatusChange?.("Buffering");
    this.notifyState();
  };

  private handleError = (): void => {
    if (this.disposed) return;
    this.pause();
    this.reportError(PREVIEW_ERROR);
  };

  private handleContextState = (): void => {
    if (this.context.state === "running") {
      this.notifyState();
    } else {
      this.started = false;
      this.element.pause();
      if (this.shouldPlay) this.onStatusChange?.("Interrupted — press Play to resume");
      this.shouldPlay = false;
      this.notifyState();
    }
  };

  private handleProgress = (): void => { if (!this.disposed) this.onProgress?.(this.position, this.duration); };

  private notifyState(force = false): void {
    const playing = this.playing;
    if (!force && this.reportedPlaying === playing) return;
    this.reportedPlaying = playing;
    this.onStateChange?.(playing);
  }

  private reportError(message: string): void {
    if (this.disposed || this.lastError === message) return;
    this.lastError = message;
    this.onStatusChange?.("Unavailable");
    this.onError?.(message);
  }

  private rampGain(value: number): void {
    if (this.context.state === "closed") return;
    const now = this.context.currentTime;
    const gain = this.gain.gain;
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
