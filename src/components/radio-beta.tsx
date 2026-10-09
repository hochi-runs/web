"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useImperativeHandle, useRef, useState, type MouseEvent, type RefObject } from "react";
import type { Release } from "@/data/releases";
import { RadioBetaAudio } from "@/lib/radio-beta-audio";
import { RadioBetaTabAudio } from "@/lib/radio-beta-tab-audio";
import { RadioBetaStreamAudio } from "@/lib/radio-beta-stream-audio";
import { createRadioVisualizer, type RadioColor } from "@/lib/radio-beta-visualizer";
import { RadioSiteInfo, SiteChrome } from "@/components/site-chrome";
import styles from "./radio-beta.module.css";

const GRAY: [RadioColor, RadioColor, RadioColor] = [
  [0.102, 0.102, 0.102], [0.102, 0.102, 0.102], [0.102, 0.102, 0.102],
];
const SILVER: [RadioColor, RadioColor, RadioColor] = [
  [0.64, 0.64, 0.64], [0.64, 0.64, 0.64], [0.64, 0.64, 0.64],
];

type AudioSource = "local" | "bandcamp";
type DisplayMode = "artwork" | "wordmark" | "both";
const DISPLAY_MODES = [
  { value: "artwork", label: "Artwork" },
  { value: "wordmark", label: "Wordmark" },
  { value: "both", label: "Both" },
] as const;
export type RadioRelease = {
  id: number;
  type: "album" | "track";
  slug: string;
  title: string;
  artist: string;
  cover?: string;
  buyUrl?: string;
  details?: Release;
};
export type RadioController = { playRelease: (slug: string) => void };
type PreviewIdentity = { trackId?: number; title?: string; artist?: string; streamUrl: string };
type RadioProps = {
  releases: RadioRelease[];
  customBandcampPreview?: boolean;
  wordmarkFinish?: "overlay" | "iridescent" | "inverted";
  initialReleaseSlug?: string;
  controllerRef?: RefObject<RadioController | null>;
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

function Wordmark({ inkCanvasRef }: { inkCanvasRef?: RefObject<HTMLCanvasElement | null> }) {
  return (
    <span className={styles.hochiMark}>
      {/* The image preserves the SVG's intrinsic geometry and is the mask fallback. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/hochi-radio-wordmark.svg" alt="Hochi Runs" draggable={false} />
      {inkCanvasRef && <canvas ref={inkCanvasRef} className={styles.wordmarkInk} aria-hidden="true" />}
    </span>
  );
}

function playbackTime(seconds: number) {
  const time = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(time / 60)}:${String(time % 60).padStart(2, "0")}`;
}

export function RadioBeta(props: RadioProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const expanded = pathname.startsWith("/beta/radio");
  const selectionFocusRef = useRef(false);
  const requestedSlug = searchParams.has("release")
    ? searchParams.getAll("release").length === 1 ? searchParams.get("release") ?? "" : ""
    : undefined;
  const routeStamp = expanded ? `${pathname}?${searchParams.toString()}` : "compact";
  const finish = searchParams.get("wordmark");
  const [session, setSession] = useState(() => ({
    active: expanded, slug: expanded ? requestedSlug ?? props.initialReleaseSlug ?? props.releases[0]?.slug : undefined,
    routeStamp, finish: finish === "iridescent" || finish === "inverted" ? finish : props.wordmarkFinish ?? "overlay",
  }));
  // Only an explicit radio selection changes audio. Disappearing URL queries
  // during ordinary browsing retain the session instead of selecting a default.
  if (session.routeStamp !== routeStamp) {
    setSession({ ...session, routeStamp, active: session.active || expanded,
      slug: expanded && searchParams.has("release") ? requestedSlug
        : expanded && !session.active ? props.initialReleaseSlug ?? props.releases[0]?.slug : session.slug,
      finish: expanded && searchParams.has("wordmark")
        ? finish === "iridescent" || finish === "inverted" ? finish : "overlay" : session.finish });
  }
  const releaseSlug = session.slug;
  const selectRelease = (slug: string) => {
    if (!props.releases.some((release) => release.slug === slug)) return;
    if (slug === releaseSlug && session.active) return;
    selectionFocusRef.current = true;
    setSession((previous) => ({ ...previous, active: true, slug }));
    if (expanded) {
      const query = new URLSearchParams(searchParams.toString());
      query.set("release", slug);
      window.history.pushState(null, "", `?${query.toString()}`);
    }
  };
  useEffect(() => {
    document.body.dataset.radioActive = String(session.active);
    return () => { delete document.body.dataset.radioActive; };
  }, [session.active]);
  useEffect(() => {
    if (!selectionFocusRef.current) return;
    selectionFocusRef.current = false;
    document.getElementById("radio-release-trigger")?.focus();
  }, [releaseSlug]);
  return <RadioBetaPlayer {...props} wordmarkFinish={session.finish as RadioProps["wordmarkFinish"]}
    releaseSlug={releaseSlug} active={session.active} expanded={expanded} onSelectRelease={selectRelease} />;
}

function RadioBetaPlayer({ releases, customBandcampPreview = false, wordmarkFinish = "overlay", releaseSlug,
  onSelectRelease, active, expanded, controllerRef }: RadioProps & {
  releaseSlug?: string; onSelectRelease: (slug: string) => void; active: boolean; expanded: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const soundbarRef = useRef<HTMLDivElement>(null);
  const inkCanvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<RadioBetaAudio | null>(null);
  const tabAudioRef = useRef<RadioBetaTabAudio | null>(null);
  const streamRef = useRef<RadioBetaStreamAudio | null>(null);
  const visualizerRef = useRef<ReturnType<typeof createRadioVisualizer> | null>(null);
  const officialCloseRef = useRef<HTMLButtonElement>(null);
  const officialReturnFocusRef = useRef<HTMLButtonElement | null>(null);
  const releaseBrowserRef = useRef<HTMLDivElement>(null);
  const releaseTriggerRef = useRef<HTMLButtonElement>(null);
  const releaseSearchRef = useRef<HTMLInputElement>(null);
  const autoplaySlugRef = useRef<string | undefined>(undefined);
  const playbackOperationRef = useRef(0);
  const streamReleaseRef = useRef<string | undefined>(undefined);
  const sourceRef = useRef<AudioSource>("bandcamp");
  const busyRef = useRef(false);
  const aliveRef = useRef(true);
  const colorsRef = useRef(GRAY);
  const inkColorsRef = useRef(SILVER);
  const volumeRef = useRef(0.2);
  const previousVolumeRef = useRef(0.2);
  const paletteVersionRef = useRef(0);
  const bandsRef = useRef<[number, number, number]>([0, 0, 0]);
  const [playingState, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [releaseBrowserOpen, setReleaseBrowserOpen] = useState(false);
  const [releaseQuery, setReleaseQuery] = useState("");
  const [volume, setVolume] = useState(0.2);
  const [error, setError] = useState("");
  const [webglUnavailable, setWebglUnavailable] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>(wordmarkFinish === "overlay" ? "artwork" : "wordmark");
  const [displayFinish, setDisplayFinish] = useState(wordmarkFinish);
  if (displayFinish !== wordmarkFinish) {
    setDisplayFinish(wordmarkFinish);
    setDisplayMode(wordmarkFinish === "overlay" ? "artwork" : "wordmark");
  }
  const [audioSource, setAudioSource] = useState<AudioSource>("bandcamp");
  const [captureActive, setCaptureActive] = useState(false);
  const [captureSupport, setCaptureSupport] = useState<string>();
  const [iframeFallback, setIframeFallback] = useState(false);
  const [previewState, setPreview] = useState<PreviewIdentity & { releaseSlug: string }>();
  const [previewLoadedSlug, setPreviewLoadedSlug] = useState<string>();
  const [previewRetry, setPreviewRetry] = useState(0);
  const [playbackStatus, setPlaybackStatus] = useState("Paused");
  const [audioLevels, setAudioLevels] = useState<[number, number, number]>([0, 0, 0]);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [streamReleaseSlug, setStreamReleaseSlug] = useState<string>();
  const [unavailableCover, setUnavailableCover] = useState<string>();
  const selectedRelease = releases.find((release) => release.slug === releaseSlug);
  const preview = previewState?.releaseSlug === releaseSlug ? previewState : undefined;
  const playing = audioSource === "local" ? playingState : playingState && streamReleaseSlug === releaseSlug;
  const currentPosition = streamReleaseSlug === releaseSlug ? position : 0;
  const currentDuration = streamReleaseSlug === releaseSlug ? duration : 0;
  const nativePreview = customBandcampPreview && !iframeFallback;
  const previewLoading = Boolean(active && nativePreview && selectedRelease && previewLoadedSlug !== releaseSlug);
  const nativeControlsUnavailable = audioSource === "bandcamp" && (!nativePreview || !selectedRelease || !preview || previewLoading);
  const artworkAvailable = audioSource === "bandcamp" && selectedRelease?.cover
    && unavailableCover !== selectedRelease.cover;
  const showReleaseArtwork = Boolean(artworkAvailable && displayMode !== "wordmark");
  const pendingPlayback = busy || playbackStatus === "Buffering";
  const trackLabel = iframeFallback ? `${selectedRelease?.title ?? "No selection"} · preview paused` : preview?.title
    ? `${preview.title}${preview.artist ? ` — ${preview.artist}` : ""}`
    : `${selectedRelease?.title ?? "No selection"} · release preview`;
  const displayedTrackLabel = audioSource === "bandcamp" ? trackLabel : "Generated test signal";
  const previewStatus = !selectedRelease ? "Requested release is unavailable. Choose another release."
    : iframeFallback ? "Bandcamp player is open; the custom bar is paused."
    : !customBandcampPreview ? "Playback is unavailable here. Open this release on Bandcamp."
    : previewLoading ? "Loading preview…" : preview ? playbackStatus : "Preview unavailable.";
  const matchingReleases = releases.filter((release) =>
    `${release.artist} ${release.title}`.toLocaleLowerCase().includes(releaseQuery.trim().toLocaleLowerCase()));
  useEffect(() => {
    const bar = soundbarRef.current;
    if (!active || expanded || !bar) return;
    const root = document.documentElement;
    const measure = () => root.style.setProperty("--site-player-clearance", `${Math.ceil(bar.getBoundingClientRect().height)}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--site-player-clearance");
    };
  }, [active, expanded]);
  const closeReleaseBrowser = useCallback(() => {
    setReleaseBrowserOpen(false);
    releaseTriggerRef.current?.focus();
  }, []);
  useEffect(() => {
    if (!releaseBrowserOpen) return;
    releaseSearchRef.current?.focus();
    const dismissOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!releaseBrowserRef.current?.contains(target) && !releaseTriggerRef.current?.contains(target)) {
        setReleaseBrowserOpen(false);
      }
    };
    const dismissKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeReleaseBrowser();
      }
    };
    const dismissFocus = (event: FocusEvent) => {
      const target = event.target as Node;
      if (!releaseBrowserRef.current?.contains(target) && !releaseTriggerRef.current?.contains(target)) {
        setReleaseBrowserOpen(false);
      }
    };
    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("keydown", dismissKey);
    document.addEventListener("focusin", dismissFocus);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("keydown", dismissKey);
      document.removeEventListener("focusin", dismissFocus);
    };
  }, [releaseBrowserOpen, closeReleaseBrowser]);
  const createStream = useCallback(() => {
    if (!streamRef.current) {
      const stream = new RadioBetaStreamAudio((active) => {
        if (aliveRef.current && sourceRef.current === "bandcamp") setPlaying(active);
      }, (message) => {
        if (aliveRef.current && sourceRef.current === "bandcamp") setError(message);
      }, (status) => {
        if (aliveRef.current && sourceRef.current === "bandcamp") setPlaybackStatus(status);
      }, (position, duration) => {
        if (aliveRef.current && sourceRef.current === "bandcamp") { setPosition(position); setDuration(duration); }
      });
      stream.setVolume(volumeRef.current);
      streamRef.current = stream;
    }
    return streamRef.current;
  }, []);
  const openOfficialPlayer = (event: MouseEvent<HTMLButtonElement>) => {
    playbackOperationRef.current += 1;
    autoplaySlugRef.current = undefined;
    officialReturnFocusRef.current = event.currentTarget;
    void streamRef.current?.dispose();
    streamRef.current = null;
    streamReleaseRef.current = undefined;
    setStreamReleaseSlug(undefined);
    setPlaying(false);
    setPosition(0);
    setDuration(0);
    setPlaybackStatus("Paused");
    setBusy(false);
    busyRef.current = false;
    setError("");
    setIframeFallback(true);
  };
  const closeOfficialPlayer = () => {
    playbackOperationRef.current += 1;
    tabAudioRef.current?.stop();
    setCaptureActive(false);
    setPreview(undefined);
    setPreviewLoadedSlug(undefined);
    setIframeFallback(false);
    if (officialReturnFocusRef.current?.isConnected) officialReturnFocusRef.current.focus();
    else releaseTriggerRef.current?.focus();
  };

  useEffect(() => {
    if (!iframeFallback) return;
    const frame = requestAnimationFrame(() => officialCloseRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [iframeFallback]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setCaptureSupport(RadioBetaTabAudio.supportMessage()));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    // Release replacement clears only the media source. Compact/expanded and
    // ordinary page navigation do not enter this lifecycle or recreate audio.
    playbackOperationRef.current += 1;
    streamRef.current?.clearSource();
    streamReleaseRef.current = undefined;
    if (autoplaySlugRef.current !== releaseSlug) autoplaySlugRef.current = undefined;
    tabAudioRef.current?.stop();
    const controller = new AbortController();
    queueMicrotask(() => {
      if (controller.signal.aborted) return;
      setPlaying(false); setBusy(false); busyRef.current = false;
      setPosition(0); setDuration(0); setStreamReleaseSlug(undefined);
      setPreview(undefined); setPreviewLoadedSlug(undefined);
      setPlaybackStatus("Paused"); setError("");
    });
    if (!active || !nativePreview || !selectedRelease) return () => controller.abort();
    void fetch(`/beta/radio/stream/${encodeURIComponent(selectedRelease.slug)}?metadata=1`, {
      signal: controller.signal, credentials: "same-origin", cache: "no-store",
    }).then(async (response) => {
      if (!response.ok) throw new Error("This preview is unavailable. Open Bandcamp or choose another release.");
      const identity = await response.json() as PreviewIdentity;
      if (typeof identity.streamUrl !== "string" || !identity.streamUrl.startsWith(`/beta/radio/stream/${encodeURIComponent(selectedRelease.slug)}?selection=`)) {
        throw new Error("Preview identity could not be verified. Use the official Bandcamp player.");
      }
      if (!controller.signal.aborted && aliveRef.current) {
        setPreview({ ...identity, releaseSlug: selectedRelease.slug });
        setPreviewLoadedSlug(selectedRelease.slug);
        if (autoplaySlugRef.current === selectedRelease.slug) {
          autoplaySlugRef.current = undefined;
          const stream = createStream();
          stream.setSource(identity.streamUrl);
          streamReleaseRef.current = selectedRelease.slug;
          setStreamReleaseSlug(selectedRelease.slug);
          const operation = ++playbackOperationRef.current;
          busyRef.current = true; setBusy(true);
          try { await stream.play(); }
          catch (reason) {
            if (!controller.signal.aborted && aliveRef.current && operation === playbackOperationRef.current) {
              setError(reason instanceof Error ? reason.message : "Could not start audio. Try again.");
            }
          }
          finally {
            if (!controller.signal.aborted && aliveRef.current && operation === playbackOperationRef.current) {
              busyRef.current = false; setBusy(false);
            }
          }
        }
      }
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted && aliveRef.current) {
        autoplaySlugRef.current = undefined;
        setError(reason instanceof Error ? reason.message : "Preview unavailable.");
      }
    }).finally(() => {
      if (!controller.signal.aborted && aliveRef.current) setPreviewLoadedSlug(selectedRelease.slug);
    });
    return () => controller.abort();
  }, [active, nativePreview, selectedRelease, releaseSlug, createStream, previewRetry]);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      playbackOperationRef.current += 1;
      aliveRef.current = false;
      void engineRef.current?.dispose();
      engineRef.current = null;
      void tabAudioRef.current?.dispose();
      tabAudioRef.current = null;
      void streamRef.current?.dispose();
      streamRef.current = null;
      streamReleaseRef.current = undefined;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Mutated FFT data is read directly by the render loop, not copied into
    // React state on every frame. Idle amplitude matches the reference.
    const frequencies = new Float32Array(512);
    try {
      const visualizer = createRadioVisualizer(canvas, () => {
        const engine = engineRef.current;
        const capture = tabAudioRef.current;
        const analyser = sourceRef.current === "bandcamp"
          ? nativePreview
            ? streamRef.current?.playing ? streamRef.current.analyser : undefined
            : capture?.active ? capture.analyser : undefined
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
        return { bands, colors: colorsRef.current, inkColors: inkColorsRef.current, purchase: false };
      }, () => setWebglUnavailable(true),
      CSS.supports("mask-image", "url(/hochi-radio-wordmark.svg)") || CSS.supports("-webkit-mask-image", "url(/hochi-radio-wordmark.svg)")
        ? inkCanvasRef.current : undefined);
      visualizerRef.current = visualizer;
      return () => { visualizerRef.current = null; visualizer(); };
    } catch {
      // Playback still works when a browser cannot allocate a WebGL context.
      const timer = setTimeout(() => setWebglUnavailable(true), 0);
      return () => clearTimeout(timer);
    }
  }, [nativePreview, wordmarkFinish, expanded]);

  useEffect(() => {
    if (!infoOpen || !expanded) return;
    // Diagnostics follow the same conservative motion policy as the shader.
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setInterval> | undefined;
    let disposed = false;
    const update = () => { if (!disposed) setAudioLevels(preference.matches ? [0, 0, 0] : [...bandsRef.current]); };
    const schedule = () => {
      clearInterval(timer);
      if (!preference.matches) timer = setInterval(update, 250);
      else queueMicrotask(update);
    };
    schedule();
    preference.addEventListener("change", schedule);
    return () => { disposed = true; clearInterval(timer); preference.removeEventListener("change", schedule); };
  }, [infoOpen, expanded]);

  useEffect(() => {
    if (!infoOpen || !expanded) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setInfoOpen(false); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [infoOpen, expanded]);

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new RadioBetaAudio();
      engineRef.current.setVolume(volumeRef.current);
    }
    return engineRef.current;
  }, []);

  const getStream = () => {
    if (!selectedRelease || !preview) throw new Error("No verified Bandcamp preview is available.");
    const stream = createStream();
    if (streamReleaseRef.current !== selectedRelease.slug) {
      stream.setSource(preview.streamUrl);
      streamReleaseRef.current = selectedRelease.slug;
      setStreamReleaseSlug(selectedRelease.slug);
    }
    return stream;
  };

  const togglePlaying = async () => {
    if (busyRef.current && streamRef.current?.active) {
      playbackOperationRef.current += 1;
      streamRef.current.pause();
      busyRef.current = false;
      setBusy(false);
      return;
    }
    if (busyRef.current || (sourceRef.current === "bandcamp" && !nativePreview)) return;
    const operation = ++playbackOperationRef.current;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      const engine = sourceRef.current === "bandcamp" ? getStream() : getEngine();
      if (engine instanceof RadioBetaStreamAudio ? engine.active : engine.playing) engine.pause();
      else await engine.play();
      if (aliveRef.current && operation === playbackOperationRef.current) {
        setPlaying(engine.playing);
      }
    } catch (reason) {
      if (aliveRef.current && operation === playbackOperationRef.current) {
        setError(reason instanceof Error ? reason.message : "Could not start audio. Try again.");
      }
    } finally {
      if (aliveRef.current && operation === playbackOperationRef.current) {
        busyRef.current = false;
        setBusy(false);
      }
    }
  };

  useImperativeHandle(controllerRef, () => ({ playRelease: (slug: string) => {
    if (!releases.some((release) => release.slug === slug)) return;
    setReleaseBrowserOpen(false);
    if (customBandcampPreview) {
      // Activate Web Audio in the original button gesture, before metadata work.
      try {
        const stream = createStream();
        const activationOperation = playbackOperationRef.current;
        void stream.unlock().catch(() => {
          if (aliveRef.current && activationOperation === playbackOperationRef.current) {
            setError("Click Play in the bar to start this preview.");
          }
        });
        if (slug === releaseSlug && preview && nativePreview) {
          if (!stream.active) void togglePlaying();
        } else {
          autoplaySlugRef.current = slug;
          if (slug === releaseSlug && nativePreview && !previewLoading) {
            // The same failed selection needs a fresh identity request; an
            // in-flight request already observes the queued playback intent.
            setPreview(undefined);
            setPreviewLoadedSlug(undefined);
            setPreviewRetry((attempt) => attempt + 1);
          }
        }
      } catch {
        setError("This browser could not start playback. Open Bandcamp to listen.");
      }
    }
    if (iframeFallback) {
      playbackOperationRef.current += 1;
      setPreview(undefined);
      setPreviewLoadedSlug(undefined);
      setIframeFallback(false);
    }
    onSelectRelease(slug);
  } }));

  const switchSource = (next: AudioSource) => {
    if (busyRef.current) return;
    playbackOperationRef.current += 1;
    tabAudioRef.current?.stop();
    engineRef.current?.pause();
    streamRef.current?.pause();
    sourceRef.current = next;
    setAudioSource(next);
    setCaptureActive(false);
    setPlaying(false);
    setPosition(0);
    setDuration(0);
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
    streamRef.current?.setVolume(value);
  };

  useEffect(() => {
    const path = selectedRelease?.cover;
    const version = ++paletteVersionRef.current;
    // The visualizer always follows the selected release, regardless of display mode.
    colorsRef.current = GRAY;
    inkColorsRef.current = SILVER;
    visualizerRef.current?.redraw();
    if (!path) return;
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
      // Keep chromatic artwork pigments in the ink; gray/black samples dilute the finish.
      const pigments = popular.filter((color) => Math.max(...color)-Math.min(...color) >= 32 && Math.max(...color) >= 80)
        .map((color) => color.map((channel) => channel/255) as RadioColor);
      inkColorsRef.current = [pigments[0] ?? SILVER[0], pigments[1] ?? pigments[0] ?? SILVER[1], pigments[2] ?? pigments[0] ?? SILVER[2]];
      visualizerRef.current?.redraw();
    };
    image.onerror = () => {
      if (aliveRef.current && version === paletteVersionRef.current) {
        colorsRef.current = GRAY;
      }
    };
    image.crossOrigin = "anonymous";
    // Bandcamp artwork displays cross-origin but doesn't allow direct pixel reads.
    // Next's host-restricted optimizer gives the sampler a same-origin thumbnail.
    image.src = path.startsWith("https://f4.bcbits.com/img/")
      ? `/_next/image?${new URLSearchParams({ url: path, w: "128", q: "75" })}`
      : path;
    return () => {
      paletteVersionRef.current += 1;
      image.onload = null;
      image.onerror = null;
    };
  }, [selectedRelease?.cover]);

  if (!active) return null;
  const visualizerUrl = `/beta/radio?${new URLSearchParams({ release: releaseSlug ?? "", ...(wordmarkFinish !== "overlay" ? { wordmark: wordmarkFinish } : {}) })}`;
  return <section id="site-radio-player" className={styles.radio} aria-label={expanded ? "Radio visualizer" : "Music player"}
    data-expanded={expanded} data-playing={playing}
    data-artwork={showReleaseArtwork} data-display={displayMode}
    data-wordmark-finish={wordmarkFinish}
    data-audio-source={audioSource} data-tab-capture={captureActive} data-webgl-unavailable={webglUnavailable}>
    {expanded && <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />}
    {expanded && <div className={styles.centerMark} aria-hidden="true">
      <div className={styles.wordmarkLayer}><Wordmark inkCanvasRef={wordmarkFinish === "iridescent" ? inkCanvasRef : undefined} /></div>
    </div>}
    {expanded && showReleaseArtwork && selectedRelease && <figure className={styles.nowPlaying} aria-label="Now playing" data-release={selectedRelease.slug}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img key={selectedRelease.slug} className={styles.nowPlayingArtwork} src={selectedRelease.cover}
        alt={`${selectedRelease.artist} — ${selectedRelease.title} cover artwork`} draggable={false}
        onError={() => setUnavailableCover(selectedRelease.cover)} />
      <figcaption>
        <span className={styles.nowPlayingTitle}>{selectedRelease.title}</span>
        <span className={styles.nowPlayingArtist}>{selectedRelease.artist}</span>
      </figcaption>
    </figure>}
    {expanded && <SiteChrome variant="radio" />}

    {expanded && <button className={styles.infoToggle} aria-label={infoOpen ? "Close radio information" : "Open radio information"}
      aria-expanded={infoOpen} aria-controls="radio-beta-info" onClick={() => {
        setReleaseBrowserOpen(false);
        setInfoOpen(!infoOpen);
      }}>INFO</button>}

    {expanded && infoOpen && <aside id="radio-beta-info" className={styles.info} aria-label="Radio settings">
      <p className={styles.infoTitle}>Radio</p>
      <p>These music previews come from Bandcamp and play through the Hochi Runs player.</p>
      <p>Audio keeps playing as you browse this site. Credits opens the full release page.</p>
      {!customBandcampPreview && <p>Playback is unavailable here. Open this release on Bandcamp.</p>}
      {iframeFallback && <p>Optional tab analysis stays local, unrecorded and unsent; it never replays captured sound. Sharing permission is unnecessary for ordinary playback.</p>}
      <div className={styles.optionGroup}>
        <div className={styles.options}>
          <button aria-pressed={audioSource === "bandcamp"} disabled={busy} onClick={() => switchSource("bandcamp")}>Bandcamp</button>
        </div>
        {audioSource === "bandcamp" && <>
          {iframeFallback && <button className={styles.captureButton} onClick={() => void toggleTabCapture()}
            disabled={busy || Boolean(captureSupport)} aria-pressed={captureActive} title={captureSupport}>
            <span className={styles.airDot} data-active={captureActive} aria-hidden="true" />
            {busy ? "Connecting…" : captureActive ? "Disconnect reactive audio" : "Enable reactive audio"}
          </button>}
          {iframeFallback && captureSupport && <p className={styles.fine}>{captureSupport} The official player still works.</p>}
        </>}
      </div>
      <div className={styles.optionGroup}>
        <div className={styles.options} role="group" aria-label="Display">
          {DISPLAY_MODES.map(({ value, label }) => <button key={value} type="button"
            aria-pressed={displayMode === value} onClick={() => setDisplayMode(value)}>{label}</button>)}
        </div>
      </div>
      <div className={styles.optionGroup} aria-label="Audio input levels">
        <span className={styles.optionLabel}>Audio input</span>
        {(["Bass", "Mids", "Treble"] as const).map((label, index) => <label key={label} className={styles.audioLevel}>
          <span>{label}</span>
          <meter min={0} max={1} value={audioLevels[index]} aria-label={`${label} audio level`} />
          <span className={styles.levelValue} aria-hidden="true">{Math.round(audioLevels[index] * 100)}%</span>
        </label>)}
      </div>
      <Link className={styles.archiveLink} href="/">Return to archive ↗</Link>
      <RadioSiteInfo />
    </aside>}

    {expanded && webglUnavailable && !releaseBrowserOpen && <p className={styles.notice}>WebGL is unavailable. Audio controls still work.</p>}
    {error && !releaseBrowserOpen && <p className={styles.error} role="alert">{error}</p>}

    {iframeFallback && selectedRelease && <aside id="official-bandcamp-player" className={styles.officialPanel}
      aria-labelledby="official-player-title">
      <div className={styles.officialHeader}>
        <h2 id="official-player-title">Official Bandcamp player</h2>
        <button ref={officialCloseRef} type="button" onClick={closeOfficialPlayer} aria-label="Close official Bandcamp player">Close ×</button>
      </div>
      <p>Use this player’s controls. The custom bar remains paused and does not control the iframe.</p>
      <iframe key={selectedRelease.slug}
        src={`https://bandcamp.com/EmbeddedPlayer/${selectedRelease.type}=${selectedRelease.id}/size=small/bgcol=262626/linkcol=ffffff/artwork=none/transparent=true/`}
        title={`Bandcamp player: ${selectedRelease.artist} — ${selectedRelease.title}`} className={styles.bandcampFrame} />
    </aside>}

    <div ref={soundbarRef} className={styles.soundbar} role="group" aria-label="Release preview controls" data-browsing={releaseBrowserOpen}
      data-preview-unavailable={nativeControlsUnavailable}>
      <span className={styles.srOnly} role="status">{previewStatus}</span>
      {releaseBrowserOpen && <div ref={releaseBrowserRef} id="radio-release-browser" className={styles.releaseBrowser}
        role="dialog" aria-labelledby="radio-release-browser-title">
        <div className={styles.releaseBrowserHeader}>
          <h2 id="radio-release-browser-title">Releases <span>{releases.length}</span></h2>
          <button type="button" onClick={closeReleaseBrowser} aria-label="Close release browser">Close ×</button>
        </div>
        <label className={styles.srOnly} htmlFor="radio-release-search">Find a release</label>
        <input ref={releaseSearchRef} id="radio-release-search" className={styles.releaseSearch} type="search"
          placeholder="Find a release or artist" value={releaseQuery} onChange={(event) => setReleaseQuery(event.target.value)} />
        <ul className={styles.releaseList}>
          {matchingReleases.map((release) => <li key={release.slug}>
            <button type="button" aria-current={release.slug === selectedRelease?.slug ? "true" : undefined}
              onClick={() => {
                closeReleaseBrowser();
                onSelectRelease(release.slug);
              }}>
              <span className={styles.releaseThumbnail} aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {release.cover && <img src={release.cover} alt="" loading="lazy" decoding="async" />}
              </span>
              <span className={styles.releaseIdentity}>
                <span>{release.title}</span>
                <span>{release.artist}</span>
              </span>
              <span className={styles.releaseSelected} aria-hidden="true">{release.slug === selectedRelease?.slug ? "✓" : ""}</span>
            </button>
          </li>)}
        </ul>
        {matchingReleases.length === 0 && <p className={styles.releaseEmpty} role="status">No releases match “{releaseQuery}”.</p>}
        {(error || nativeControlsUnavailable || webglUnavailable || (selectedRelease && !iframeFallback && !customBandcampPreview)) && <div className={styles.releaseBrowserFoot}>
          {(error || nativeControlsUnavailable) && <p role={error ? "alert" : undefined}>{error || previewStatus}</p>}
          {webglUnavailable && <p>WebGL is unavailable. Audio controls still work.</p>}
          {selectedRelease && !iframeFallback && (!customBandcampPreview || error) && <button type="button"
            aria-controls="official-bandcamp-player" aria-expanded={false} onClick={(event) => {
              setReleaseBrowserOpen(false);
              openOfficialPlayer(event);
            }}>Use official Bandcamp player ↗</button>}
        </div>}
      </div>}
      <button className={styles.transport} onClick={() => void togglePlaying()} disabled={nativeControlsUnavailable}
        aria-label={playing || pendingPlayback ? "Pause radio" : "Play radio"}>
        <span className={styles.airDot} data-active={playing} />
        <span className={styles.airText}>{playing || pendingPlayback ? "PAUSE" : "PLAY"}</span>
        <PlayIcon playing={playing || pendingPlayback} />
      </button>
      <button ref={releaseTriggerRef} id="radio-release-trigger" type="button" className={styles.releaseTrigger}
        aria-label={`Choose a release: ${displayedTrackLabel}${selectedRelease ? `. Current release: ${selectedRelease.artist} — ${selectedRelease.title}` : ""}`}
        aria-haspopup="dialog" aria-expanded={releaseBrowserOpen} aria-controls="radio-release-browser"
        title="Choose a release" onClick={() => {
          if (releaseBrowserOpen) closeReleaseBrowser();
          else {
            setInfoOpen(false);
            setReleaseQuery("");
            setReleaseBrowserOpen(true);
          }
        }}>
        <span className={styles.trackName}>{displayedTrackLabel}</span>
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" data-open={releaseBrowserOpen}>
          <path d="m4 10 4-4 4 4" fill="none" stroke="currentColor" strokeWidth="1.25" />
        </svg>
      </button>
      {selectedRelease && !iframeFallback && (!customBandcampPreview || error) && <button type="button" className={styles.officialInline}
        aria-label="Use official Bandcamp player" aria-controls="official-bandcamp-player" aria-expanded={false}
        onClick={openOfficialPlayer}>BANDCAMP ↗</button>}
      {audioSource === "bandcamp" && <>
        <input className={styles.seek} type="range" aria-label="Playback position" min={0} max={currentDuration || 1}
          step={0.1} value={currentPosition} disabled={nativeControlsUnavailable || !currentDuration}
          onChange={(event) => {
            const next = Number(event.target.value);
            streamRef.current?.seek(next);
            setPosition(next);
          }} />
        <span className={styles.time}>{playbackTime(currentPosition)} / {playbackTime(currentDuration)}</span>
      </>}
      <div className={styles.playerLinks}>
      {selectedRelease && <Link className={styles.creditsTrigger} href={`/releases/${selectedRelease.slug}`}
        aria-label={`View credits for ${selectedRelease.title}`}>CREDITS</Link>}
      <Link className={styles.playerViewLink} href={expanded ? "/" : visualizerUrl}
        aria-label={expanded ? "Browse while listening" : "Open radio visualizer"}>{expanded ? "BROWSE ↙" : "VISUALIZER ↗"}</Link>
      {selectedRelease?.buyUrl && <a className={styles.buy} href={selectedRelease.buyUrl} target="_blank" rel="noopener noreferrer"
        aria-label={`Support ${selectedRelease.title} on Bandcamp`} title="Open Bandcamp to support this release">BUY ↗</a>}
      </div>
      <div className={styles.volume}>
        <button disabled={nativeControlsUnavailable} aria-label={volume === 0 ? "Unmute radio" : "Mute radio"}
          onClick={() => updateVolume(volume === 0 ? previousVolumeRef.current : 0)}><VolumeIcon muted={volume === 0} /></button>
        <div className={styles.volumePopover}>
          <input type="range" aria-label="Radio volume" min="0" max="1" step="0.01" value={volume} disabled={nativeControlsUnavailable}
            onChange={(event) => updateVolume(Number(event.target.value))} />
        </div>
      </div>
    </div>

  </section>;
}
