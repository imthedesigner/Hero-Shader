import React from 'react';
import { ShaderEngine } from './shader.js';

function Hero({
  preset, colors, params, quality,
  typography, layout, ctaShape,
  headline, subhead, ctaPrimary, ctaSecondary,
  onHeadlineChange, onSubheadChange, onCtaPrimaryChange, onCtaSecondaryChange,
  heroRef, textColor
}){
  const canvasRef = React.useRef(null);
  const runnerRef = React.useRef(null);

  React.useEffect(() => {
    if (!canvasRef.current) return;
    const r = new ShaderEngine.Runner(canvasRef.current, {
      preset, colors, params, quality
    });
    runnerRef.current = r;
    // expose for keyboard play/pause
    window.__mainRunner = r;
    return () => { r.destroy(); if (window.__mainRunner === r) window.__mainRunner = null; };
  }, []);

  React.useEffect(() => { runnerRef.current?.setPreset(preset); }, [preset]);
  React.useEffect(() => { runnerRef.current?.setColors(colors); }, [colors]);
  React.useEffect(() => { runnerRef.current?.setParams(params); }, [params]);
  React.useEffect(() => { runnerRef.current?.setQuality(quality); }, [quality]);

  const renderHeadline = () => {
    if (typography === 'mixed') {
      // split last word into italic serif
      const words = headline.trim().split(' ');
      if (words.length > 1) {
        const last = words.pop();
        return (<>{words.join(' ')} <em>{last}</em></>);
      }
    }
    return headline;
  };

  return (
    <div ref={heroRef} className={`hero type-${typography} layout-${layout}`}
         style={{ '--hero-text': textColor, '--hero-cta-text': '#0a0a0b' }}>
      <canvas ref={canvasRef} />
      <div className="hero-nav">
        <span className="logo">◆ YOURBRAND</span>
        <span className="links">
          <span>Product</span><span>Pricing</span><span>Docs</span>
        </span>
        <span className="cta-mini">Sign in</span>
      </div>
      <div className="hero-content">
        <div className="hero-copy">
          <h1 contentEditable suppressContentEditableWarning
              onBlur={e => onHeadlineChange(e.currentTarget.innerText)}>
            {renderHeadline()}
          </h1>
          <p contentEditable suppressContentEditableWarning
             onBlur={e => onSubheadChange(e.currentTarget.innerText)}>
            {subhead}
          </p>
          <div className="hero-cta-row">
            <span className={`hero-cta ${ctaShape}`} contentEditable suppressContentEditableWarning
              onBlur={e => onCtaPrimaryChange(e.currentTarget.innerText)}>
              {ctaPrimary}
            </span>
            <span className={`hero-cta ghost ${ctaShape}`} contentEditable suppressContentEditableWarning
              onBlur={e => onCtaSecondaryChange(e.currentTarget.innerText)}>
              {ctaSecondary}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;
