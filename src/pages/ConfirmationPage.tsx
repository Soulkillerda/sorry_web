import React, { useState, useEffect, useRef } from 'react';
import { APOLOGY_CONFIG } from '../config';

interface ConfirmationPageProps {
  onNext: () => void;
}

export const ConfirmationPage: React.FC<ConfirmationPageProps> = ({ onNext }) => {
  const [isExiting, setIsExiting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Subtle, tasteful celebration particles with warm aesthetic colors
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    // Elegant palette of powder blue, blush rose, and dusk slate
    const colors = ['#8faecc', '#b4cbe4', '#f0c4cf', '#e4a8b6', '#364d68', '#d6b8c8'];
    
    // Set canvas dimensions
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create 35 minimal particles (tasteful and delicate, not an overwhelming explosion)
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      rotation: number;
      vRot: number;
      opacity: number;
      shape: 'rect' | 'circle';
    }

    const particles: Particle[] = [];
    const count = 40;
    const startX = window.innerWidth / 2;
    const startY = window.innerHeight * 0.45;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.5;
      particles.push({
        x: startX + (Math.random() - 0.5) * 60,
        y: startY + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.5, // slight upward burst
        size: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.08,
        opacity: 0.95,
        shape: Math.random() > 0.4 ? 'rect' : 'circle'
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // gentle gravity
        p.vx *= 0.985; // drag
        p.rotation += p.vRot;
        p.opacity = Math.max(0, p.opacity - 0.007);

        if (p.opacity > 0) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;

          if (p.shape === 'rect') {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.6);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleNextClick = () => {
    setIsExiting(true);
    setTimeout(() => {
      onNext();
    }, 400);
  };

  return (
    <>
      {/* Background celebration particle canvas */}
      <canvas 
        ref={canvasRef} 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1
        }} 
      />

      <div className={`screen-container ${isExiting ? 'screen-fade-out' : 'screen-fade-in'}`}>
        <div className="confirmation-box">
          <div className="check-icon-circle">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>

          <h1 className="serif-heading heading-md">
            {APOLOGY_CONFIG.confirmation.title}
          </h1>
          <p className="subtitle" style={{ marginBottom: '1.75rem' }}>
            {APOLOGY_CONFIG.confirmation.subtitle}
          </p>

          <button 
            type="button"
            className="btn-primary"
            onClick={handleNextClick}
            aria-label="Continue to final screen"
          >
            {APOLOGY_CONFIG.confirmation.buttonText} →
          </button>
        </div>
      </div>
    </>
  );
};

