"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { RadioBetaAudio } from "@/lib/radio-beta-audio";
import { RadioBetaTabAudio } from "@/lib/radio-beta-tab-audio";
import { createRadioVisualizer, type RadioColor } from "@/lib/radio-beta-visualizer";
import { SiteChrome } from "@/components/site-chrome";
import styles from "./radio-beta.module.css";

const GRAY: [RadioColor, RadioColor, RadioColor] = [
  [0.102, 0.102, 0.102], [0.102, 0.102, 0.102], [0.102, 0.102, 0.102],
];

type AudioSource = "local" | "bandcamp";
type BandcampRelease = {
  id: number;
  type: "album" | "track";
  slug: string;
  title: string;
  artist: string;
  cover?: string;
};

function VolumeIcon({ muted }: { muted: boolean }) {
  return <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
    <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
    {muted ? <path d="m17 9 5 6m0-6-5 6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      : <><path d="M16 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>}
  </svg>;
}

function PlayIcon({ playing }: { playing: boolean }) {
  return <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
    {playing ? <path d="M5 4h3v12H5zm7 0h3v12h-3z" fill="currentColor" />
      : <path d="m6 3 11 7-11 7z" fill="currentColor" />}
  </svg>;
}

function Wordmark() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/hochi-radio-wordmark.svg" alt="Hochi Runs" className={styles.hochiMark} draggable={false} />
  );
}

export function RadioBeta({ releases }: { releases: BandcampRelease[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<RadioBetaAudio | null>(null);
  const tabAudioRef = useRef<RadioBetaTabAudio | null>(null);
  const sourceRef = useRef<AudioSource>("bandcamp");
  const busyRef = useRef(false);
  const aliveRef = useRef(true);
  const purchaseUntilRef = useRef(0);
  const colorsRef = useRef(GRAY);
  const volumeRef = useRef(0.2);
  const previousVolumeRef = useRef(0.2);
  const purchaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const paletteVersionRef = useRef(0);
  const bandsRef = useRef<[number, number, number]>([0, 0, 0]);
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [volume, setVolume] = useState(0.2);
  const [sourceName, setSourceName] = useState("Generated test signal");
  const [purchaseActive, setPurchaseActive] = useState(false);
  const [error, setError] = useState("");
  const [webglUnavailable, setWebglUnavailable] = useState(false);
  const [paletteName, setPaletteName] = useState("Monochrome");
  const [audioSource, setAudioSource] = useState<AudioSource>("bandcamp");
  const [captureActive, setCaptureActive] = useState(false);
  const [captureSupport, setCaptureSupport] = useState<string>();
  const [releaseSlug, setReleaseSlug] = useState(releases[0]?.slug);
  const [audioLevels, setAudioLevels] = useState<[number, number, number]>([0, 0, 0]);
  const selectedRelease = releases.find((release) => release.slug === releaseSlug) ?? releases[0];

  useEffect(() => {
    const frame = requestAnimationFrame(() => setCaptureSupport(RadioBetaTabAudio.supportMessage()));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      if (purchaseTimerRef.current) clearTimeout(purchaseTimerRef.current);
      void engineRef.current?.dispose();
      engineRef.current = null;
      void tabAudioRef.current?.dispose();
      tabAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Mutated FFT data is read directly by the render loop, not copied into
    // React state on every frame. Idle amplitude matches the reference.
    const frequencies = new Float32Array(512);
    try {
      return createRadioVisualizer(canvas, () => {
        const engine = engineRef.current;
        const capture = tabAudioRef.current;
        const analyser = sourceRef.current === "bandcamp"
          ? capture?.active ? capture.analyser : undefined
          : engine?.playing ? engine.analyser : undefined;
        let bands: [number, number, number] = [0.35, 0.35, 0.35];
        if (analyser) {
          analyser.getFloatFrequencyData(frequencies);
          const average = (from: number, to: number) => {
            let sum = 0;
            for (let i = from; i <= to; i++) sum += (Math.min(-30, Math.max(-100, frequencies[i])) + 100) / 70;
            return sum / (to - from + 1);
          };
          // Captured tab audio can run at 48 kHz; map frequencies to its actual FFT bins.
          const bin = (hz: number) => Math.min(frequencies.length - 1,
            Math.round(hz * analyser.fftSize / analyser.context.sampleRate));
          const lowEnd = bin(300);
          const midEnd = bin(2_000);
          bands = [average(0, lowEnd), average(lowEnd + 2, midEnd), average(midEnd + 2, bin(12_000))];
        }
        bandsRef.current = analyser ? bands : [0, 0, 0];
        return { bands, colors: colorsRef.current, purchase: performance.now() < purchaseUntilRef.current };
      }, () => setWebglUnavailable(true));
    } catch {
      // Playback still works when a browser cannot allocate a WebGL context.
      const timer = setTimeout(() => setWebglUnavailable(true), 0);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!infoOpen) return;
    // A small diagnostic display shares the shader's samples without re-rendering every frame.
    const timer = setInterval(() => setAudioLevels([...bandsRef.current]), 250);
    return () => clearInterval(timer);
  }, [infoOpen]);

  useEffect(() => {
    if (!infoOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setInfoOpen(false); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [infoOpen]);

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new RadioBetaAudio();
      engineRef.current.setVolume(volumeRef.current);
    }
    return engineRef.current;
  }, []);

  const togglePlaying = async () => {
    if (busyRef.current || sourceRef.current !== "local") return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      const engine = getEngine();
      if (engine.playing) engine.pause();
      else await engine.play();
      if (aliveRef.current) {
        setPlaying(engine.playing);
      }
    } catch (reason) {
      if (aliveRef.current) setError(reason instanceof Error ? reason.message : "Could not start audio. Try again.");
    } finally {
      busyRef.current = false;
      if (aliveRef.current) setBusy(false);
    }
  };

  const switchSource = (next: AudioSource) => {
    if (busyRef.current) return;
    tabAudioRef.current?.stop();
    engineRef.current?.pause();
    sourceRef.current = next;
    setAudioSource(next);
    setCaptureActive(false);
    setPlaying(false);
    setError("");
  };

  const toggleTabCapture = async () => {
    if (busyRef.current) return;
    if (tabAudioRef.current?.active) {
      tabAudioRef.current.stop();
      setCaptureActive(false);
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      if (!tabAudioRef.current) {
        tabAudioRef.current = new RadioBetaTabAudio(() => {
          const ended = tabAudioRef.current;
          tabAudioRef.current = null;
          void ended?.dispose();
          if (aliveRef.current) setCaptureActive(false);
        });
      }
      // The browser picker opens from this click. Only the visitor can grant sharing.
      await tabAudioRef.current.connect();
      if (aliveRef.current) setCaptureActive(tabAudioRef.current.active);
    } catch (reason) {
      if (aliveRef.current) setError(reason instanceof Error ? reason.message : "Could not connect tab audio.");
    } finally {
      busyRef.current = false;
      if (aliveRef.current) setBusy(false);
    }
  };

  const updateVolume = (value: number) => {
    volumeRef.current = value;
    if (value > 0) previousVolumeRef.current = value;
    setVolume(value);
    engineRef.current?.setVolume(value);
  };

  const testPurchase = () => {
    purchaseUntilRef.current = performance.now() + 15_000;
    setPurchaseActive(true);
    if (purchaseTimerRef.current) clearTimeout(purchaseTimerRef.current);
    purchaseTimerRef.current = setTimeout(() => setPurchaseActive(false), 15_000);
  };

  const loadLocalFile = async (file?: File) => {
    if (!file || busyRef.current) return;
    switchSource("local");
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      const engine = getEngine();
      await engine.loadFile(file);
      await engine.play();
      if (aliveRef.current) {
        setSourceName(file.name);
        setPlaying(engine.playing);
      }
    } catch {
      if (aliveRef.current) setError("That audio file could not be decoded. Try an MP3, WAV, or M4A.");
    } finally {
      busyRef.current = false;
      if (aliveRef.current) setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const choosePalette = (path?: string) => {
    const version = ++paletteVersionRef.current;
    if (!path) {
      colorsRef.current = GRAY;
      setPaletteName("Monochrome");
      return;
    }
    const image = new Image();
    image.onload = () => {
      if (!aliveRef.current || version !== paletteVersionRef.current) return;
      const surface = document.createElement("canvas");
      surface.width = surface.height = 96;
      const context = surface.getContext("2d");
      if (!context) return;
      context.drawImage(image, 0, 0, 96, 96);
      let pixels: Uint8ClampedArray;
      try {
        pixels = context.getImageData(0, 0, 96, 96).data;
      } catch {
        colorsRef.current = GRAY;
        setPaletteName("Monochrome");
        setError("This artwork cannot supply a color palette. Audio analysis is still available.");
        return;
      }
      const counts = new Map<string, number>();
      for (let i = 0; i < pixels.length; i += 32) {
        const key = [pixels[i], pixels[i + 1], pixels[i + 2]].map((value) => Math.min(255, Math.round(value / 40) * 40)).join(",");
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      const popular = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([key]) => key.split(",").map(Number) as RadioColor);
      popular.sort((a, b) => (Math.max(...b) - Math.min(...b)) - (Math.max(...a) - Math.min(...a)));
      const linear = (channel: number) => {
        const normalized = channel / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      };
      const colors = popular.map((color) => color.every((v) => v === 0) ? GRAY[0] : color.map(linear) as RadioColor);
      colorsRef.current = [colors[0] ?? GRAY[0], colors[1] ?? colors[0] ?? GRAY[1], colors[2] ?? colors[0] ?? GRAY[2]];
      if (aliveRef.current) setPaletteName("Artwork colors");
    };
    image.onerror = () => {
      if (aliveRef.current && version === paletteVersionRef.current) {
        colorsRef.current = GRAY;
        setPaletteName("Monochrome");
        setError("The artwork palette could not be loaded. Audio analysis is still available.");
      }
    };
    image.crossOrigin = "anonymous";
    image.src = path;
  };

  return <section className={styles.radio} aria-label="Radio beta" data-playing={playing} data-purchase={purchaseActive}
    data-audio-source={audioSource} data-tab-capture={captureActive}>
    <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
    <div className={styles.centerMark} aria-hidden="true">
      <div className={styles.wordmarkLayer}><Wordmark /></div>
    </div>
    <SiteChrome variant="radio" />

    <button className={styles.infoToggle} aria-label={infoOpen ? "Close radio information" : "Open radio information"}
      aria-expanded={infoOpen} aria-controls="radio-beta-info" onClick={() => setInfoOpen(!infoOpen)}>INFO</button>

    {infoOpen && <aside id="radio-beta-info" className={styles.info} aria-label="Radio beta settings">
      <p className={styles.infoTitle}>Radio</p>
      <p>Bandcamp plays without audio-sharing permission. Enable reactive audio to make the visualizer follow the sound.</p>
      <div className={styles.optionGroup}>
        <div className={styles.options}>
          <button aria-pressed={audioSource === "bandcamp"} disabled={busy} onClick={() => switchSource("bandcamp")}>Bandcamp</button>
          <button aria-pressed={audioSource === "local"} disabled={busy} onClick={() => switchSource("local")}>Local audio</button>
        </div>
        {audioSource === "bandcamp" && <>
          <label className={styles.optionLabel} htmlFor="radio-bandcamp-release">Release</label>
          <select id="radio-bandcamp-release" className={styles.releaseSelect} value={selectedRelease?.slug ?? ""}
            onChange={(event) => {
              setReleaseSlug(event.target.value);
              choosePalette(releases.find((release) => release.slug === event.target.value)?.cover);
            }}>
            {releases.map((release) => <option key={release.slug} value={release.slug}>{release.artist} — {release.title}</option>)}
          </select>
          <button className={styles.captureButton} onClick={() => void toggleTabCapture()}
            disabled={busy || Boolean(captureSupport)} aria-pressed={captureActive} title={captureSupport}>
            <span className={styles.airDot} data-active={captureActive} aria-hidden="true" />
            {busy ? "Connecting…" : captureActive ? "Disconnect reactive audio" : "Enable reactive audio"}
          </button>
        </>}
      </div>
      <div className={styles.optionGroup} aria-label="Audio input levels">
        <span className={styles.optionLabel}>Audio input</span>
        {(["Bass", "Mids", "Treble"] as const).map((label, index) => <label key={label} className={styles.audioLevel}>
          <span>{label}</span>
          <meter min={0} max={1} value={audioLevels[index]} aria-label={`${label} audio level`} />
          <span className={styles.levelValue} aria-hidden="true">{Math.round(audioLevels[index] * 100)}%</span>
        </label>)}
      </div>
      <div className={styles.optionGroup}>
        <span className={styles.optionLabel}>Palette · {paletteName}</span>
        <div className={styles.palettes}>
          <button onClick={() => choosePalette()} aria-label="Use monochrome palette" className={styles.graySwatch} />
          {["like-dat-riddim", "sirene-fdp-2", "losing-sleep"].map((slug) => <button key={slug}
            onClick={() => choosePalette(`/covers/${slug}.jpg`)} aria-label={`Use ${slug.replaceAll("-", " ")} artwork colors`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/covers/${slug}.jpg`} alt="" width={36} height={36} />
          </button>)}
        </div>
      </div>
      <div className={styles.optionGroup}>
        <button className={styles.fileButton} onClick={() => fileRef.current?.click()} disabled={busy}>Try your own audio ↗</button>
        <input ref={fileRef} type="file" accept="audio/*" hidden onChange={(event) => void loadLocalFile(event.target.files?.[0])} />
        <span className={styles.fine}>The file stays in this browser. It is never uploaded.</span>
      </div>
      <button className={styles.cosign} onClick={testPurchase} aria-pressed={purchaseActive}>
        {purchaseActive ? "Cosign effect" : "Test cosign"}<span aria-hidden="true"> ↗</span>
      </button>
      <Link className={styles.archiveLink} href="/">Return to archive ↗</Link>
    </aside>}

    {webglUnavailable && <p className={styles.notice}>WebGL is unavailable. Audio controls still work.</p>}
    {error && <p className={styles.error} role="alert">{error}</p>}

    <footer className={styles.soundbar} aria-label="Radio audio controls">
      {audioSource === "bandcamp" ? <>
        <div className={styles.bandcampPlayer}>
          {selectedRelease ? <iframe
            key={selectedRelease.slug}
            src={`https://bandcamp.com/EmbeddedPlayer/${selectedRelease.type}=${selectedRelease.id}/size=small/bgcol=262626/linkcol=ffffff/artwork=none/transparent=true/`}
            title={`Bandcamp player: ${selectedRelease.artist} — ${selectedRelease.title}`} className={styles.bandcampFrame} />
            : <span className={styles.fine}>No Bandcamp releases are available.</span>}
        </div>
      </> : <><button className={styles.transport} onClick={() => void togglePlaying()} disabled={busy}
        aria-label={playing ? "Pause radio" : "Play radio"}>
        <span className={styles.airDot} data-active={playing} />
        <span className={styles.airText}>{playing ? "LOCAL AUDIO" : "PLAY"}</span>
        <PlayIcon playing={playing} />
      </button>
      <span className={styles.trackName}>{sourceName}</span></>}
      {audioSource === "local" && <div className={styles.volume}>
        <button aria-label={volume === 0 ? "Unmute radio" : "Mute radio"}
          onClick={() => updateVolume(volume === 0 ? previousVolumeRef.current : 0)}><VolumeIcon muted={volume === 0} /></button>
        <div className={styles.volumePopover}>
          <input type="range" aria-label="Radio volume" min="0" max="1" step="0.01" value={volume}
            onChange={(event) => updateVolume(Number(event.target.value))} />
        </div>
      </div>}
    </footer>

  </section>;
}
