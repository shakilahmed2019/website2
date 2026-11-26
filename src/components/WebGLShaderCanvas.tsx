import React, { useCallback, useEffect, useRef, useState } from 'react';

export type ShaderTransitionMode = 'wave' | 'halftone' | 'morph';

interface WebGLShaderCanvasProps {
  currentSrc: string;
  nextSrc: string;
  /** Progress between 0 (currentSrc fully visible) and 1 (nextSrc fully visible) */
  progress: number;
  /** Direction: 1 for forward, -1 for backward */
  direction: 1 | -1;
  mode: ShaderTransitionMode;
  pointerPos: { x: number; y: number };
  alt: string;
  onWebGLStatusChange?: (supported: boolean) => void;
}

const VERTEX_SHADER_SRC = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SRC = `
  precision highp float;

  varying vec2 v_uv;

  uniform sampler2D u_tex0;
  uniform sampler2D u_tex1;
  uniform vec2 u_resolution;
  uniform vec2 u_img0Resolution;
  uniform vec2 u_img1Resolution;
  uniform float u_progress;
  uniform float u_direction;
  uniform float u_time;
  uniform int u_mode;
  uniform vec2 u_pointer;

  vec2 getCoverUv(vec2 uv, vec2 res, vec2 imgRes) {
    float canvasAspect = res.x / max(res.y, 1.0);
    float imgAspect = imgRes.x / max(imgRes.y, 1.0);
    vec2 scale = vec2(1.0);
    if (canvasAspect > imgAspect) {
      scale.y = imgAspect / canvasAspect;
    } else {
      scale.x = canvasAspect / imgAspect;
    }
    return (uv - 0.5) * scale + 0.5;
  }

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    float p = clamp(u_progress, 0.0, 1.0);
    vec2 uv0Base = getCoverUv(v_uv, u_resolution, u_img0Resolution);
    vec2 uv1Base = getCoverUv(v_uv, u_resolution, u_img1Resolution);

    if (p <= 0.0005) {
      gl_FragColor = texture2D(u_tex0, uv0Base);
      return;
    }
    if (p >= 0.9995) {
      gl_FragColor = texture2D(u_tex1, uv1Base);
      return;
    }

    float bell = sin(p * 3.14159265);
    vec2 pointerOffset = (u_pointer - 0.5) * 0.04 * bell;

    if (u_mode == 0) {
      // Mode 0: Liquid Wave / Ripple Distortion
      float sweep = mix(-0.25, 1.25, p);
      float xCoord = u_direction > 0.0 ? v_uv.x : (1.0 - v_uv.x);
      float wave = sin(v_uv.y * 14.0 + u_time * 3.2) * 0.045 * bell;
      float ripple = sin(length(v_uv - u_pointer) * 24.0 - p * 10.0) * 0.018 * bell;
      float edgeDist = xCoord - sweep + wave;
      float mixMask = smoothstep(0.18, -0.18, edgeDist);

      vec2 disp0 = vec2(wave * 1.4 + ripple, cos(v_uv.x * 10.0 + p * 6.28) * 0.025 * bell) + pointerOffset;
      vec2 disp1 = vec2(-wave * 1.4 - ripple, -cos(v_uv.x * 10.0 - p * 6.28) * 0.025 * bell) - pointerOffset;

      float chroma = 0.012 * bell;
      vec4 c0 = vec4(
        texture2D(u_tex0, clamp(uv0Base + disp0 + vec2(chroma, 0.0), 0.001, 0.999)).r,
        texture2D(u_tex0, clamp(uv0Base + disp0, 0.001, 0.999)).g,
        texture2D(u_tex0, clamp(uv0Base + disp0 - vec2(chroma, 0.0), 0.001, 0.999)).b,
        1.0
      );
      vec4 c1 = vec4(
        texture2D(u_tex1, clamp(uv1Base + disp1 - vec2(chroma, 0.0), 0.001, 0.999)).r,
        texture2D(u_tex1, clamp(uv1Base + disp1, 0.001, 0.999)).g,
        texture2D(u_tex1, clamp(uv1Base + disp1 + vec2(chroma, 0.0), 0.001, 0.999)).b,
        1.0
      );

      vec4 col = mix(c0, c1, mixMask);
      float crest = exp(-pow(edgeDist * 11.0, 2.0)) * bell * 0.22;
      col.rgb += vec3(0.08, 0.85, 0.55) * crest;
      gl_FragColor = col;
      return;
    }

    if (u_mode == 1) {
      // Mode 1: Halftone / Dot-Matrix Dissolve
      float cells = max(24.0, floor(u_resolution.y / 9.0));
      vec2 aspectGrid = vec2(cells * (u_resolution.x / max(u_resolution.y, 1.0)), cells);
      vec2 gridUv = v_uv * aspectGrid;
      vec2 cellId = floor(gridUv);
      vec2 cellLocal = fract(gridUv) - 0.5;

      float dirCoord = u_direction > 0.0 ? (cellId.x / aspectGrid.x) : (1.0 - cellId.x / aspectGrid.x);
      float stagger = dirCoord * 0.55 + hash21(cellId) * 0.18;
      float localP = clamp((p * 1.55 - stagger) * 1.6, 0.0, 1.0);

      float dist = length(cellLocal);
      float dotRadius = localP * 0.78;
      float dotMask = smoothstep(dotRadius + 0.06, dotRadius - 0.06, dist);

      vec2 zoom0 = (uv0Base - 0.5) * (1.0 - 0.06 * p) + 0.5;
      vec2 zoom1 = (uv1Base - 0.5) * (1.06 - 0.06 * p) + 0.5;
      vec4 c0 = texture2D(u_tex0, clamp(zoom0, 0.001, 0.999));
      vec4 c1 = texture2D(u_tex1, clamp(zoom1, 0.001, 0.999));

      float ringGlow = smoothstep(0.08, 0.0, abs(dist - dotRadius)) * bell * 0.2;
      vec4 col = mix(c0, c1, dotMask);
      col.rgb += vec3(0.15, 0.9, 0.65) * ringGlow;
      gl_FragColor = col;
      return;
    }

    // Mode 2: Fluid Glitch Morphing
    float band = floor(v_uv.y * 22.0);
    float bandJitter = (hash21(vec2(band, floor(p * 18.0))) - 0.5) * 0.14 * bell;
    float fluidWarp = sin(v_uv.y * 9.0 + p * 8.0) * 0.05 * bell;
    float shift = (bandJitter + fluidWarp) * u_direction;

    vec2 mUv0 = uv0Base + vec2(shift - p * 0.12 * u_direction, sin(v_uv.x * 12.0) * 0.02 * bell) + pointerOffset;
    vec2 mUv1 = uv1Base + vec2(shift + (1.0 - p) * 0.12 * u_direction, -sin(v_uv.x * 12.0) * 0.02 * bell) - pointerOffset;

    float split = 0.018 * bell;
    vec4 g0 = vec4(
      texture2D(u_tex0, clamp(mUv0 + vec2(split, 0.0), 0.001, 0.999)).r,
      texture2D(u_tex0, clamp(mUv0, 0.001, 0.999)).g,
      texture2D(u_tex0, clamp(mUv0 - vec2(split, 0.0), 0.001, 0.999)).b,
      1.0
    );
    vec4 g1 = vec4(
      texture2D(u_tex1, clamp(mUv1 - vec2(split, 0.0), 0.001, 0.999)).r,
      texture2D(u_tex1, clamp(mUv1, 0.001, 0.999)).g,
      texture2D(u_tex1, clamp(mUv1 + vec2(split, 0.0), 0.001, 0.999)).b,
      1.0
    );

    float morphMix = smoothstep(0.15, 0.85, p + bandJitter * 0.6);
    gl_FragColor = mix(g0, g1, morphMix);
  }
`;

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

interface TextureEntry {
  texture: WebGLTexture;
  width: number;
  height: number;
  ready: boolean;
}

export const WebGLShaderCanvas: React.FC<WebGLShaderCanvasProps> = ({
  currentSrc,
  nextSrc,
  progress,
  direction,
  mode,
  pointerPos,
  alt,
  onWebGLStatusChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const texturesRef = useRef<Map<string, TextureEntry>>(new Map());
  const uniformsRef = useRef<Record<string, WebGLUniformLocation | null>>({});
  const startTimeRef = useRef<number>(performance.now());

  const [webglReady, setWebglReady] = useState(true);
  const [imagesBroken, setImagesBroken] = useState<Record<string, boolean>>({});

  const stateRef = useRef({
    currentSrc,
    nextSrc,
    progress,
    direction,
    mode,
    pointerPos,
  });
  stateRef.current = {
    currentSrc,
    nextSrc,
    progress,
    direction,
    mode,
    pointerPos,
  };

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const gl = glRef.current;
    const program = programRef.current;
    if (!canvas || !gl || !program) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const displayWidth = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const displayHeight = Math.max(1, Math.floor(canvas.clientHeight * dpr));

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);

    const s = stateRef.current;
    const t0 = texturesRef.current.get(s.currentSrc);
    const t1 = texturesRef.current.get(s.nextSrc) ?? t0;
    if (!t0 || !t1) return;

    const u = uniformsRef.current;
    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, t0.texture);
    gl.uniform1i(u.u_tex0, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, t1.texture);
    gl.uniform1i(u.u_tex1, 1);

    gl.uniform2f(u.u_resolution, canvas.width, canvas.height);
    gl.uniform2f(u.u_img0Resolution, t0.width, t0.height);
    gl.uniform2f(u.u_img1Resolution, t1.width, t1.height);
    gl.uniform1f(u.u_progress, s.progress);
    gl.uniform1f(u.u_direction, s.direction);
    gl.uniform1f(u.u_time, (performance.now() - startTimeRef.current) * 0.001);
    gl.uniform1i(
      u.u_mode,
      s.mode === 'wave' ? 0 : s.mode === 'halftone' ? 1 : 2
    );
    gl.uniform2f(u.u_pointer, s.pointerPos.x, 1.0 - s.pointerPos.y);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }, []);

  // Initialize WebGL context & shader program once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setWebglReady(false);
      onWebGLStatusChange?.(false);
      return;
    }

    const gl =
      canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        powerPreference: 'high-performance',
      }) ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);

    if (!gl) {
      setWebglReady(false);
      onWebGLStatusChange?.(false);
      return;
    }

    const vert = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    if (!vert || !frag) {
      setWebglReady(false);
      onWebGLStatusChange?.(false);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      setWebglReady(false);
      onWebGLStatusChange?.(false);
      return;
    }

    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setWebglReady(false);
      onWebGLStatusChange?.(false);
      return;
    }

    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

    uniformsRef.current = {
      u_tex0: gl.getUniformLocation(program, 'u_tex0'),
      u_tex1: gl.getUniformLocation(program, 'u_tex1'),
      u_resolution: gl.getUniformLocation(program, 'u_resolution'),
      u_img0Resolution: gl.getUniformLocation(program, 'u_img0Resolution'),
      u_img1Resolution: gl.getUniformLocation(program, 'u_img1Resolution'),
      u_progress: gl.getUniformLocation(program, 'u_progress'),
      u_direction: gl.getUniformLocation(program, 'u_direction'),
      u_time: gl.getUniformLocation(program, 'u_time'),
      u_mode: gl.getUniformLocation(program, 'u_mode'),
      u_pointer: gl.getUniformLocation(program, 'u_pointer'),
    };

    glRef.current = gl;
    programRef.current = program;
    setWebglReady(true);
    onWebGLStatusChange?.(true);

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => drawFrame())
        : null;
    resizeObserver?.observe(canvas);

    return () => {
      resizeObserver?.disconnect();
      texturesRef.current.forEach((entry) => {
        gl.deleteTexture(entry.texture);
      });
      texturesRef.current.clear();
      if (buffer) gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
      glRef.current = null;
      programRef.current = null;
    };
  }, [drawFrame, onWebGLStatusChange]);

  // Load and cache WebGL textures whenever slide URLs change
  useEffect(() => {
    const gl = glRef.current;
    if (!gl || !webglReady) return;

    const ensureTexture = (src: string) => {
      if (!src || texturesRef.current.has(src)) return;

      const texture = gl.createTexture();
      if (!texture) return;

      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([4, 20, 10, 255])
      );

      const entry: TextureEntry = {
        texture,
        width: 16,
        height: 9,
        ready: false,
      };
      texturesRef.current.set(src, entry);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.referrerPolicy = 'no-referrer';
      img.onload = () => {
        if (!glRef.current) return;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        entry.width = img.naturalWidth || 16;
        entry.height = img.naturalHeight || 9;
        entry.ready = true;
        drawFrame();
      };
      img.onerror = () => {
        setImagesBroken((prev) => ({ ...prev, [src]: true }));
      };
      img.src = src;
    };

    ensureTexture(currentSrc);
    ensureTexture(nextSrc);
    drawFrame();
  }, [currentSrc, nextSrc, webglReady, drawFrame]);

  // Draw immediately on prop updates and keep 60fps time animation during active transitions
  useEffect(() => {
    if (!webglReady) return;
    drawFrame();
  }, [webglReady, progress, direction, mode, pointerPos, drawFrame]);

  // Graceful CSS scale/fade fallback when WebGL is unavailable or reduced-motion is preferred
  if (!webglReady) {
    const showNext = progress > 0.5;
    const activeUrl = showNext ? nextSrc : currentSrc;
    const broken = imagesBroken[activeUrl];

    return (
      <div className="relative h-full w-full overflow-hidden bg-[#04140a]">
        {!broken ? (
          <>
            <img
              src={currentSrc}
              alt={alt}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() =>
                setImagesBroken((prev) => ({ ...prev, [currentSrc]: true }))
              }
              className="absolute inset-0 h-full w-full object-cover transition-all duration-500 ease-out"
              style={{
                opacity: 1 - progress,
                transform: `scale(${1 + progress * 0.04})`,
              }}
            />
            {nextSrc !== currentSrc && (
              <img
                src={nextSrc}
                alt={alt}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() =>
                  setImagesBroken((prev) => ({ ...prev, [nextSrc]: true }))
                }
                className="absolute inset-0 h-full w-full object-cover transition-all duration-500 ease-out"
                style={{
                  opacity: progress,
                  transform: `scale(${1.04 - progress * 0.04})`,
                }}
              />
            )}
          </>
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#04140a] via-[#062615] to-[#030805]" />
        )}
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      aria-label={alt}
      role="img"
      className="block h-full w-full select-none touch-pan-y"
    />
  );
};
