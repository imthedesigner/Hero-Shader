import React from 'react';
import { SHADER_PRESETS, PALETTES, TYPO_VARIANTS, LAYOUT_VARIANTS } from './presets.jsx';
import { ShaderEngine } from './shader.js';

/* ---------- Tiny icon set (inline svg) ---------- */
const Icon = ({ name, size = 14 }) => {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth: 1.8,
    strokeLinecap: 'round', strokeLinejoin: 'round'
  };
  switch(name){
    case 'dice':     return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="16" cy="8" r="1" fill="currentColor"/><circle cx="8" cy="16" r="1" fill="currentColor"/><circle cx="16" cy="16" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>;
    case 'copy':     return <svg {...p}><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>;
    case 'link':     return <svg {...p}><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>;
    case 'play':     return <svg {...p}><polygon points="6,4 20,12 6,20" fill="currentColor" stroke="none"/></svg>;
    case 'pause':    return <svg {...p}><rect x="6" y="4" width="4" height="16" fill="currentColor" stroke="none"/><rect x="14" y="4" width="4" height="16" fill="currentColor" stroke="none"/></svg>;
    case 'download':return <svg {...p}><path d="M12 3v13"/><path d="m7 11 5 5 5-5"/><path d="M5 21h14"/></svg>;
    case 'code':     return <svg {...p}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
    case 'sparkles': return <svg {...p}><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></svg>;
    case 'check':    return <svg {...p}><polyline points="5 12 10 17 19 7"/></svg>;
    default: return null;
  }
};

/* ---------- Slider ---------- */
function Slider({ label, value, min, max, step=0.01, format, onChange }){
  const fmt = format || (v => v.toFixed(2));
  return (
    <>
      <div className="slider-row">
        <span className="lbl">{label}</span>
        <span className="val">{fmt(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))} />
    </>
  );
}

/* ---------- Preset grid (with live mini shaders) ---------- */
function PresetTile({ preset, colors, active, onClick }){
  const canvasRef = React.useRef(null);
  const runnerRef = React.useRef(null);
  React.useEffect(() => {
    if (!canvasRef.current) return;
    const r = new ShaderEngine.Runner(canvasRef.current, {
      preset: preset.id,
      colors,
      params: { speed: 0.6, intensity: 0.6, scale: 1.0, grain: 0.04, vignette: 0.25, seed: 0 },
      quality: 0.5
    });
    runnerRef.current = r;
    return () => r.destroy();
  }, [preset.id]);
  React.useEffect(() => { runnerRef.current?.setColors(colors); }, [colors]);

  return (
    <div className={'preset-tile' + (active ? ' active' : '')} onClick={onClick} title={preset.name}>
      <canvas ref={canvasRef} />
      <span className="name">{preset.name}</span>
    </div>
  );
}

function PresetGrid({ preset, colors, onChange }){
  return (
    <div className="preset-grid">
      {SHADER_PRESETS.map(p => (
        <PresetTile key={p.id} preset={p} colors={colors}
          active={p.id === preset} onClick={() => onChange(p.id)} />
      ))}
    </div>
  );
}

/* ---------- Color Controls ---------- */
function ColorControls({ colors, onChange, activePalette, onPalette }){
  return (
    <>
      <div className="swatch-row">
        {colors.map((c, i) => (
          <label key={i} className="swatch" style={{ background: c }}>
            <input type="color" value={c} onChange={e => {
              const next = colors.slice(); next[i] = e.target.value; onChange(next);
            }} />
            <span className="hex">{c.replace('#','').toUpperCase()}</span>
          </label>
        ))}
      </div>
      <div className="palette-strip">
        {PALETTES.map(p => (
          <div key={p.id}
            className={'palette' + (activePalette === p.id ? ' active' : '')}
            onClick={() => onPalette(p)} title={p.name}>
            {p.colors.map((c, i) => <span key={i} style={{ background: c }}/>)}
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------- Layout / Typography tiles ---------- */
function LayoutTile({ layout, active, onClick }){
  // Draw a tiny representation of each layout
  const styles = {
    centered: { ai: 'center', jc: 'center', ta: 'center' },
    left:     { ai: 'flex-start', jc: 'center', ta: 'left' },
    bottom:   { ai: 'flex-start', jc: 'flex-end', ta: 'left' },
    split:    { ai: 'flex-start', jc: 'center', ta: 'left', split: true },
    overlap:  { ai: 'flex-start', jc: 'flex-end', ta: 'left', big: true },
  };
  const s = styles[layout.id];
  return (
    <div className={'variant-tile' + (active ? ' active' : '')} onClick={onClick}
      style={{ alignItems: s.ai, justifyContent: s.jc, textAlign: s.ta }}>
      <span className="mini-label">{layout.name}</span>
      <div style={{ width: s.split ? '50%' : (s.big ? '100%' : '65%'), textAlign: s.ta }}>
        <p className="mini-head" style={s.big ? { fontSize: 16, letterSpacing: '-0.03em' } : null}>
          {s.big ? 'HUGE' : 'Headline'}
        </p>
        <p className="mini-sub">Subhead line of copy</p>
        <span className="mini-cta">Get started</span>
      </div>
    </div>
  );
}

function TypoTile({ variant, active, onClick }){
  const fontStyle = {
    editorial: { fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 15, letterSpacing: '-0.02em' },
    display:   { fontFamily: "'Archivo', sans-serif",     fontWeight: 900, fontSize: 13, letterSpacing: '-0.04em', textTransform: 'uppercase' },
    modern:    { fontFamily: "'Inter Tight', sans-serif", fontWeight: 600, fontSize: 14, letterSpacing: '-0.03em' },
    mono:      { fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, fontSize: 11, letterSpacing: '-0.02em' },
    fraunces:  { fontFamily: "'Fraunces', serif",         fontWeight: 600, fontStyle: 'italic', fontSize: 15, letterSpacing: '-0.02em' },
    mixed:     { fontFamily: "'Archivo', sans-serif",     fontWeight: 800, fontSize: 13, letterSpacing: '-0.03em' },
    caslon:    { fontFamily: "'Libre Caslon Display', serif", fontWeight: 400, fontSize: 14, letterSpacing: '-0.01em' },
  }[variant.id];
  const subFont = {
    editorial: { fontFamily: "'Inter Tight', sans-serif" },
    display:   { fontFamily: "'Archivo', sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em' },
    modern:    { fontFamily: "'Inter Tight', sans-serif" },
    mono:      { fontFamily: "'JetBrains Mono', monospace" },
    fraunces:  { fontFamily: "'DM Sans', sans-serif" },
    mixed:     { fontFamily: "'DM Sans', sans-serif" },
    caslon:    { fontFamily: "'DM Sans', sans-serif" },
  }[variant.id];
  return (
    <div className={'variant-tile' + (active ? ' active' : '')} onClick={onClick}
      style={{ justifyContent: 'center', padding: '12px 10px 10px' }}>
      <span className="mini-label">{variant.name}</span>
      <p style={{ ...fontStyle, margin: 0, lineHeight: 0.95 }}>
        {variant.id === 'mixed' ? (<>Ship <em style={{fontFamily:"'Instrument Serif',serif",fontStyle:'italic',fontWeight:400}}>bold</em></>) : variant.preview.h}
      </p>
      <p style={{ ...subFont, fontSize: 7, color: 'var(--text-dim)', margin: '3px 0 6px', opacity: 0.7 }}>
        {variant.preview.sub}
      </p>
    </div>
  );
}

function LayoutGrid({ layout, onChange }){
  return (
    <div className="variant-grid">
      {LAYOUT_VARIANTS.map(l => (
        <LayoutTile key={l.id} layout={l} active={layout === l.id} onClick={() => onChange(l.id)} />
      ))}
    </div>
  );
}
function TypoGrid({ variant, onChange }){
  return (
    <div className="variant-grid">
      {TYPO_VARIANTS.map(v => (
        <TypoTile key={v.id} variant={v} active={variant === v.id} onClick={() => onChange(v.id)} />
      ))}
    </div>
  );
}

export { Icon, Slider, PresetGrid, ColorControls, LayoutGrid, TypoGrid };
