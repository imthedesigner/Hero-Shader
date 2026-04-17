/* ===========================================================
   Shader Engine — a tiny WebGL2 shader runner.
   Exposes window.ShaderEngine.
   =========================================================== */
(function () {
  const VERT = `#version 300 es
  in vec2 a;
  out vec2 v;
  void main(){
    v = a * 0.5 + 0.5;
    gl_Position = vec4(a, 0.0, 1.0);
  }`;

  // Shared helpers glued on top of every fragment shader.
  const FRAG_HEADER = `#version 300 es
  precision highp float;
  in vec2 v;
  out vec4 fragColor;

  uniform vec2  u_res;
  uniform float u_time;
  uniform float u_speed;
  uniform float u_intensity;
  uniform float u_scale;
  uniform float u_grain;
  uniform float u_vignette;
  uniform float u_seed;
  uniform vec3  u_c0;
  uniform vec3  u_c1;
  uniform vec3  u_c2;
  uniform vec3  u_c3;

  // --- hashing / noise utils ---
  float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float hash3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }

  float vnoise(vec2 p){
    vec2 i = floor(p); vec2 f = fract(p);
    float a = hash(i), b = hash(i + vec2(1,0)), c = hash(i + vec2(0,1)), d = hash(i + vec2(1,1));
    vec2 u = f*f*(3.0-2.0*f);
    return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
  }

  float fbm(vec2 p){
    float s = 0.0, a = 0.5;
    for (int i=0;i<5;i++){ s += a*vnoise(p); p *= 2.02; a *= 0.5; }
    return s;
  }

  vec3 pal4(float t, vec3 a, vec3 b, vec3 c, vec3 d){
    t = clamp(t, 0.0, 1.0);
    float t3 = t * 3.0;
    if (t3 < 1.0) return mix(a, b, t3);
    if (t3 < 2.0) return mix(b, c, t3 - 1.0);
    return mix(c, d, t3 - 2.0);
  }

  vec2 rot(vec2 p, float a){ float s=sin(a), c=cos(a); return mat2(c,-s,s,c)*p; }

  vec3 applyFx(vec3 col, vec2 uv){
    // grain
    float g = (hash(uv*u_res + u_time*60.0) - 0.5) * u_grain;
    col += g;
    // vignette
    vec2 c = uv - 0.5;
    float vg = 1.0 - dot(c,c) * u_vignette * 2.2;
    col *= clamp(vg, 0.0, 1.0);
    return col;
  }
  `;

  // ------------- Preset fragment shaders -------------
  const PRESETS = {
    mesh: `
      void main(){
        vec2 uv = v;
        vec2 p = (uv - 0.5) * vec2(u_res.x/u_res.y, 1.0);
        float t = u_time * u_speed * 0.35 + u_seed;
        p *= u_scale;
        // 4 moving centers
        vec2 c0 = vec2(sin(t*0.7), cos(t*0.5)) * 0.6;
        vec2 c1 = vec2(cos(t*0.6+1.2), sin(t*0.9+0.3)) * 0.6;
        vec2 c2 = vec2(sin(t*0.4+2.1), sin(t*0.8+1.7)) * 0.55;
        vec2 c3 = vec2(cos(t*0.3+3.3), cos(t*0.6+2.2)) * 0.55;
        float d0 = 1.0/(0.25 + length(p-c0)*2.4);
        float d1 = 1.0/(0.25 + length(p-c1)*2.4);
        float d2 = 1.0/(0.25 + length(p-c2)*2.4);
        float d3 = 1.0/(0.25 + length(p-c3)*2.4);
        float w = d0+d1+d2+d3;
        vec3 col = (u_c0*d0 + u_c1*d1 + u_c2*d2 + u_c3*d3) / w;
        // extra smooth flow distortion
        float n = fbm(p * 1.6 + t*0.4) * u_intensity * 0.4;
        col = mix(col, pal4(n, u_c0, u_c1, u_c2, u_c3), n*0.35);
        fragColor = vec4(applyFx(col, uv), 1.0);
      }
    `,

    aurora: `
      void main(){
        vec2 uv = v;
        vec2 p = uv;
        p.x *= u_res.x/u_res.y;
        float t = u_time * u_speed * 0.4 + u_seed;

        float acc = 0.0;
        vec3 col = u_c0 * 0.2;
        for (int i=0;i<5;i++){
          float fi = float(i);
          float y = 0.5 + sin(p.x*3.0 + t*0.6 + fi*1.3) * 0.08
                       + fbm(vec2(p.x*2.0 + t*0.3, fi)) * 0.25 * u_intensity;
          float d = abs(p.y - y);
          float band = 0.06 / (d + 0.04);
          band *= smoothstep(0.0, 0.4, 1.0 - d);
          vec3 bc = pal4(fract(fi*0.37 + t*0.1), u_c0, u_c1, u_c2, u_c3);
          col += bc * band * 0.22;
          acc += band;
        }
        col += u_c3 * acc * 0.02;
        // soft top-to-bottom fade
        col *= mix(1.4, 0.6, uv.y);
        col *= u_scale*0.5 + 0.7;
        fragColor = vec4(applyFx(col, uv), 1.0);
      }
    `,

    liquid: `
      // Plasma / liquid metal via domain-warped fbm
      void main(){
        vec2 uv = v;
        vec2 p = (uv - 0.5) * vec2(u_res.x/u_res.y, 1.0) * u_scale * 2.0;
        float t = u_time * u_speed * 0.25 + u_seed;
        vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
        vec2 r = vec2(fbm(p + q*3.0 + vec2(1.7,9.2) + t*1.1),
                      fbm(p + q*3.0 + vec2(8.3,2.8) - t*0.9));
        float f = fbm(p + r*(2.0 + u_intensity*2.0));
        vec3 col = pal4(f, u_c0, u_c1, u_c2, u_c3);
        col = mix(col, u_c3, clamp(length(r)*0.3, 0.0, 0.5)*u_intensity);
        fragColor = vec4(applyFx(col, uv), 1.0);
      }
    `,

    dunes: `
      // Flowing noise waves / layered dunes
      void main(){
        vec2 uv = v;
        vec2 p = uv;
        p.x *= u_res.x/u_res.y;
        p *= u_scale;
        float t = u_time * u_speed * 0.3 + u_seed;
        vec3 col = mix(u_c0, u_c1, uv.y);
        for (int i=0;i<6;i++){
          float fi = float(i);
          float layer = fi/5.0;
          float n = fbm(vec2(p.x*1.2 + t*(0.3+layer*0.5), fi*3.17 + t*0.1));
          float y = 0.25 + layer*0.55 + (n - 0.5)*0.14*u_intensity;
          float edge = smoothstep(y+0.002, y-0.002, p.y);
          vec3 layerCol = pal4(layer, u_c0, u_c1, u_c2, u_c3);
          layerCol *= 0.5 + 0.5*(1.0-layer);
          col = mix(col, layerCol, edge);
        }
        fragColor = vec4(applyFx(col, uv), 1.0);
      }
    `,

    voronoi: `
      // Voronoi cells w/ smooth distance
      vec2 vorHash(vec2 p){ p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3))); return fract(sin(p)*43758.5453); }
      void main(){
        vec2 uv = v;
        vec2 p = (uv - 0.5) * vec2(u_res.x/u_res.y, 1.0) * (u_scale*3.0 + 1.0);
        float t = u_time * u_speed * 0.3 + u_seed;
        vec2 g = floor(p); vec2 f = fract(p);
        float d1 = 1e9, d2 = 1e9;
        vec2 cellId = vec2(0);
        for (int y=-1;y<=1;y++) for (int x=-1;x<=1;x++){
          vec2 n = vec2(x,y);
          vec2 o = vorHash(g + n);
          o = 0.5 + 0.5*sin(t + 6.2831*o);
          vec2 r = n + o - f;
          float d = dot(r,r);
          if (d < d1) { d2 = d1; d1 = d; cellId = g+n; }
          else if (d < d2) d2 = d;
        }
        float cellF = hash(cellId);
        vec3 col = pal4(fract(cellF + t*0.05), u_c0, u_c1, u_c2, u_c3);
        float edge = smoothstep(0.0, 0.05 + u_intensity*0.08, sqrt(d2)-sqrt(d1));
        col *= edge * 0.9 + 0.1;
        col = mix(col, u_c3, (1.0-edge)*u_intensity*0.5);
        fragColor = vec4(applyFx(col, uv), 1.0);
      }
    `,

    caustics: `
      // Underwater caustics
      void main(){
        vec2 uv = v;
        vec2 p = (uv - 0.5) * vec2(u_res.x/u_res.y, 1.0) * (u_scale*3.0+1.0);
        float t = u_time * u_speed * 0.5 + u_seed;
        vec2 i = p; float c = 1.0; float inten = 0.005;
        for (int n = 0; n < 5; n++){
          float ti = t * (1.0 - (3.5 / float(n+1)));
          i = p + vec2(cos(ti - i.x) + sin(ti + i.y), sin(ti - i.y) + cos(ti + i.x));
          c += 1.0 / length(vec2(p.x/(sin(i.x+ti)/inten), p.y/(cos(i.y+ti)/inten)));
        }
        c /= 5.0;
        c = 1.17 - pow(c, 1.4);
        float a = pow(abs(c), 8.0);
        a = clamp(a + 0.02, 0.0, 1.0);
        vec3 base = mix(u_c0, u_c1, uv.y);
        vec3 glow = pal4(a, u_c1, u_c2, u_c3, u_c3);
        vec3 col = mix(base, glow, a * (0.6 + u_intensity*0.7));
        fragColor = vec4(applyFx(col, uv), 1.0);
      }
    `,

    warp: `
      // Gyroid / warp tunnel
      void main(){
        vec2 uv = v;
        vec2 p = (uv - 0.5) * vec2(u_res.x/u_res.y, 1.0) * u_scale * 2.2;
        float t = u_time * u_speed * 0.4 + u_seed;
        p = rot(p, t*0.1);
        float r = length(p);
        float a = atan(p.y, p.x);
        float bands = sin(8.0/(r+0.2) + t + a*3.0);
        float n = fbm(p*2.0 + t*0.3) * u_intensity;
        float f = bands*0.5 + 0.5 + n*0.4;
        vec3 col = pal4(fract(f + t*0.05), u_c0, u_c1, u_c2, u_c3);
        col *= smoothstep(0.0, 0.2, r);
        col *= 1.0 - smoothstep(1.3, 1.8, r);
        fragColor = vec4(applyFx(col, uv), 1.0);
      }
    `,

    ribbons: `
      // Soft flowing ribbons
      void main(){
        vec2 uv = v;
        vec2 p = uv;
        p.x *= u_res.x/u_res.y;
        float t = u_time * u_speed * 0.3 + u_seed;
        p *= u_scale;
        vec3 col = mix(u_c0, u_c1*0.3, uv.y);
        for (int i=0;i<4;i++){
          float fi = float(i);
          float phase = fi*1.7 + t;
          float y = 0.5 + sin(p.x*1.8 + phase) * (0.18 + fi*0.04)
                        + sin(p.x*3.7 + phase*1.3) * 0.05 * u_intensity;
          float thickness = 0.02 + 0.03*u_intensity + sin(p.x*2.0 + phase)*0.01;
          float d = abs(p.y - y);
          float band = smoothstep(thickness, 0.0, d);
          vec3 bc = pal4(fract(fi*0.3 + t*0.1), u_c0, u_c1, u_c2, u_c3);
          col = mix(col, bc, band*0.85);
        }
        fragColor = vec4(applyFx(col, uv), 1.0);
      }
    `
  };

  function compile(gl, type, src){
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)){
      console.error('Shader compile error:', gl.getShaderInfoLog(s), src);
    }
    return s;
  }

  function buildProgram(gl, fragBody){
    const fragSrc = FRAG_HEADER + '\n' + fragBody;
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, fragSrc);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)){
      console.error('Link error:', gl.getProgramInfoLog(prog));
    }
    return prog;
  }

  function hexToRgb(h){
    if (!h) return [0,0,0];
    h = h.replace('#','');
    if (h.length === 3) h = h.split('').map(c => c+c).join('');
    const n = parseInt(h, 16);
    return [((n>>16)&255)/255, ((n>>8)&255)/255, (n&255)/255];
  }

  class Runner {
    constructor(canvas, { preset='mesh', params={}, colors=['#2d1b69','#e94560','#f9c80e','#0f3460'], quality=1 } = {}){
      this.canvas = canvas;
      this.gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: false, premultipliedAlpha: false });
      if (!this.gl){ console.error('WebGL2 unavailable'); return; }
      this.quality = quality;
      this.params = Object.assign({
        speed: 0.8, intensity: 0.6, scale: 1.0, grain: 0.05, vignette: 0.3, seed: 0.0
      }, params);
      this.colors = colors.slice();
      this.preset = preset;
      this.running = true;
      this._setup();
      this._resize();
      this._start = performance.now();
      this._loop = this._loop.bind(this);
      requestAnimationFrame(this._loop);
      this._ro = new ResizeObserver(() => this._resize());
      this._ro.observe(canvas);
    }

    _setup(){
      const gl = this.gl;
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
      this._loadPreset(this.preset);
    }

    _loadPreset(name){
      const gl = this.gl;
      if (this.program) gl.deleteProgram(this.program);
      this.program = buildProgram(gl, PRESETS[name] || PRESETS.mesh);
      gl.useProgram(this.program);
      const a = gl.getAttribLocation(this.program, 'a');
      gl.enableVertexAttribArray(a);
      gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
      this.u = {
        res: gl.getUniformLocation(this.program, 'u_res'),
        time: gl.getUniformLocation(this.program, 'u_time'),
        speed: gl.getUniformLocation(this.program, 'u_speed'),
        intensity: gl.getUniformLocation(this.program, 'u_intensity'),
        scale: gl.getUniformLocation(this.program, 'u_scale'),
        grain: gl.getUniformLocation(this.program, 'u_grain'),
        vignette: gl.getUniformLocation(this.program, 'u_vignette'),
        seed: gl.getUniformLocation(this.program, 'u_seed'),
        c0: gl.getUniformLocation(this.program, 'u_c0'),
        c1: gl.getUniformLocation(this.program, 'u_c1'),
        c2: gl.getUniformLocation(this.program, 'u_c2'),
        c3: gl.getUniformLocation(this.program, 'u_c3')
      };
      this.preset = name;
    }

    setPreset(name){ if (PRESETS[name]) this._loadPreset(name); }
    setParams(p){ Object.assign(this.params, p); }
    setColors(cs){ this.colors = cs.slice(); }
    setQuality(q){ this.quality = q; this._resize(); }
    pause(){ this.running = false; }
    play(){ if (!this.running){ this.running = true; this._pausedOffset = (this._pausedOffset||0); requestAnimationFrame(this._loop); } }
    togglePlay(){ this.running ? this.pause() : this.play(); }
    destroy(){ this.running = false; this._ro?.disconnect(); }

    _resize(){
      const c = this.canvas;
      const rect = c.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2) * this.quality;
      const w = Math.max(2, Math.round(rect.width * dpr));
      const h = Math.max(2, Math.round(rect.height * dpr));
      if (c.width !== w || c.height !== h){
        c.width = w; c.height = h;
      }
      this.gl.viewport(0, 0, w, h);
    }

    _loop(){
      if (!this.running) return;
      const gl = this.gl;
      const t = (performance.now() - this._start) / 1000;
      gl.useProgram(this.program);
      gl.uniform2f(this.u.res, this.canvas.width, this.canvas.height);
      gl.uniform1f(this.u.time, t);
      gl.uniform1f(this.u.speed, this.params.speed);
      gl.uniform1f(this.u.intensity, this.params.intensity);
      gl.uniform1f(this.u.scale, this.params.scale);
      gl.uniform1f(this.u.grain, this.params.grain);
      gl.uniform1f(this.u.vignette, this.params.vignette);
      gl.uniform1f(this.u.seed, this.params.seed);
      gl.uniform3fv(this.u.c0, hexToRgb(this.colors[0]));
      gl.uniform3fv(this.u.c1, hexToRgb(this.colors[1]));
      gl.uniform3fv(this.u.c2, hexToRgb(this.colors[2]));
      gl.uniform3fv(this.u.c3, hexToRgb(this.colors[3]));
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(this._loop);
    }

    // one-shot render (for thumbnails)
    renderFrame(t){
      const gl = this.gl;
      gl.useProgram(this.program);
      gl.uniform2f(this.u.res, this.canvas.width, this.canvas.height);
      gl.uniform1f(this.u.time, t ?? 0.5);
      gl.uniform1f(this.u.speed, this.params.speed);
      gl.uniform1f(this.u.intensity, this.params.intensity);
      gl.uniform1f(this.u.scale, this.params.scale);
      gl.uniform1f(this.u.grain, this.params.grain);
      gl.uniform1f(this.u.vignette, this.params.vignette);
      gl.uniform1f(this.u.seed, this.params.seed);
      gl.uniform3fv(this.u.c0, hexToRgb(this.colors[0]));
      gl.uniform3fv(this.u.c1, hexToRgb(this.colors[1]));
      gl.uniform3fv(this.u.c2, hexToRgb(this.colors[2]));
      gl.uniform3fv(this.u.c3, hexToRgb(this.colors[3]));
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  }

  window.ShaderEngine = {
    Runner,
    presets: Object.keys(PRESETS),
    PRESETS_SRC: PRESETS,
    FRAG_HEADER
  };
})();

export const ShaderEngine = window.ShaderEngine;
