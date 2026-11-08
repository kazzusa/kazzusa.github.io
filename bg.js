/*
  Animated background: a swirling "marbled planet" on the right edge of the screen,
  with faint aurora haze and stars in deep space. Drawn with a WebGL shader.
  Falls back to a CSS gradient (.bg-fallback) if WebGL isn't available.
*/
(() => {
  const canvas = document.getElementById('bg');
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) { document.documentElement.classList.add('no-webgl'); return; }

  const vertexSrc = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';

  const fragmentSrc = `
    precision highp float;
    uniform vec2 uRes;
    uniform float uTime;
    uniform vec3 uPlanet; // center x, center y, radius (in canvas pixels)

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }
    const mat2 ROT = mat2(0.8, 0.6, -0.6, 0.8);
    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 5; i++) { v += a * noise(p); p = ROT * p * 2.03; a *= 0.5; }
      return v;
    }

    void main() {
      vec2 fc = gl_FragCoord.xy;
      float t = uTime;

      /* --- deep space + faint aurora haze (icy blue, warm orange) --- */
      vec2 sp = fc / uRes.y;
      vec3 col = vec3(0.008, 0.010, 0.016);
      float band = fbm(vec2(sp.x * 1.3 + t * 0.012, sp.y * 2.6 - t * 0.018));
      float topFade = smoothstep(0.25, 1.0, fc.y / uRes.y);
      col += vec3(0.16, 0.34, 0.46) * pow(band, 2.8) * 0.40 * topFade;
      col += vec3(0.55, 0.22, 0.06) * pow(fbm(sp * 2.0 - t * 0.01), 3.2) * 0.14;

      /* stars */
      vec2 cell = floor(fc / 2.0);
      float s = hash(cell);
      float twinkle = 0.6 + 0.4 * sin(t * 2.0 + s * 40.0);
      col += vec3(step(0.9988, s) * twinkle * 0.9);

      /* --- planet --- */
      vec2 pc = (fc - uPlanet.xy) / uPlanet.z;
      float d = length(pc);

      if (d < 1.0) {
        float z = sqrt(1.0 - d * d);
        vec2 uv = pc / (0.4 + z) * 1.9;          // bulge toward the edge for a curved surface
        uv += vec2(t * 0.010, -t * 0.006);

        vec2 q = vec2(fbm(uv + vec2(0.0, t * 0.020)),
                      fbm(uv + vec2(5.2, 1.3)));
        vec2 r = vec2(fbm(uv + 3.6 * q + vec2(1.7, 9.2) + t * 0.025),
                      fbm(uv + 3.6 * q + vec2(8.3, 2.8) - t * 0.018));
        float f = fbm(uv + 3.6 * r);
        float streak = 0.5 + 0.5 * sin(f * 30.0 + r.x * 14.0);

        /* palette: silver, icy blue, orange, red-orange, black specks */
        vec3 graphite = vec3(0.20, 0.21, 0.23);
        vec3 silver   = vec3(0.78, 0.80, 0.83);
        vec3 ice      = vec3(0.55, 0.80, 0.90);
        vec3 orange   = vec3(1.00, 0.52, 0.12);
        vec3 ember    = vec3(0.85, 0.20, 0.08);

        vec3 pcol = mix(graphite, silver, smoothstep(0.25, 0.70, f + 0.10 * streak));
        float iceMask = smoothstep(0.50, 0.75, q.x) * (1.0 - smoothstep(0.55, 0.75, r.y));
        pcol = mix(pcol, ice, iceMask * 0.75);
        float warmMask = smoothstep(0.50, 0.74, r.y);
        pcol = mix(pcol, mix(ember, orange, smoothstep(0.3, 0.8, streak)), warmMask * 0.92);
        pcol *= 0.80 + 0.28 * streak;
        float speck = smoothstep(0.74, 0.82, noise(uv * 22.0 + r * 6.0));
        pcol = mix(pcol, vec3(0.02), speck * 0.75);

        vec3 n = vec3(pc, z);
        float light = clamp(dot(n, normalize(vec3(-0.65, 0.25, 0.72))), 0.0, 1.0);
        pcol *= 0.22 + 0.70 * light;

        float rim = pow(1.0 - z, 2.5);
        pcol += vec3(1.0, 0.62, 0.32) * rim * 0.35;

        pcol *= 0.62; /* keep the planet dim so the content stays readable */

        col = mix(col, pcol, smoothstep(1.0, 0.994, d));
      }

      /* atmosphere glow around the planet */
      float outside = max(d - 1.0, 0.0);
      col += vec3(1.00, 0.55, 0.25) * exp(-outside * 16.0) * step(1.0, d) * 0.22;
      col += vec3(0.35, 0.60, 0.80) * exp(-outside * 4.0) * step(1.0, d) * 0.06;

      /* vignette */
      vec2 vu = fc / uRes - 0.5;
      col *= 1.0 - dot(vu, vu) * 0.6;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }
  const vs = compile(gl.VERTEX_SHADER, vertexSrc);
  const fs = compile(gl.FRAGMENT_SHADER, fragmentSrc);
  if (!vs || !fs) { document.documentElement.classList.add('no-webgl'); return; }
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { document.documentElement.classList.add('no-webgl'); return; }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uPlanet = gl.getUniformLocation(prog, 'uPlanet');

  // Render at reduced resolution: the image is soft anyway and this keeps it light on laptops/phones.
  const scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.5;
  let w = 0, h = 0;

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function planet() {
    const mobile = w < 700;
    const r = mobile ? h * 0.52 : Math.max(h * 0.78, w * 0.38);
    const cx = mobile ? w * 1.0 : w * 1.02;
    // Planet drifts upward slightly as you scroll (parallax).
    const max = Math.max(1, document.documentElement.scrollHeight - h);
    const progress = window.scrollY / max;
    const cyFromTop = h * (mobile ? 0.62 : 0.58) - progress * h * 0.35;
    return [cx * scale, (h - cyFromTop) * scale, r * scale];
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start = performance.now();
  let last = 0;

  function draw(now) {
    const t = reduceMotion ? 24 : 24 + (now - start) / 1000;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, t);
    gl.uniform3fv(uPlanet, planet());
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function loop(now) {
    if (now - last > 40) { last = now; draw(now); } // ~25 fps is plenty for a slow swirl and leaves room for smooth hovers
    requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener('resize', () => { resize(); draw(performance.now()); });
  if (reduceMotion) {
    draw(performance.now());
    window.addEventListener('scroll', () => draw(performance.now()), { passive: true });
  } else {
    requestAnimationFrame(loop);
  }
})();
