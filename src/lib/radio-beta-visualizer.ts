/** Local reconstruction of the mechanics observed at catalog.radio.
 * Original renderer; no Catalog application, logo, or audio is bundled here.
 * A full-screen fragment shader receives three live FFT bands and three colors.
 */
export type RadioColor = [number, number, number];
export type RadioVisualState = {
  bands: [number, number, number];
  colors: [RadioColor, RadioColor, RadioColor];
  inkColors?: [RadioColor, RadioColor, RadioColor];
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
uniform vec4 viewport;

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

vec3 lightField(vec2 pixel) {
  vec2 p = (pixel / resolution) * 2.0 - 1.0;
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
  return clamp(color,0.0,1.0);
}

void main() {
  // The cropped lettering samples the same screen positions and clock as the background.
  vec2 pixel = viewport.xy + gl_FragCoord.xy * viewport.zw;
  vec3 color = lightField(pixel);
  gl_FragColor = vec4(color,1.0);
}
`;

// Refract a local light texture rather than repainting the letters with pigment.
// Overlay's neutral midpoint lets the real backdrop (including artwork) pass through.
const prismFragment = `
precision highp float;
uniform sampler2D sourceLight;
uniform sampler2D glyphShape;
uniform vec2 sourceSize;
uniform vec2 inkSize;
uniform float margin;
uniform float time;
uniform vec3 bands;
uniform vec3 ink0;
uniform vec3 ink1;
uniform vec3 ink2;

void main() {
  vec2 uv = gl_FragCoord.xy / inkSize;
  vec2 step = vec2(3.0) / inkSize;
  float shape = texture2D(glyphShape,uv).a;
  float left = texture2D(glyphShape,uv-vec2(step.x,0.0)).a;
  float right = texture2D(glyphShape,uv+vec2(step.x,0.0)).a;
  float down = texture2D(glyphShape,uv-vec2(0.0,step.y)).a;
  float up = texture2D(glyphShape,uv+vec2(0.0,step.y)).a;
  float coverage = (shape+left+right+down+up)/5.0;
  float feather = smoothstep(0.58,0.97,coverage);
  vec2 normal = vec2(right-left,up-down);
  float edge = clamp(length(normal),0.0,1.0);

  // Opposing waves bend the same light in two directions, then interfere.
  float waveA = sin((uv.x+uv.y*0.45)*12.0+time*0.45);
  float waveB = sin((uv.x-uv.y*0.65)*16.0-time*0.38);
  float collision = 0.5+0.5*waveA*waveB;
  vec2 bend = (vec2(waveA,waveB)*(6.0+bands.x*10.0)+normal*8.0)*feather;
  vec2 center = (gl_FragCoord.xy+vec2(margin))/sourceSize;
  vec3 original = texture2D(sourceLight,center).rgb;
  vec3 a = texture2D(sourceLight,center+bend/sourceSize).rgb;
  vec3 b = texture2D(sourceLight,center-bend*0.7/sourceSize).rgb;
  vec3 transmitted = mix(a,b,0.35+0.25*collision);
  // Subtle dispersion splits existing colored light, without complementary hues.
  transmitted = mix(transmitted,vec3(a.r,transmitted.g,b.b),0.22);
  vec3 reflection = mix(ink0,mix(ink1,ink2,collision),0.2);
  float facet = sin((uv.x*0.8-uv.y)*18.0+time*0.3);
  vec3 optical = vec3(0.5)+(transmitted-original)*1.25;
  optical += reflection*(0.025*facet+0.055*edge*collision);
  // The contour feathers inward. There is no light or blur outside the glyphs.
  gl_FragColor = vec4(clamp(optical,0.0,1.0),shape*feather*0.62);
}
`;

function createSurface(canvas: HTMLCanvasElement, ink: boolean, onFailure: () => void, invalidate: () => void = () => {}) {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: ink, premultipliedAlpha: false, powerPreference: "low-power" });
  if (!gl) throw new Error("WebGL is unavailable in this browser.");
  const shaders: WebGLShader[] = [];
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let uniforms: Record<string, WebGLUniformLocation | null> = {};
  let prism: WebGLProgram | null = null;
  let prismUniforms: Record<string, WebGLUniformLocation | null> = {};
  let lightTexture: WebGLTexture | null = null;
  let shapeTexture: WebGLTexture | null = null;
  let framebuffer: WebGLFramebuffer | null = null;
  let sourceWidth = 0;
  let sourceHeight = 0;
  let shapeReady = false;
  let disposed = false;
  const padding = 32;
  const shapeImage = ink ? new Image() : undefined;
  const release = () => {
    shaders.forEach((shader) => gl.deleteShader(shader));
    shaders.length = 0;
    gl.deleteProgram(program);
    gl.deleteProgram(prism);
    gl.deleteBuffer(buffer);
    gl.deleteTexture(lightTexture);
    gl.deleteTexture(shapeTexture);
    gl.deleteFramebuffer(framebuffer);
    program = null;
    prism = null;
    buffer = null;
    lightTexture = shapeTexture = null;
    framebuffer = null;
    sourceWidth = sourceHeight = 0;
    shapeReady = false;
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
  const link = (source: string) => {
    const linked = gl.createProgram();
    if (!linked) throw new Error("Could not create the visualizer.");
    try {
      gl.attachShader(linked, compile(gl.VERTEX_SHADER, vertex));
      gl.attachShader(linked, compile(gl.FRAGMENT_SHADER, source));
      gl.linkProgram(linked);
      if (!gl.getProgramParameter(linked, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(linked) ?? "Could not link the visualizer.");
      }
      return linked;
    } catch (error) {
      gl.deleteProgram(linked);
      throw error;
    }
  };
  const locations = (linked: WebGLProgram, names: string[]) => Object.fromEntries(
    names.map((key) => [key, gl.getUniformLocation(linked, key)]),
  );
  const bindProgram = (linked: WebGLProgram) => {
    gl.useProgram(linked);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const position = gl.getAttribLocation(linked, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  };
  const texture = () => {
    const value = gl.createTexture();
    if (!value) throw new Error("Could not create the prism texture.");
    gl.bindTexture(gl.TEXTURE_2D, value);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return value;
  };
  const uploadShape = () => {
    if (disposed || gl.isContextLost() || !shapeTexture || !shapeImage?.naturalWidth) return;
    const surface = document.createElement("canvas");
    surface.width = 900;
    surface.height = 290;
    const context = surface.getContext("2d");
    if (!context) return;
    context.drawImage(shapeImage, 0, 0, surface.width, surface.height);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, shapeTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, surface);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    shapeReady = true;
    canvas.dataset.ready = "true";
  };
  const initialize = () => { try {
    release();
    program = link(fragment);
    buffer = gl.createBuffer();
    if (!buffer) throw new Error("Could not create the visualizer surface.");
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    uniforms = locations(program, ["resolution", "viewport", "time", "bands", "palette0", "palette1", "palette2", "purchase"]);
    if (ink) {
      prism = link(prismFragment);
      prismUniforms = locations(prism, ["sourceLight", "glyphShape", "sourceSize", "inkSize", "margin", "time", "bands", "ink0", "ink1", "ink2"]);
      gl.activeTexture(gl.TEXTURE0);
      lightTexture = texture();
      gl.activeTexture(gl.TEXTURE1);
      shapeTexture = texture();
      framebuffer = gl.createFramebuffer();
      if (!framebuffer) throw new Error("Could not create the prism surface.");
      uploadShape();
    }
    bindProgram(program);
  } catch (error) {
    release();
    throw error;
  } };
  initialize();
  if (shapeImage) {
    shapeImage.onload = () => { uploadShape(); invalidate(); };
    shapeImage.src = "/hochi-radio-wordmark.svg";
  }
  const contextLost = (event: Event) => {
    event.preventDefault();
    if (ink) canvas.dataset.ready = "false";
    onFailure();
  };
  const contextRestored = () => {
    try {
      initialize();
      invalidate();
    } catch {
      onFailure();
    }
  };
  canvas.addEventListener("webglcontextlost", contextLost);
  canvas.addEventListener("webglcontextrestored", contextRestored);
  return {
    draw(scene: DOMRect, elapsed: number, state: RadioVisualState) {
      if (gl.isContextLost() || !program || (ink && !shapeReady)) return;
      const rect = ink ? canvas.getBoundingClientRect() : scene;
      // Keep grain at the reference's DPR 1, including the much smaller ink surface.
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      const margin = ink ? padding : 0;
      const sourceW = width + margin*2;
      const sourceH = height + margin*2;
      if (ink) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, lightTexture);
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        if (sourceWidth !== sourceW || sourceHeight !== sourceH) {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, sourceW, sourceH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, lightTexture, 0);
          sourceWidth = sourceW;
          sourceHeight = sourceH;
          if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            shapeReady = false;
            canvas.dataset.ready = "false";
            onFailure();
            return;
          }
        }
      }
      bindProgram(program);
      gl.viewport(0, 0, sourceW, sourceH);
      gl.uniform2f(uniforms.resolution, Math.max(1, Math.round(scene.width)), Math.max(1, Math.round(scene.height)));
      gl.uniform4f(uniforms.viewport, rect.left-scene.left-margin*rect.width/width, scene.bottom-rect.bottom-margin*rect.height/height, rect.width/width, rect.height/height);
      gl.uniform1f(uniforms.time, elapsed);
      gl.uniform3fv(uniforms.bands, state.bands);
      state.colors.forEach((color, index) => gl.uniform3fv(uniforms[`palette${index}`], color));
      gl.uniform1f(uniforms.purchase, state.purchase ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (ink && prism) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, width, height);
        bindProgram(prism);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, lightTexture);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, shapeTexture);
        gl.uniform1i(prismUniforms.sourceLight, 0);
        gl.uniform1i(prismUniforms.glyphShape, 1);
        gl.uniform2f(prismUniforms.sourceSize, sourceW, sourceH);
        gl.uniform2f(prismUniforms.inkSize, width, height);
        gl.uniform1f(prismUniforms.margin, margin);
        gl.uniform1f(prismUniforms.time, elapsed);
        gl.uniform3fv(prismUniforms.bands, state.bands);
        state.inkColors?.forEach((color, index) => gl.uniform3fv(prismUniforms[`ink${index}`], color));
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    },
    dispose() {
      disposed = true;
      if (shapeImage) shapeImage.onload = null;
      if (ink) delete canvas.dataset.ready;
      canvas.removeEventListener("webglcontextlost", contextLost);
      canvas.removeEventListener("webglcontextrestored", contextRestored);
      release();
    },
  };
}

export function createRadioVisualizer(
  canvas: HTMLCanvasElement,
  readState: () => RadioVisualState,
  onFailure: () => void = () => {},
  inkCanvas?: HTMLCanvasElement | null,
) {
  let frame = 0;
  let failed = false;
  let invalidate = () => {};
  const background = createSurface(canvas, false, () => {
    failed = true;
    cancelAnimationFrame(frame);
    onFailure();
  }, () => invalidate());
  let ink: ReturnType<typeof createSurface> | undefined;
  if (inkCanvas) {
    try {
      ink = createSurface(inkCanvas, true, () => { inkCanvas.dataset.ready = "false"; }, () => invalidate());
    } catch {
      // Keep the SVG overlay if the extra surface cannot be allocated.
      inkCanvas.dataset.ready = "false";
    }
  }
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let disposed = false;
  let elapsed = 0;
  let previous = performance.now();
  const draw = (now: number) => {
    if (disposed || failed || document.hidden) return;
    const rect = canvas.getBoundingClientRect();
    if (!reducedMotion.matches) elapsed += Math.min((now - previous) / 1000, 0.05);
    previous = now;
    const state = readState();
    // Reduced motion is a static treatment, including analyser changes and RGB
    // tests. Redraw only for artwork/layout/preference updates.
    const visual = reducedMotion.matches ? { ...state, bands: [0.35, 0.35, 0.35] as [number, number, number], purchase: false } : state;
    background.draw(rect, reducedMotion.matches ? 0 : elapsed, visual);
    ink?.draw(rect, reducedMotion.matches ? 0 : elapsed, visual);
    if (!reducedMotion.matches) frame = requestAnimationFrame(draw);
  };
  const resume = () => {
    if (disposed || failed) return;
    cancelAnimationFrame(frame);
    previous = performance.now();
    frame = requestAnimationFrame(draw);
  };
  invalidate = resume;
  const resized = new ResizeObserver(resume);
  resized.observe(canvas);
  if (inkCanvas) resized.observe(inkCanvas);
  document.addEventListener("visibilitychange", resume);
  reducedMotion.addEventListener("change", resume);
  frame = requestAnimationFrame(draw);
  return Object.assign(() => {
    disposed = true;
    cancelAnimationFrame(frame);
    document.removeEventListener("visibilitychange", resume);
    reducedMotion.removeEventListener("change", resume);
    resized.disconnect();
    ink?.dispose();
    background.dispose();
  }, { redraw: () => { if (reducedMotion.matches) resume(); } });
}
