/** Local reconstruction of the mechanics observed at catalog.radio.
 * Original renderer; no Catalog application, logo, or audio is bundled here.
 * A full-screen fragment shader receives three live FFT bands and three colors.
 */
export type RadioColor = [number, number, number];
export type RadioVisualState = {
  bands: [number, number, number];
  colors: [RadioColor, RadioColor, RadioColor];
  purchase: boolean;
};

const vertex = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

// Independent gradient noise, orbital motion, and grain implementation. The
// band ranges and 15-second RGB response follow the inspected reference.
const fragment = `
precision highp float;
uniform vec2 resolution;
uniform float time;
uniform vec3 bands;
uniform vec3 palette0;
uniform vec3 palette1;
uniform vec3 palette2;
uniform float purchase;

vec3 gradient(vec3 cell) {
  vec3 h = vec3(dot(cell, vec3(127.1,311.7,74.7)),
                dot(cell, vec3(269.5,183.3,246.1)),
                dot(cell, vec3(113.5,271.9,124.6)));
  return normalize(fract(sin(h) * 43758.5453) * 2.0 - 1.0);
}

float noise3(vec3 point) {
  vec3 cell = floor(point);
  vec3 p = fract(point);
  vec3 blend = p*p*p*(p*(p*6.0-15.0)+10.0);
  float a = dot(gradient(cell), p);
  float b = dot(gradient(cell+vec3(1,0,0)), p-vec3(1,0,0));
  float c = dot(gradient(cell+vec3(0,1,0)), p-vec3(0,1,0));
  float d = dot(gradient(cell+vec3(1,1,0)), p-vec3(1,1,0));
  float e = dot(gradient(cell+vec3(0,0,1)), p-vec3(0,0,1));
  float f = dot(gradient(cell+vec3(1,0,1)), p-vec3(1,0,1));
  float g = dot(gradient(cell+vec3(0,1,1)), p-vec3(0,1,1));
  float h = dot(gradient(cell+vec3(1,1,1)), p-vec3(1,1,1));
  return 1.8 * mix(mix(mix(a,b,blend.x),mix(c,d,blend.x),blend.y),
                   mix(mix(e,f,blend.x),mix(g,h,blend.x),blend.y),blend.z);
}

void main() {
  vec2 p = (gl_FragCoord.xy / resolution) * 2.0 - 1.0;
  p.x *= resolution.x / resolution.y;
  float radius = 0.5 + 0.65 * bands.x;
  float orbit = (0.5 + 0.1 * bands.x) / 5.0;
  float amplitude = 0.9 + 3.0 * bands.y;
  float pulse = 0.8 * sin(time * 5.0) + 0.9;
  vec3 color = vec3(0.149);

  for (int index = 0; index < 3; index++) {
    float phase = float(index) * 2.0;
    float v = sin(time*4.0+phase) + 0.5*sin(1.5*(time*4.0+phase));
    float drift = 0.1*sin(0.5*(time*4.0+phase));
    vec2 floating;
    float strength;
    vec3 tint;
    if (index == 0) {
      floating = orbit*vec2(-cos(drift),sin(v));
      strength = bands.x;
      tint = mix(palette0,vec3(1.7*pulse,0,0),purchase);
    } else if (index == 1) {
      floating = orbit*vec2(cos(drift),-sin(v));
      strength = bands.y*2.0;
      tint = mix(palette1,vec3(0,0.8*pulse,0),purchase);
    } else {
      floating = orbit*vec2(sin(drift),cos(v));
      strength = bands.z*4.0;
      tint = mix(palette2,vec3(0,0,0.5*pulse),purchase);
    }
    float offset = time + float(index);
    vec2 center = vec2(0,0.1) + floating +
      0.15*vec2(sin(1.5*floating.y+offset),cos(1.5*floating.x+offset));
    float distance = length(p-center);
    distance += 0.65*strength*noise3(vec3(p*(1.5*bands.x),time*0.5));
    vec2 ripple = vec2(sin(length(p)*50.0),cos(length(p)*50.0));
    distance += 0.3*bands.x*noise3(vec3(ripple*84.0+time,time));
    if (distance < radius) {
      float falloff = pow(max(0.0,1.0-distance/radius),2.0);
      float brightness = max(0.1,amplitude*strength)*falloff;
      float breathe = clamp(mix(2.0,pow(abs(sin(time+float(index))),5.0),0.9),0.05,0.9);
      color += tint*2.0*brightness*breathe;
    }
  }
  gl_FragColor = vec4(clamp(color,0.0,1.0),1.0);
}
`;

export function createRadioVisualizer(
  canvas: HTMLCanvasElement,
  readState: () => RadioVisualState,
  onFailure: () => void = () => {},
) {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
  if (!gl) throw new Error("WebGL is unavailable in this browser.");
  const shaders: WebGLShader[] = [];
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let uniforms: Record<string, WebGLUniformLocation | null> = {};
  const release = () => {
    shaders.forEach((shader) => gl.deleteShader(shader));
    shaders.length = 0;
    gl.deleteProgram(program);
    gl.deleteBuffer(buffer);
    program = null;
    buffer = null;
  };
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("Could not create the visualizer.");
    shaders.push(shader);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) ?? "Could not compile the visualizer.");
    }
    return shader;
  };
  const initialize = () => { try {
    release();
    program = gl.createProgram();
    if (!program) throw new Error("Could not create the visualizer.");
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) ?? "Could not link the visualizer.");
    }
    gl.useProgram(program);
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    uniforms = Object.fromEntries(
      ["resolution", "time", "bands", "palette0", "palette1", "palette2", "purchase"].map(
        (key) => [key, gl.getUniformLocation(program!, key)],
      ),
    );
  } catch (error) {
    release();
    throw error;
  } };
  initialize();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0;
  let disposed = false;
  let elapsed = 0;
  let previous = performance.now();
  const draw = (now: number) => {
    if (disposed || document.hidden || gl.isContextLost()) return;
    const rect = canvas.getBoundingClientRect();
    // The reference also renders at DPR 1: its fine noise remains pixel-sized.
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
    if (!reducedMotion.matches) elapsed += Math.min((now - previous) / 1000, 0.05);
    previous = now;
    const { bands, colors, purchase } = readState();
    gl.uniform2f(uniforms.resolution, width, height);
    gl.uniform1f(uniforms.time, elapsed);
    gl.uniform3fv(uniforms.bands, bands);
    colors.forEach((color, index) => gl.uniform3fv(uniforms[`palette${index}`], color));
    gl.uniform1f(uniforms.purchase, purchase ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    frame = requestAnimationFrame(draw);
  };
  const resume = () => {
    if (disposed) return;
    cancelAnimationFrame(frame);
    previous = performance.now();
    frame = requestAnimationFrame(draw);
  };
  const contextLost = (event: Event) => {
    event.preventDefault();
    cancelAnimationFrame(frame);
  };
  const contextRestored = () => {
    if (disposed) return;
    try {
      initialize();
      resume();
    } catch {
      onFailure();
    }
  };
  document.addEventListener("visibilitychange", resume);
  canvas.addEventListener("webglcontextlost", contextLost);
  canvas.addEventListener("webglcontextrestored", contextRestored);
  frame = requestAnimationFrame(draw);
  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    document.removeEventListener("visibilitychange", resume);
    canvas.removeEventListener("webglcontextlost", contextLost);
    canvas.removeEventListener("webglcontextrestored", contextRestored);
    release();
  };
}
