import React from 'react';
import Hero from './hero.jsx';
import { Icon, Slider, PresetGrid, ColorControls, LayoutGrid, TypoGrid } from './controls.jsx';
import { SHADER_PRESETS, PALETTES, CTA_STYLES, randSeed } from './presets.jsx';
import { ShaderEngine } from './shader.js';

const DEFAULTS = {
  preset: 'mesh',
  palette: 'sunset',
  colors: PALETTES[0].colors.slice(),
  speed: 0.8,
  intensity: 0.6,
  scale: 1.0,
  grain: 0.05,
  vignette: 0.3,
  seed: 12.0,
  typography: 'editorial',
  layout: 'left',
  ctaShape: 'pill',
  textColor: '#ffffff',
  headline: "Build hero banners that don't look like everyone else's.",
  subhead: 'A live shader studio for landing-page banners. Pick a flow, tune the colors, drop in your copy. Ship something memorable.',
  ctaPrimary: 'Start building',
  ctaSecondary: 'See examples',
  quality: 1.0
};

// load from URL hash if present
function loadFromHash(){
  try {
    if (!location.hash.startsWith('#s=')) return null;
    const json = atob(decodeURIComponent(location.hash.slice(3)));
    return JSON.parse(json);
  } catch(e){ return null; }
}

function App(){
  const initial = React.useMemo(() => ({ ...DEFAULTS, ...(loadFromHash() || {}) }), []);
  const [state, setState] = React.useState(initial);
  const [tab, setTab] = React.useState('shader'); // shader | type | code
  const [playing, setPlaying] = React.useState(true);
  const [toast, setToast] = React.useState(null);
  const heroRef = React.useRef(null);

  const s = state;
  const set = (patch) => setState(prev => ({ ...prev, ...patch }));
  const params = {
    speed: s.speed, intensity: s.intensity, scale: s.scale,
    grain: s.grain, vignette: s.vignette, seed: s.seed
  };
  const colors = s.colors;

  // Toast helper
  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 1600); };

  // Randomize everything (within shader)
  const randomize = () => {
    const pal = PALETTES[Math.floor(Math.random()*PALETTES.length)];
    const p = SHADER_PRESETS[Math.floor(Math.random()*SHADER_PRESETS.length)];
    set({
      preset: p.id,
      palette: pal.id,
      colors: pal.colors.slice(),
      seed: randSeed(),
      speed: +(0.4 + Math.random()*1.0).toFixed(2),
      intensity: +(0.3 + Math.random()*0.7).toFixed(2),
      scale: +(0.6 + Math.random()*1.6).toFixed(2)
    });
  };

  const reseed = () => set({ seed: randSeed() });

  const togglePlay = () => {
    window.__mainRunner?.togglePlay();
    setPlaying(p => !p);
  };

  // Share link
  const copyLink = async () => {
    const json = JSON.stringify(state);
    const hash = '#s=' + encodeURIComponent(btoa(json));
    const url = location.origin + location.pathname + hash;
    history.replaceState(null, '', hash);
    try { await navigator.clipboard.writeText(url); flash('Link copied'); }
    catch { flash('Link in URL bar'); }
  };

  // Copy shader source
  const copyShader = async () => {
    const src = (ShaderEngine.FRAG_HEADER + '\n' + ShaderEngine.PRESETS_SRC[s.preset]).trim();
    try { await navigator.clipboard.writeText(src); flash('Shader copied'); }
    catch { flash('Copy failed'); }
  };

  // Export snippet (HTML)
  const copySnippet = async () => {
    const snippet = `<!-- Hero Forge export -->
<div id="hero" style="position:relative;aspect-ratio:16/9;overflow:hidden;border-radius:20px">
  <canvas id="hero-canvas" style="position:absolute;inset:0;width:100%;height:100%"></canvas>
  <!-- your content here -->
</div>
<script>
  const state = ${JSON.stringify({
    preset: s.preset, colors: s.colors,
    params: { speed: s.speed, intensity: s.intensity, scale: s.scale,
              grain: s.grain, vignette: s.vignette, seed: s.seed }
  }, null, 2)};
  // include shader.js from Hero Forge, then:
  new ShaderEngine.Runner(document.getElementById('hero-canvas'), state);
</script>`;
    try { await navigator.clipboard.writeText(snippet); flash('Snippet copied'); }
    catch { flash('Copy failed'); }
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const h = (e) => {
      if (e.target.isContentEditable) return;
      if (e.key === ' '){ e.preventDefault(); togglePlay(); }
      if (e.key === 'r' || e.key === 'R') reseed();
      if (e.key === 'x' || e.key === 'X') randomize();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // Auto-white vs dark text based on palette brightness
  React.useEffect(() => {
    const lum = colors.reduce((a, c) => {
      const n = parseInt(c.replace('#',''), 16);
      const r = (n>>16)&255, g=(n>>8)&255, b=n&255;
      return a + (0.299*r + 0.587*g + 0.114*b)/255;
    }, 0) / colors.length;
  }, [colors]);

  const activePreset = SHADER_PRESETS.find(p => p.id === s.preset);

  return (
    <div className="app">
      <div className="stage">
        <div className="topbar">
          <div className="brand">
            <span className="mark"/>
            <span>Hero Forge</span>
            <span className="dot"/>
            <span style={{ color: 'var(--text-faint)' }}>v0.3 live</span>
          </div>
          <div className="topbar-actions">
            <button className="chip" onClick={copyShader} title="Copy GLSL source">
              <Icon name="code"/> Shader
            </button>
            <button className="chip" onClick={copySnippet} title="Copy embeddable snippet">
              <Icon name="copy"/> Snippet
            </button>
            <button className="chip primary" onClick={copyLink}>
              <Icon name="link"/> Share
            </button>
          </div>
        </div>

        <div className="hero-frame">
          <Hero
            heroRef={heroRef}
            preset={s.preset}
            colors={colors}
            params={params}
            quality={s.quality}
            typography={s.typography}
            layout={s.layout}
            ctaShape={s.ctaShape}
            headline={s.headline}
            subhead={s.subhead}
            ctaPrimary={s.ctaPrimary}
            ctaSecondary={s.ctaSecondary}
            textColor={s.textColor}
            onHeadlineChange={v => set({ headline: v })}
            onSubheadChange={v => set({ subhead: v })}
            onCtaPrimaryChange={v => set({ ctaPrimary: v })}
            onCtaSecondaryChange={v => set({ ctaSecondary: v })}
          />
        </div>

        <div className="stage-toolbar">
          <button onClick={togglePlay}>
            <Icon name={playing ? 'pause' : 'play'}/> {playing ? 'Pause' : 'Play'}
            <span className="kbd">␣</span>
          </button>
          <div className="sep"/>
          <button onClick={reseed}>
            <Icon name="dice"/> Reseed
            <span className="kbd">R</span>
          </button>
          <button onClick={randomize}>
            <Icon name="sparkles"/> Surprise me
            <span className="kbd">X</span>
          </button>
          <div className="sep"/>
          <button onClick={() => set({ ...DEFAULTS })}>Reset</button>
        </div>
      </div>

      <aside className="inspector">
        <div className="inspector-header">
          <h2>Currently</h2>
          <div className="title">{activePreset?.name} - {PALETTES.find(p=>p.id===s.palette)?.name || 'Custom'}</div>
        </div>
        <div className="inspector-tabs">
          <button className={tab==='shader'?'active':''} onClick={()=>setTab('shader')}>Shader</button>
          <button className={tab==='type'?'active':''} onClick={()=>setTab('type')}>Type</button>
          <button className={tab==='code'?'active':''} onClick={()=>setTab('code')}>Code</button>
        </div>

        <div className="inspector-body">
          {tab === 'shader' && <>
            <div className="section">
              <div className="section-label">Shader preset</div>
              <PresetGrid preset={s.preset} colors={colors}
                onChange={id => set({ preset: id })} />
            </div>

            <div className="section">
              <div className="section-label">Palette</div>
              <ColorControls colors={colors}
                onChange={cs => set({ colors: cs, palette: 'custom' })}
                activePalette={s.palette}
                onPalette={p => set({ palette: p.id, colors: p.colors.slice() })} />
            </div>

            <div className="section">
              <div className="section-label">Motion</div>
              <Slider label="Speed"     value={s.speed}     min={0}    max={2.5} step={0.01} onChange={v => set({ speed: v })} />
              <Slider label="Intensity" value={s.intensity} min={0}    max={1.5} step={0.01} onChange={v => set({ intensity: v })} />
              <Slider label="Scale"     value={s.scale}     min={0.3}  max={3.0} step={0.01} onChange={v => set({ scale: v })} />
            </div>

            <div className="section">
              <div className="section-label">Finish</div>
              <Slider label="Grain"    value={s.grain}    min={0} max={0.25} step={0.005} onChange={v => set({ grain: v })} />
              <Slider label="Vignette" value={s.vignette} min={0} max={1.0}  step={0.01}  onChange={v => set({ vignette: v })} />
              <Slider label="Seed"     value={s.seed}     min={0} max={100}  step={0.1}
                format={v => v.toFixed(1)}
                onChange={v => set({ seed: v })} />
              <div className="btn-row">
                <button className="btn-secondary" onClick={() => set({ seed: randSeed() })}>
                  <Icon name="dice"/> New seed
                </button>
              </div>
            </div>
          </>}

          {tab === 'type' && <>
            <div className="section">
              <div className="section-label">Typography</div>
              <TypoGrid variant={s.typography} onChange={id => set({ typography: id })} />
            </div>
            <div className="section">
              <div className="section-label">Layout</div>
              <LayoutGrid layout={s.layout} onChange={id => set({ layout: id })} />
            </div>
            <div className="section">
              <div className="section-label">CTA shape</div>
              <div className="btn-row">
                {CTA_STYLES.map(c => (
                  <button key={c.id}
                    className={s.ctaShape === c.id ? 'btn-primary' : 'btn-secondary'}
                    onClick={() => set({ ctaShape: c.id })}>{c.name}</button>
                ))}
              </div>
            </div>
            <div className="section">
              <div className="section-label">Text color</div>
              <div className="swatch-row">
                {['#ffffff','#f4f4f5','#0a0a0b','#e8ff5c','#ff7a5c'].map(c => (
                  <div key={c} className="swatch"
                    style={{ background: c, outline: s.textColor===c ? '2px solid var(--accent)' : 'none' }}
                    onClick={() => set({ textColor: c })}>
                    <span className="hex" style={{ color: c === '#0a0a0b' ? '#fff' : '#000' }}>
                      {c.replace('#','').slice(0,3).toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-faint)', margin: '10px 0 0', lineHeight: 1.5 }}>
                Click any copy in the banner to edit it directly.
              </p>
            </div>
          </>}

          {tab === 'code' && <>
            <div className="section">
              <div className="section-label">Fragment shader</div>
              <pre className="code-block">{(ShaderEngine.PRESETS_SRC[s.preset] || '').trim()}</pre>
              <div className="btn-row" style={{ marginTop: 8 }}>
                <button className="btn-secondary" onClick={copyShader}>
                  <Icon name="copy"/> Copy GLSL
                </button>
              </div>
            </div>
            <div className="section">
              <div className="section-label">Current state</div>
              <pre className="code-block">{JSON.stringify({
                preset: s.preset, palette: s.palette, colors: s.colors,
                params, typography: s.typography, layout: s.layout,
                ctaShape: s.ctaShape
              }, null, 2)}</pre>
              <div className="btn-row" style={{ marginTop: 8 }}>
                <button className="btn-secondary" onClick={copySnippet}>
                  <Icon name="copy"/> Copy embed snippet
                </button>
                <button className="btn-primary" onClick={copyLink}>
                  <Icon name="link"/> Share
                </button>
              </div>
            </div>
          </>}
        </div>
      </aside>

      {toast && <div className="toast"><Icon name="check"/> &nbsp; {toast}</div>}
    </div>
  );
}

export default App;
