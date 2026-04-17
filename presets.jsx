// ---- Shader Presets (metadata) ----
const SHADER_PRESETS = [
  { id: 'mesh',     name: 'Gradient Mesh' },
  { id: 'aurora',   name: 'Aurora' },
  { id: 'liquid',   name: 'Liquid Metal' },
  { id: 'dunes',    name: 'Dunes' },
  { id: 'ribbons',  name: 'Ribbons' },
  { id: 'voronoi',  name: 'Voronoi' },
  { id: 'caustics', name: 'Caustics' },
  { id: 'warp',     name: 'Warp' },
];

// ---- Palettes ----
const PALETTES = [
  { id: 'sunset',   name: 'Sunset',     colors: ['#2d1b69', '#e94560', '#f9c80e', '#0f3460'] },
  { id: 'cyber',    name: 'Cyber',      colors: ['#0a0a23', '#ff006e', '#8338ec', '#3a86ff'] },
  { id: 'arctic',   name: 'Arctic',     colors: ['#1a2a3a', '#6bb5c7', '#d4e4eb', '#4a7c88'] },
  { id: 'ember',    name: 'Ember',      colors: ['#1a0b0b', '#ff4d2e', '#ffb627', '#6b1616'] },
  { id: 'verdant',  name: 'Verdant',    colors: ['#0d2818', '#2d5f3f', '#a3c585', '#e8f5d8'] },
  { id: 'mono',     name: 'Mono',       colors: ['#0a0a0b', '#3a3a42', '#8a8a94', '#f4f4f5'] },
  { id: 'peach',    name: 'Peach',      colors: ['#2a1014', '#ff6b6b', '#ffd3b6', '#ffaaa5'] },
  { id: 'oceanic',  name: 'Oceanic',    colors: ['#001f3f', '#0074d9', '#39cccc', '#7fdbff'] },
  { id: 'retro',    name: 'Retro',      colors: ['#1a0033', '#ff00ff', '#00ffff', '#ffff00'] },
  { id: 'toxic',    name: 'Toxic',      colors: ['#0b0f00', '#baff00', '#5cff5c', '#1a2d00'] },
  { id: 'plum',     name: 'Plum',       colors: ['#2b0a3d', '#9d4edd', '#e0aaff', '#3c096c'] },
  { id: 'graphite', name: 'Graphite',   colors: ['#18181b', '#3f3f46', '#a1a1aa', '#e4e4e7'] },
];

// ---- Typography variants ----
const TYPO_VARIANTS = [
  { id: 'editorial', name: 'Editorial',     preview: { h: 'The quiet future', sub: 'Instrument Serif · Inter', ctaShape: 'pill' } },
  { id: 'display',   name: 'Big Display',   preview: { h: 'LOUD BY DESIGN',   sub: 'Archivo 900 uppercase',    ctaShape: 'sharp' } },
  { id: 'modern',    name: 'Modern SaaS',   preview: { h: 'Ship faster',      sub: 'Inter Tight 600',          ctaShape: 'pill' } },
  { id: 'mono',      name: 'Monospace',     preview: { h: 'hello.system',     sub: 'JetBrains Mono',           ctaShape: 'sharp' } },
  { id: 'fraunces',  name: 'Italic Fraunces', preview: { h: 'Soft futures',   sub: 'Fraunces Italic',          ctaShape: 'pill' } },
  { id: 'mixed',     name: 'Mixed Serif/Sans', preview: { h: 'Mix it up',     sub: 'Archivo + Instrument',     ctaShape: 'pill' } },
  { id: 'caslon',    name: 'Caslon Classic',   preview: { h: 'Timeless',      sub: 'Libre Caslon Display',     ctaShape: 'pill' } },
];

// ---- Layout variants ----
const LAYOUT_VARIANTS = [
  { id: 'centered', name: 'Centered' },
  { id: 'left',     name: 'Left-aligned' },
  { id: 'bottom',   name: 'Bottom-anchored' },
  { id: 'split',    name: 'Split' },
  { id: 'overlap',  name: 'Big Overlap' },
];

// ---- CTA styles ----
const CTA_STYLES = [
  { id: 'pill',  name: 'Pill' },
  { id: 'sharp', name: 'Sharp' },
  { id: 'block', name: 'Block' },
];

// random helpers
function randSeed(){ return +(Math.random() * 100).toFixed(2); }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

export {
  SHADER_PRESETS,
  PALETTES,
  TYPO_VARIANTS,
  LAYOUT_VARIANTS,
  CTA_STYLES,
  randSeed,
  pick,
};
