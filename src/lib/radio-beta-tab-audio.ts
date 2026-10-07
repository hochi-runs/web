type TabCaptureOptions = DisplayMediaStreamOptions & {
  audio: MediaTrackConstraints & { suppressLocalAudioPlayback: boolean };
  preferCurrentTab: boolean;
  selfBrowserSurface: "include";
  systemAudio: "exclude";
  surfaceSwitching: "exclude";
};

const CAPTURE_OPTIONS: TabCaptureOptions = {
  video: { displaySurface: "browser" },
  audio: { suppressLocalAudioPlayback: false },
  preferCurrentTab: true,
  selfBrowserSurface: "include",
  systemAudio: "exclude",
  surfaceSwitching: "exclude",
};

function captureError(error: unknown): Error {
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError") {
    return new Error("Tab sharing was cancelled or denied. Choose this browser tab and enable Share tab audio.");
  }
  if (name === "InvalidStateError") {
    return new Error("Start tab audio analysis from its button while this page is focused.");
  }
  if (name === "NotReadableError" || name === "NotFoundError") {
    return new Error("Your browser or operating system could not share tab audio. Try desktop Chrome or Edge.");
  }
  return error instanceof Error ? error : new Error("Could not connect tab audio. Try desktop Chrome or Edge with Share tab audio enabled.");
}

function stopTracks(stream: MediaStream): void {
  for (const track of stream.getTracks()) track.stop();
}

/** User-approved tab audio analysis. The captured stream is never recorded or sent. */
export class RadioBetaTabAudio {
  readonly analyser: AnalyserNode;
  onEnded?: () => void;
  private readonly context: AudioContext;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private disposed = false;
  private version = 0;
  private connectTask: Promise<void> | undefined;
  private disposeTask: Promise<void> | undefined;

  static supportMessage(): string | undefined {
    if (typeof window === "undefined") return "Tab audio analysis is available in a browser.";
    if (!window.isSecureContext) return "Tab audio analysis needs HTTPS or localhost.";
    if (!window.AudioContext || typeof navigator.mediaDevices?.getDisplayMedia !== "function") {
      return "Tab audio sharing is unavailable in this browser. Use desktop Chrome or Edge.";
    }
    return undefined;
  }

  /** Instantiate and connect from the permission button's user gesture. */
  constructor(onEnded?: () => void) {
    const unsupported = RadioBetaTabAudio.supportMessage();
    if (unsupported) throw new Error(unsupported);
    this.onEnded = onEnded;
    // Keep the device's actual rate, rather than assuming 44.1 kHz for FFT bins.
    this.context = new AudioContext({ latencyHint: "interactive" });
    try {
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.minDecibels = -100;
      this.analyser.maxDecibels = -30;
      this.analyser.smoothingTimeConstant = 0.82;
      this.context.addEventListener("statechange", this.handleContextState);
    } catch (error) {
      void this.context.close().catch(() => undefined);
      throw error;
    }
  }

  get active(): boolean {
    return !this.disposed && this.source !== null && this.context.state === "running"
      && Boolean(this.stream?.getAudioTracks().some((track) => track.readyState === "live"));
  }

  get sampleRate(): number {
    return this.context.sampleRate;
  }

  connect(): Promise<void> {
    if (this.disposed) return Promise.reject(new Error("Tab audio analysis has been closed."));
    if (this.active) return Promise.resolve();
    if (this.connectTask) return this.connectTask;
    const unsupported = RadioBetaTabAudio.supportMessage();
    if (unsupported) return Promise.reject(new Error(unsupported));
    this.releaseStream();
    const version = ++this.version;

    let capture: Promise<MediaStream>;
    try {
      // This call must happen in the click's synchronous stack, before any await.
      // The browser owns the chooser and the user alone grants its permission.
      capture = navigator.mediaDevices.getDisplayMedia(CAPTURE_OPTIONS);
    } catch (error) {
      return Promise.reject(captureError(error));
    }
    // Also request Web Audio activation in that same gesture. Handle rejection
    // immediately, even if the user leaves the sharing chooser open for a while.
    const ready = this.context.resume().then(
      () => ({ ok: true as const }),
      (error: unknown) => ({ ok: false as const, error }),
    );

    const task = capture.then(async (stream) => {
      if (this.disposed || version !== this.version) {
        stopTracks(stream);
        return;
      }
      this.stream = stream;
      const audio = stream.getAudioTracks().find((track) => track.readyState === "live");
      if (!audio) {
        throw new Error("No tab audio was shared. Choose this browser tab and turn on Share tab audio in the chooser.");
      }
      const surface = stream.getVideoTracks()[0]?.getSettings().displaySurface;
      if (surface !== "browser") {
        throw new Error("Choose a browser tab rather than a screen or window, then enable Share tab audio. Use desktop Chrome or Edge.");
      }
      for (const track of stream.getTracks()) track.addEventListener("ended", this.handleEnded);
      const resumed = await ready;
      if (this.disposed || version !== this.version) return;
      if (!resumed.ok) throw resumed.error;
      if (this.context.state !== "running") {
        throw new Error("Audio analysis could not start. Click the tab audio button to try again.");
      }
      if (audio.readyState !== "live") {
        throw new Error("Tab audio sharing ended before analysis could start.");
      }
      this.source = this.context.createMediaStreamSource(new MediaStream([audio]));
      this.source.connect(this.analyser);
      // AnalyserNode works with its output unconnected. Connecting a destination
      // would replay Bandcamp's audio and could create doubled sound or feedback.
    }).catch((error: unknown) => {
      if (version === this.version) this.releaseStream();
      throw captureError(error);
    }).finally(() => {
      if (this.connectTask === task) this.connectTask = undefined;
    });
    this.connectTask = task;
    return task;
  }

  start(): Promise<void> {
    return this.connect();
  }

  /** Stop sharing while retaining the context for another explicit connection. */
  stop(): void {
    this.version += 1;
    this.connectTask = undefined;
    this.releaseStream();
  }

  dispose(): Promise<void> {
    if (this.disposeTask) return this.disposeTask;
    this.disposed = true;
    this.stop();
    this.context.removeEventListener("statechange", this.handleContextState);
    this.analyser.disconnect();
    this.disposeTask = this.context.state === "closed" ? Promise.resolve() : this.context.close();
    return this.disposeTask;
  }

  private handleEnded = (): void => {
    if (!this.stream) return;
    this.stop();
    if (!this.disposed) this.onEnded?.();
  };

  private handleContextState = (): void => {
    if (this.context.state !== "closed") return;
    const hadStream = this.stream !== null;
    this.disposed = true;
    this.stop();
    if (hadStream) this.onEnded?.();
  };

  private releaseStream(): void {
    this.source?.disconnect();
    this.source = null;
    if (!this.stream) return;
    const stream = this.stream;
    this.stream = null;
    for (const track of stream.getTracks()) track.removeEventListener("ended", this.handleEnded);
    stopTracks(stream);
  }
}
