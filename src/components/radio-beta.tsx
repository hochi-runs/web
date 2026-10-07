"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { RadioBetaAudio } from "@/lib/radio-beta-audio";
import { createRadioVisualizer, type RadioColor } from "@/lib/radio-beta-visualizer";
import styles from "./radio-beta.module.css";

const GRAY: [RadioColor, RadioColor, RadioColor] = [
  [0.102, 0.102, 0.102], [0.102, 0.102, 0.102], [0.102, 0.102, 0.102],
];
const REFERENCE_WORDMARK = "https://catalog.radio/assets/icons/logo/logo-wordmark.svg";

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

function Wordmark({ reference }: { reference: boolean }) {
  return reference ? (
    // Remote reference asset stays in this comparison beta; it is not bundled
    // or used anywhere in the Hochi archive or public navigation.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={REFERENCE_WORDMARK} alt="Catalog Radio reference" className={styles.referenceMark} draggable={false} />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/hochi-radio-wordmark.svg" alt="Hochi Runs" className={styles.hochiMark} draggable={false} />
  );
}

export function RadioBeta() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<RadioBetaAudio | null>(null);
  const busyRef = useRef(false);
  const aliveRef = useRef(true);
  const purchaseUntilRef = useRef(0);
  const colorsRef = useRef(GRAY);
  const volumeRef = useRef(0.2);
  const previousVolumeRef = useRef(0.2);
  const purchaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const paletteVersionRef = useRef(0);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [reference, setReference] = useState(true);
  const [volume, setVolume] = useState(0.2);
  const [sourceName, setSourceName] = useState("Generated test signal");
  const [purchaseActive, setPurchaseActive] = useState(false);
  const [error, setError] = useState("");
  const [webglUnavailable, setWebglUnavailable] = useState(false);
  const [paletteName, setPaletteName] = useState("Monochrome");

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      if (purchaseTimerRef.current) clearTimeout(purchaseTimerRef.current);
      void engineRef.current?.dispose();
      engineRef.current = null;
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
        let bands: [number, number, number] = [0.35, 0.35, 0.35];
        if (engine?.playing) {
          engine.analyser.getFloatFrequencyData(frequencies);
          const average = (from: number, to: number) => {
            let sum = 0;
            for (let i = from; i <= to; i++) sum += (Math.min(-30, Math.max(-100, frequencies[i])) + 100) / 70;
            return sum / (to - from + 1);
          };
          bands = [average(0, 7), average(9, 46), average(48, 279)];
        }
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
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      const engine = getEngine();
      if (engine.playing) engine.pause();
      else await engine.play();
      if (aliveRef.current) {
        setPlaying(engine.playing);
        setStarted(true);
      }
    } catch (reason) {
      if (aliveRef.current) setError(reason instanceof Error ? reason.message : "Could not start audio. Try again.");
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
        setStarted(true);
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
      const pixels = context.getImageData(0, 0, 96, 96).data;
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
      if (aliveRef.current && version === paletteVersionRef.current) setError("The artwork palette could not be loaded.");
    };
    image.src = path;
  };

  return <section className={styles.radio} aria-label="Radio beta" data-playing={playing} data-purchase={purchaseActive}>
    <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
    <div className={styles.centerMark} aria-hidden="true"><Wordmark reference={reference} /></div>

    <header className={styles.header}>
      <Link href="/" aria-label="Return to Hochi Runs archive" className={styles.home}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Hochi Runs" width={31} height={26} />
      </Link>
      <span className={styles.beta}>LOCAL BETA</span>
    </header>

    <button className={styles.infoToggle} aria-label={infoOpen ? "Close radio information" : "Open radio information"}
      aria-expanded={infoOpen} aria-controls="radio-beta-info" onClick={() => setInfoOpen(!infoOpen)}>i</button>

    {infoOpen && <aside id="radio-beta-info" className={styles.info} aria-label="Radio beta settings">
      <p className={styles.infoTitle}>Radio study</p>
      <p>The Catalog Radio layout and audio-reactive effect, reconstructed for this local beta.</p>
      <p>Audio is a generated test signal. Test cosign simulates the 15-second purchase effect; it makes no payment.</p>
      <div className={styles.optionGroup}>
        <span className={styles.optionLabel}>Wordmark</span>
        <div className={styles.options}>
          <button aria-pressed={reference} onClick={() => setReference(true)}>Reference</button>
          <button aria-pressed={!reference} onClick={() => setReference(false)}>Hochi Runs</button>
        </div>
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
      <Link className={styles.archiveLink} href="/">Return to archive ↗</Link>
    </aside>}

    {webglUnavailable && <p className={styles.notice}>WebGL is unavailable. Audio controls still work.</p>}
    {error && <p className={styles.error} role="alert">{error}</p>}

    <footer className={styles.soundbar} aria-label="Radio audio controls">
      <button className={styles.transport} onClick={() => void togglePlaying()} disabled={busy}
        aria-label={playing ? "Pause radio" : "Play radio"}>
        <span className={styles.airDot} data-active={playing} />
        <span className={styles.airText}>{playing ? "TEST SIGNAL" : started ? "PAUSED" : "OFF AIR"}</span>
        {started && <PlayIcon playing={playing} />}
      </button>
      <span className={styles.trackName}>{started ? sourceName : ""}</span>
      <button className={styles.cosign} onClick={testPurchase} aria-pressed={purchaseActive}>
        {purchaseActive ? "COSIGN EFFECT" : "TEST COSIGN"}<span aria-hidden="true"> ↗</span>
      </button>
      <div className={styles.volume}>
        <button aria-label={volume === 0 ? "Unmute radio" : "Mute radio"}
          onClick={() => updateVolume(volume === 0 ? previousVolumeRef.current : 0)}><VolumeIcon muted={volume === 0} /></button>
        <div className={styles.volumePopover}>
          <input type="range" aria-label="Radio volume" min="0" max="1" step="0.01" value={volume}
            onChange={(event) => updateVolume(Number(event.target.value))} />
        </div>
      </div>
    </footer>

    <button className={`${styles.splash} ${started ? styles.splashGone : ""}`} aria-label="Start radio beta"
      tabIndex={started ? -1 : 0} disabled={busy || started} onClick={() => void togglePlaying()} aria-hidden={started}>
      <Wordmark reference={reference} />
      <span className={styles.startPrompt}>{busy ? "Starting…" : "Click anywhere to start listening"}</span>
    </button>
  </section>;
}
