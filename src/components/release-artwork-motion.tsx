"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import styles from "./release-artwork-motion.module.css";

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeMotionPreference(onChange: () => void) {
  const query = window.matchMedia(MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getMotionPreference() {
  return window.matchMedia(MOTION_QUERY).matches;
}

const VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = (a_position + 1.0) * 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// A film-like texture treatment, independent of playback or audio amplitude.
const FRAGMENT_SHADER = `
  precision mediump float;
  varying vec2 v_uv;
  uniform sampler2D u_image;
  uniform float u_time;
  uniform float u_imageAspect;

  float noise(vec2 point) {
    return fract(sin(dot(point, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 uv = v_uv;
    if (u_imageAspect >= 1.0) {
      uv.x = (uv.x - 0.5) / u_imageAspect + 0.5;
    } else {
      uv.y = (uv.y - 0.5) * u_imageAspect + 0.5;
    }

    // Match the site's square cover crop; keep its frame edges in place.
    float edge = smoothstep(0.0, 0.06, v_uv.x)
      * smoothstep(0.0, 0.06, v_uv.y)
      * smoothstep(0.0, 0.06, 1.0 - v_uv.x)
      * smoothstep(0.0, 0.06, 1.0 - v_uv.y);
    vec2 drift = vec2(
      sin(uv.y * 11.0 + u_time * 0.24),
      cos(uv.x * 9.0 + u_time * 0.19)
    ) * 0.003 * edge;
    vec4 image = texture2D(u_image, uv + drift);
    float grain = noise(floor(gl_FragCoord.xy)
      + vec2(floor(u_time * 8.0), floor(u_time * 8.0) * 0.73)) - 0.5;
    float dither = mod(floor(gl_FragCoord.x) + floor(gl_FragCoord.y), 2.0) - 0.5;
    float light = sin(uv.x * 4.0 + uv.y * 3.0 - u_time * 0.16) * 0.003;
    gl_FragColor = vec4(clamp(image.rgb + grain * 0.025
      + dither * 0.003 + light, 0.0, 1.0), image.a);
  }
`;

type ArtworkProps = { src: string; alt: string };

export function ReleaseArtworkMotion({ src, alt }: ArtworkProps) {
  // Render the still image on the server; the browser opts into motion.
  const reducedMotion = useSyncExternalStore(
    subscribeMotionPreference,
    getMotionPreference,
    () => true,
  );

  return (
    <ArtworkSurface
      key={`${src}:${reducedMotion}`}
      src={src}
      alt={alt}
      reducedMotion={reducedMotion}
    />
  );
}

function ArtworkSurface({
  src,
  alt,
  reducedMotion,
}: ArtworkProps & { reducedMotion: boolean }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(false);
  const refreshRef = useRef<(() => void) | null>(null);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    pausedRef.current = paused;
    refreshRef.current?.();
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const frame = frameRef.current;
    if (!canvas || !frame || reducedMotion) return;

    let disposed = false;
    let failed = false;
    let loaded = false;
    let visible = false;
    let request = 0;
    let lastTick: number | null = null;
    let lastDraw = 0;
    let time = 0;
    let imageAspect = 1;
    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    let texture: WebGLTexture | null = null;
    const shaders: WebGLShader[] = [];
    const image = new Image();
    let observer: IntersectionObserver | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let timeLocation: WebGLUniformLocation | null = null;
    let aspectLocation: WebGLUniformLocation | null = null;

    function stop() {
      cancelAnimationFrame(request);
      request = 0;
      lastTick = null;
    }

    function releaseResources() {
      if (!gl) return;
      if (texture) gl.deleteTexture(texture);
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      for (const shader of shaders) gl.deleteShader(shader);
      texture = null;
      buffer = null;
      program = null;
      shaders.length = 0;
    }

    function fallback() {
      if (disposed || failed) return;
      failed = true;
      stop();
      releaseResources();
      setReady(false);
    }

    function draw() {
      if (disposed || failed || !loaded || !gl || !program) return;
      gl.useProgram(program);
      gl.uniform1f(timeLocation, time);
      gl.uniform1f(aspectLocation, imageAspect);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function tick(timestamp: number) {
      if (disposed || failed || !loaded || !visible
        || document.hidden || pausedRef.current) {
        stop();
        return;
      }
      if (lastTick !== null) time += Math.min(timestamp - lastTick, 100) / 1000;
      lastTick = timestamp;
      // This texture needs only 24 draws per second, even on a 120Hz display.
      if (timestamp - lastDraw >= 1000 / 24) {
        draw();
        lastDraw = timestamp;
      }
      request = requestAnimationFrame(tick);
    }

    function refresh() {
      stop();
      if (!disposed && !failed && loaded && visible
        && !document.hidden && !pausedRef.current) {
        request = requestAnimationFrame(tick);
      }
    }

    function resize() {
      if (!gl || disposed || failed) return;
      const width = frame!.getBoundingClientRect().width;
      const size = Math.max(1, Math.min(1024,
        Math.round(width * Math.min(window.devicePixelRatio || 1, 1.5))));
      if (canvas!.width !== size || canvas!.height !== size) {
        canvas!.width = size;
        canvas!.height = size;
        gl.viewport(0, 0, size, size);
        draw();
      }
    }

    function onContextLost(event: Event) {
      event.preventDefault();
      fallback();
    }

    function compile(type: number, source: string) {
      const shader = gl!.createShader(type);
      if (!shader) throw new Error("Artwork shader unavailable");
      shaders.push(shader);
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        throw new Error("Artwork shader compilation failed");
      }
      return shader;
    }

    function cleanup() {
      disposed = true;
      stop();
      image.onload = null;
      image.onerror = null;
      image.removeAttribute("src");
      observer?.disconnect();
      resizeObserver?.disconnect();
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("resize", resize);
      canvas!.removeEventListener("webglcontextlost", onContextLost);
      if (refreshRef.current === refresh) refreshRef.current = null;
      releaseResources();
    }

    try {
      gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "low-power",
      });
      if (!gl) return cleanup;

      const vertex = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
      const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
      program = gl.createProgram();
      if (!program) throw new Error("Artwork program unavailable");
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error("Artwork shader link failed");
      }
      gl.useProgram(program);
      buffer = gl.createBuffer();
      texture = gl.createTexture();
      if (!buffer || !texture) throw new Error("Artwork resources unavailable");
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      timeLocation = gl.getUniformLocation(program, "u_time");
      aspectLocation = gl.getUniformLocation(program, "u_imageAspect");
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.uniform1i(gl.getUniformLocation(program, "u_image"), 0);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      canvas.addEventListener("webglcontextlost", onContextLost);
      document.addEventListener("visibilitychange", refresh);
      window.addEventListener("resize", resize);
      refreshRef.current = refresh;

      if (typeof IntersectionObserver !== "undefined") {
        observer = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          refresh();
        });
        observer.observe(frame);
      } else {
        visible = true;
      }
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(frame);
      }
      resize();

      // The separate, non-CORS img below always remains a usable fallback.
      image.crossOrigin = "anonymous";
      image.onload = () => {
        if (disposed || failed || !gl) return;
        try {
          const limit = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
          if (image.naturalWidth > limit || image.naturalHeight > limit) {
            throw new Error("Artwork texture exceeds device limit");
          }
          imageAspect = image.naturalWidth / image.naturalHeight;
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
            gl.UNSIGNED_BYTE, image);
          if (gl.getError() !== gl.NO_ERROR) throw new Error("Artwork texture failed");
          loaded = true;
          draw();
          setReady(true);
          refresh();
        } catch {
          fallback();
        }
      };
      image.onerror = fallback;
      image.src = src;
    } catch {
      // Initialization can fail on a restricted GPU; the still image is already visible.
      failed = true;
      stop();
      releaseResources();
    }

    return cleanup;
  }, [src, reducedMotion]);

  return (
    <div className={styles.artwork}>
      <div ref={frameRef} className={styles.frame}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className={styles.image} />
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          data-ready={ready}
          aria-hidden="true"
        />
        {ready && !reducedMotion && (
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            aria-label={paused ? "Resume artwork motion" : "Pause artwork motion"}
            title={paused ? "Resume artwork motion" : "Pause artwork motion"}
            className={styles.toggle}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              {paused ? (
                <path d="M2 1 10 6 2 11Z" />
              ) : (
                <><rect x="2" y="1" width="2" height="10" /><rect x="8" y="1" width="2" height="10" /></>
              )}
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
