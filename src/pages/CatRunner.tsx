import React, { useRef, useEffect, useState, useCallback } from 'react';
import { APOLOGY_CONFIG } from '../config';

interface CatRunnerProps {
  onBackToStart?: () => void;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'box' | 'plant' | 'rock';
}

interface BackgroundCloud {
  x: number;
  y: number;
  speed: number;
  width: number;
}

interface DustParticle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  vx: number;
  vy: number;
}

export const CatRunner: React.FC<CatRunnerProps> = ({ onBackToStart }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('alittle_cat_best') || '0', 10);
    } catch {
      return 0;
    }
  });
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Mutable game physics & state refs
  const stateRef = useRef({
    catX: 70,
    catY: 0,
    catVy: 0,
    catWidth: 46,
    catHeight: 32,
    isGrounded: true,
    runFrame: 0,
    frameTimer: 0,
    groundY: 0,
    gameSpeed: 3.0, // starts gentle and comfortable
    score: 0,
    distanceSinceLastObstacle: 0,
    obstacles: [] as Obstacle[],
    clouds: [] as BackgroundCloud[],
    dust: [] as DustParticle[],
    gameOver: false,
    groundOffset: 0
  });

  // Jump action - calibrated to give a low, snappy, grounded hop
  const jump = useCallback(() => {
    const s = stateRef.current;
    if (s.gameOver) return;
    if (s.isGrounded) {
      s.catVy = -5.8; // low, agile hop (clears low obstacles without soaring)
      s.isGrounded = false;

      // spawn little jump dust
      for (let i = 0; i < 3; i++) {
        s.dust.push({
          x: s.catX + 8 + Math.random() * 12,
          y: s.groundY - 4,
          size: Math.random() * 2.5 + 1.5,
          opacity: 0.6,
          vx: -(Math.random() * 1.5 + 1),
          vy: -(Math.random() * 1.0 + 0.2)
        });
      }
    }
  }, []);

  // Restart action
  const restartGame = useCallback(() => {
    const s = stateRef.current;
    s.obstacles = [];
    s.dust = [];
    s.catVy = 0;
    s.score = 0;
    s.gameSpeed = 3.0;
    s.distanceSinceLastObstacle = 0;
    s.gameOver = false;
    s.isGrounded = true;
    s.catY = s.groundY - s.catHeight;
    setIsGameOver(false);
    setIsPlaying(true);
    setScore(0);
  }, []);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (stateRef.current.gameOver) {
          restartGame();
        } else {
          jump();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump, restartGame]);

  // Main game loop & Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let isTabVisible = true;

    // Responsive canvas dimension syncing
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const logicalHeight = rect.height;
      const groundY = logicalHeight - 38;
      stateRef.current.groundY = groundY;

      if (stateRef.current.isGrounded) {
        stateRef.current.catY = groundY - stateRef.current.catHeight;
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Initial background clouds
    stateRef.current.clouds = [
      { x: 40, y: 30, speed: 0.4, width: 50 },
      { x: 260, y: 48, speed: 0.3, width: 66 },
      { x: 490, y: 26, speed: 0.35, width: 56 }
    ];

    // Visibility change handling
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // ==============================================================
    // DRAW ADORABLE DETAILED PIXEL-ART CAT
    // ==============================================================
    const drawCat = (x: number, y: number, frame: number, isJumping: boolean, isDead: boolean) => {
      ctx.save();
      const px = 2.4; // pixel unit size
      
      // Warm Ginger Calico palette
      const cOutline = '#633314';  // rich chestnut outline
      const cCoat = '#c76e33';     // warm ginger coat
      const cHighlight = '#e48a4d';// golden highlight fur
      const cWhite = '#fffaf2';    // fluffy white chest, muzzle & socks
      const cPink = '#f2a099';     // sweet pink ears & nose
      const cEye = '#2b1406';      // cute dark eye
      const cCheek = '#f2b5a5';    // soft blush

      ctx.translate(Math.round(x), Math.round(y));

      // Running bob motion
      const bobY = (!isJumping && !isDead && frame === 1) ? 2 : 0;
      ctx.translate(0, bobY);

      // --- TAIL ---
      ctx.fillStyle = cCoat;
      if (isJumping) {
        // Streamlined flying tail
        ctx.fillRect(-3 * px, 4 * px, 4 * px, 2 * px);
        ctx.fillRect(-5 * px, 2 * px, 3 * px, 2 * px);
        ctx.fillRect(-7 * px, 1 * px, 3 * px, 2 * px);
      } else if (frame === 0) {
        // High curved tail
        ctx.fillRect(0 * px, 3 * px, 3 * px, 2 * px);
        ctx.fillRect(-2 * px, 1 * px, 2 * px, 3 * px);
        ctx.fillRect(-2 * px, -1 * px, 2 * px, 2 * px);
        ctx.fillRect(-1 * px, -2 * px, 2 * px, 2 * px);
      } else if (frame === 1) {
        // Mid-swish tail
        ctx.fillRect(0 * px, 4 * px, 3 * px, 2 * px);
        ctx.fillRect(-2 * px, 2 * px, 3 * px, 2 * px);
        ctx.fillRect(-4 * px, 1 * px, 3 * px, 2 * px);
      } else {
        // Low waving tail
        ctx.fillRect(0 * px, 4 * px, 3 * px, 2 * px);
        ctx.fillRect(-3 * px, 3 * px, 3 * px, 2 * px);
        ctx.fillRect(-4 * px, 1 * px, 2 * px, 2 * px);
      }

      // --- MAIN BODY ---
      // Base coat block
      ctx.fillStyle = cCoat;
      ctx.fillRect(2 * px, 3 * px, 10 * px, 7 * px);

      // Fluffy golden back highlight
      ctx.fillStyle = cHighlight;
      ctx.fillRect(3 * px, 3 * px, 8 * px, 2 * px);

      // White underbelly / chest
      ctx.fillStyle = cWhite;
      ctx.fillRect(7 * px, 6 * px, 5 * px, 4 * px);
      ctx.fillRect(9 * px, 5 * px, 3 * px, 3 * px);

      // --- HEAD ---
      ctx.fillStyle = cCoat;
      ctx.fillRect(9 * px, 1 * px, 7 * px, 6 * px);

      // Golden head top highlight
      ctx.fillStyle = cHighlight;
      ctx.fillRect(10 * px, 1 * px, 5 * px, 1 * px);

      // Ears (Pointed ears with pink insides)
      // Left ear
      ctx.fillStyle = cCoat;
      ctx.fillRect(10 * px, -2 * px, 2 * px, 3 * px);
      ctx.fillStyle = cPink;
      ctx.fillRect(10.5 * px, -1 * px, 1 * px, 2 * px);

      // Right ear
      ctx.fillStyle = cCoat;
      ctx.fillRect(14 * px, -1 * px, 2 * px, 2 * px);
      ctx.fillStyle = cPink;
      ctx.fillRect(14.5 * px, 0 * px, 1 * px, 1 * px);

      // White Muzzle
      ctx.fillStyle = cWhite;
      ctx.fillRect(12 * px, 4 * px, 4 * px, 3 * px);

      // Tiny sweet pink nose
      ctx.fillStyle = cPink;
      ctx.fillRect(15 * px, 4 * px, 1.2 * px, 1 * px);

      // Cute cheeks blush
      ctx.fillStyle = cCheek;
      ctx.fillRect(11 * px, 5 * px, 1.5 * px, 1 * px);

      // Whisker hints
      ctx.fillStyle = cOutline;
      ctx.fillRect(16 * px, 4.5 * px, 1.5 * px, 0.6 * px);
      ctx.fillRect(16 * px, 5.5 * px, 1.5 * px, 0.6 * px);

      // --- EYE ---
      if (isDead) {
        // Playful cute dizzy eye ">"
        ctx.strokeStyle = cEye;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(12 * px, 2 * px);
        ctx.lineTo(14 * px, 3 * px);
        ctx.lineTo(12 * px, 4 * px);
        ctx.stroke();
      } else {
        // Big round sparkling eye
        ctx.fillStyle = cEye;
        ctx.fillRect(12.5 * px, 2 * px, 2 * px, 2.2 * px);
        // Sparkle catchlight in eye!
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(13.2 * px, 2 * px, 1 * px, 1 * px);
      }

      // --- PAWS & SOCKS ---
      if (isJumping) {
        // Leaping forward paws
        ctx.fillStyle = cCoat;
        ctx.fillRect(11 * px, 9 * px, 3 * px, 2 * px);
        ctx.fillStyle = cWhite; // front white socks
        ctx.fillRect(13 * px, 9 * px, 2 * px, 2 * px);

        // Back paws tucked
        ctx.fillStyle = cCoat;
        ctx.fillRect(2 * px, 8 * px, 3 * px, 2 * px);
        ctx.fillStyle = cWhite;
        ctx.fillRect(1 * px, 8 * px, 2 * px, 2 * px);
      } else if (frame === 0) {
        // Stride A: Front paw extended, back paw trailing
        // Front leg
        ctx.fillStyle = cCoat;
        ctx.fillRect(10 * px, 9 * px, 2 * px, 3 * px);
        ctx.fillStyle = cWhite;
        ctx.fillRect(11 * px, 11 * px, 2 * px, 2 * px);

        // Back leg
        ctx.fillStyle = cCoat;
        ctx.fillRect(3 * px, 9 * px, 2 * px, 3 * px);
        ctx.fillStyle = cWhite;
        ctx.fillRect(2 * px, 11 * px, 2 * px, 2 * px);
      } else if (frame === 1) {
        // Stride B: Paws together / mid-stride
        ctx.fillStyle = cCoat;
        ctx.fillRect(5 * px, 9 * px, 2.5 * px, 3 * px);
        ctx.fillRect(9 * px, 9 * px, 2.5 * px, 3 * px);
        ctx.fillStyle = cWhite;
        ctx.fillRect(5 * px, 11 * px, 2.5 * px, 1.5 * px);
        ctx.fillRect(9 * px, 11 * px, 2.5 * px, 1.5 * px);
      } else {
        // Stride C: Front paw tucked, back paw pushing off
        // Front leg
        ctx.fillStyle = cCoat;
        ctx.fillRect(8 * px, 9 * px, 2 * px, 3 * px);
        ctx.fillStyle = cWhite;
        ctx.fillRect(8 * px, 11 * px, 2 * px, 2 * px);

        // Back leg kicking back
        ctx.fillStyle = cCoat;
        ctx.fillRect(2 * px, 9 * px, 3 * px, 2 * px);
        ctx.fillStyle = cWhite;
        ctx.fillRect(0 * px, 10 * px, 2 * px, 2 * px);
      }

      ctx.restore();
    };

    // ==============================================================
    // DRAW FAIR, CLEAN, DELICATE OBSTACLES
    // ==============================================================
    const drawObstacle = (obs: Obstacle) => {
      ctx.save();
      const x = Math.round(obs.x);
      const y = Math.round(obs.y);
      const w = obs.width;
      const h = obs.height;

      if (obs.type === 'plant') {
        // Small Terracotta Succulent Plant
        const potHeight = Math.round(h * 0.58);
        const potY = y + (h - potHeight);
        
        // Clay pot
        ctx.fillStyle = '#b8664b';
        ctx.fillRect(x + 3, potY, w - 6, potHeight);
        ctx.fillStyle = '#d27c62';
        ctx.fillRect(x + 1, potY, w - 2, 3); // Pot rim

        // Succulent leaf sprouts
        ctx.fillStyle = '#5b7a54';
        ctx.fillRect(x + 4, y + 2, 4, potY - y);
        ctx.fillRect(x + w - 8, y + 3, 4, potY - y);
        ctx.fillStyle = '#7a9d71';
        ctx.fillRect(x + w / 2 - 3, y, 6, potY - y + 2);
      } else if (obs.type === 'rock') {
        // Smooth garden pebble / rock
        ctx.fillStyle = '#787068';
        ctx.beginPath();
        ctx.roundRect(x, y + 2, w, h - 2, [5, 6, 2, 2]);
        ctx.fill();
        ctx.fillStyle = '#9c938a';
        ctx.fillRect(x + 3, y + 4, w - 7, 2.5);
      } else {
        // Small wooden tea crate
        ctx.fillStyle = '#8f6848';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#735034';
        ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
        ctx.fillStyle = '#ab8563';
        // Cross trim
        ctx.fillRect(x + 3, y + 3, w - 6, 2);
        ctx.fillRect(x + 3, y + h - 5, w - 6, 2);
      }

      ctx.restore();
    };

    // Game loop
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const s = stateRef.current;
      const rect = canvas.getBoundingClientRect();
      const logicalWidth = rect.width;
      const logicalHeight = rect.height;

      if (isTabVisible && !s.gameOver) {
        // Physics update: Cat with snappy, low hop arc
        s.catVy += 34 * dt; // quick, grounded gravity
        s.catY += s.catVy;

        const floorY = s.groundY - s.catHeight;
        if (s.catY >= floorY) {
          s.catY = floorY;
          s.catVy = 0;
          s.isGrounded = true;
        }

        // Cat run animation frame cycle
        s.frameTimer += dt;
        if (s.frameTimer > 0.085) {
          s.runFrame = (s.runFrame + 1) % 3;
          s.frameTimer = 0;

          // Spawn little running dust puff behind cat when on ground
          if (s.isGrounded && Math.random() < 0.6) {
            s.dust.push({
              x: s.catX + 4,
              y: s.groundY - 3,
              size: Math.random() * 2.5 + 1.5,
              opacity: 0.55,
              vx: -(s.gameSpeed * 0.7 + Math.random()),
              vy: -(Math.random() * 0.4 + 0.1)
            });
          }
        }

        // Speed builds up very gently
        s.gameSpeed = Math.min(6.5, 3.0 + Math.floor(s.score / 200) * 0.2);

        // Ground scrolling
        s.groundOffset = (s.groundOffset + s.gameSpeed) % 24;

        // Clouds movement
        s.clouds.forEach(cloud => {
          cloud.x -= cloud.speed;
          if (cloud.x + cloud.width < 0) {
            cloud.x = logicalWidth + 20;
            cloud.y = Math.random() * 50 + 20;
          }
        });

        // Dust particle updates
        for (let i = s.dust.length - 1; i >= 0; i--) {
          const d = s.dust[i];
          d.x += d.vx;
          d.y += d.vy;
          d.opacity -= 0.03;
          if (d.opacity <= 0) {
            s.dust.splice(i, 1);
          }
        }

        // --- OBSTACLE SPAWNING (Generous & Fair spacing) ---
        s.distanceSinceLastObstacle += s.gameSpeed;
        const minGap = 340 + s.gameSpeed * 22;
        
        if (s.distanceSinceLastObstacle > minGap && Math.random() < 0.025) {
          const types: ('box' | 'plant' | 'rock')[] = ['plant', 'rock', 'box'];
          const type = types[Math.floor(Math.random() * types.length)];
          
          // Low obstacles designed to be hopped over smoothly
          let w = 18;
          let h = 14;
          if (type === 'plant') {
            w = 16;
            h = 16; // petite succulent
          } else if (type === 'rock') {
            w = 18;
            h = 11; // low garden pebble
          } else {
            w = 16;
            h = 13; // small crate
          }

          s.obstacles.push({
            x: logicalWidth + 20,
            y: s.groundY - h,
            width: w,
            height: h,
            type
          });
          s.distanceSinceLastObstacle = 0;
        }

        // --- UPDATE OBSTACLES & FORGIVING HITBOX DETECTION ---
        for (let i = s.obstacles.length - 1; i >= 0; i--) {
          const obs = s.obstacles[i];
          obs.x -= s.gameSpeed;

          // Generously inset hitboxes: no cheap accidental deaths
          const catHitbox = {
            left: s.catX + 11,
            right: s.catX + s.catWidth - 11,
            top: s.catY + 8,
            bottom: s.catY + s.catHeight - 4 // grazing paws does NOT cause a hit
          };

          const obsHitbox = {
            left: obs.x + 5,
            right: obs.x + obs.width - 5,
            top: obs.y + 5,
            bottom: obs.y + obs.height
          };

          const isColliding =
            catHitbox.left < obsHitbox.right &&
            catHitbox.right > obsHitbox.left &&
            catHitbox.top < obsHitbox.bottom &&
            catHitbox.bottom > obsHitbox.top;

          if (isColliding) {
            s.gameOver = true;
            setIsGameOver(true);
            setIsPlaying(false);
            setHighScore(prev => {
              const best = Math.max(prev, s.score);
              try {
                localStorage.setItem('alittle_cat_best', best.toString());
              } catch {
                // ignore storage issues
              }
              return best;
            });
            break;
          }

          // Cull passed obstacles
          if (obs.x + obs.width < -20) {
            s.obstacles.splice(i, 1);
          }
        }

        // Increment score
        s.score += 1;
        setScore(s.score);
      }

      // ==============================================================
      // RENDERING CANVAS
      // ==============================================================
      ctx.clearRect(0, 0, logicalWidth, logicalHeight);

      // Soft misty morning sky background
      ctx.fillStyle = '#f4f6fa';
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);

      // Subtle atmospheric clouds
      ctx.fillStyle = 'rgba(182, 204, 228, 0.45)';
      s.clouds.forEach(c => {
        ctx.beginPath();
        ctx.roundRect(c.x, c.y, c.width, 14, 7);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(c.x + 8, c.y - 7, c.width * 0.52, 12, 6);
        ctx.fill();
      });

      // Twilight slate ground line
      ctx.strokeStyle = '#364d68';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, s.groundY);
      ctx.lineTo(logicalWidth, s.groundY);
      ctx.stroke();

      // Muted pattern under ground
      ctx.fillStyle = '#c5d3e3';
      for (let gx = -s.groundOffset; gx < logicalWidth; gx += 28) {
        ctx.fillRect(gx, s.groundY + 8, 3, 2);
        ctx.fillRect(gx + 12, s.groundY + 16, 2, 2);
      }

      // Draw dust particles
      s.dust.forEach(d => {
        ctx.fillStyle = `rgba(168, 188, 208, ${d.opacity})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Obstacles
      s.obstacles.forEach(drawObstacle);

      // Draw Upgraded Cute Cat
      drawCat(s.catX, s.catY, s.runFrame, !s.isGrounded, s.gameOver);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', updateCanvasSize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="screen-container screen-fade-in game-wrapper">
      <h1 className="serif-heading heading-lg">{APOLOGY_CONFIG.game.title}</h1>
      <p className="subtitle" style={{ marginBottom: '0.75rem' }}>
        {APOLOGY_CONFIG.game.subtitle}
      </p>

      {/* Canvas container card */}
      <div 
        className="game-canvas-card"
        onClick={() => {
          if (isGameOver) {
            restartGame();
          } else {
            jump();
          }
        }}
      >
        <canvas ref={canvasRef} className="game-canvas" />

        {/* HUD Score */}
        <div className="game-ui-overlay">
          <span>SCORE {score.toString().padStart(5, '0')}</span>
          <span>BEST {highScore.toString().padStart(5, '0')}</span>
        </div>

        {/* Game Over Modal overlay */}
        {isGameOver && (
          <div className="game-over-overlay">
            <h2 className="serif-heading heading-md" style={{ marginBottom: '0.35rem' }}>
              Nice run! 🐾
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              You made it to a score of <strong>{score}</strong>.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={(e) => {
                e.stopPropagation();
                restartGame();
              }}
              aria-label="Restart the game"
            >
              Play Again ↺
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="game-instructions">
        <span>Controls:</span>
        <span className="instruction-badge">SPACE</span>
        <span className="instruction-badge">▲ ARROW</span>
        <span className="instruction-badge">TAP TO JUMP</span>
      </div>

      {/* Visible mobile jump button */}
      <button 
        type="button" 
        className="mobile-jump-btn"
        onTouchStart={(e) => {
          e.preventDefault();
          if (isGameOver) restartGame();
          else jump();
        }}
        onClick={() => {
          if (isGameOver) restartGame();
          else jump();
        }}
      >
        TAP TO JUMP 🐾
      </button>

      {onBackToStart && (
        <button
          type="button"
          onClick={onBackToStart}
          style={{
            marginTop: '1.5rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-faint)',
            fontSize: '0.85rem',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Read note again
        </button>
      )}
    </div>
  );
};
