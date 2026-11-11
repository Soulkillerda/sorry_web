import React, { useState, useRef, useEffect, useCallback } from 'react';
import { APOLOGY_CONFIG } from '../config';

interface TrucePageProps {
  onYes: () => void;
}

export const TrucePage: React.FC<TrucePageProps> = ({ onYes }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [noPosition, setNoPosition] = useState<{ x: number; y: number }>({ x: 90, y: 0 });
  const [hasMovedOnce, setHasMovedOnce] = useState(false);
  const [bubbleText, setBubbleText] = useState<string | null>(null);
  const [subtleNotice, setSubtleNotice] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const yesButtonRef = useRef<HTMLButtonElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const lastMoveTimeRef = useRef<number>(0);
  const bubbleTimerRef = useRef<number | null>(null);

  // Pick a random playful message
  const triggerPlayfulMessage = useCallback(() => {
    const list = APOLOGY_CONFIG.evasiveMessages;
    const msg = list[Math.floor(Math.random() * list.length)];
    setBubbleText(msg);

    if (bubbleTimerRef.current) {
      window.clearTimeout(bubbleTimerRef.current);
    }
    bubbleTimerRef.current = window.setTimeout(() => {
      setBubbleText(null);
    }, 1400);
  }, []);

  // Compute a new random position that does NOT collide with the YES button and stays in bounds
  const moveNoButton = useCallback(() => {
    const now = Date.now();
    if (now - lastMoveTimeRef.current < 180) return;
    lastMoveTimeRef.current = now;

    const container = containerRef.current;
    const yesBtn = yesButtonRef.current;
    const anchor = anchorRef.current;
    if (!container || !yesBtn || !anchor) return;

    const cRect = container.getBoundingClientRect();
    const yesRect = yesBtn.getBoundingClientRect();
    const noWidth = 105;
    const noHeight = 44;

    const yesRelX = yesRect.left - cRect.left;
    const yesRelY = yesRect.top - cRect.top;
    const safeMargin = 40; // buffer around YES button

    // Safe bounds within container with generous padding
    const paddingX = 20;
    const paddingTop = 45; // extra space for tooltip bubble above
    const paddingBottom = 20;

    const minX = paddingX;
    const maxX = cRect.width - noWidth - paddingX;
    const minY = paddingTop;
    const maxY = cRect.height - noHeight - paddingBottom;

    if (maxX <= minX || maxY <= minY) return;

    let targetX = 0;
    let targetY = 0;
    let found = false;

    // Try up to 30 random candidate spots
    for (let i = 0; i < 30; i++) {
      const candidateX = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
      const candidateY = Math.floor(Math.random() * (maxY - minY + 1)) + minY;

      const overlapsYes =
        candidateX < (yesRelX + yesRect.width + safeMargin) &&
        (candidateX + noWidth) > (yesRelX - safeMargin) &&
        candidateY < (yesRelY + yesRect.height + safeMargin) &&
        (candidateY + noHeight) > (yesRelY - safeMargin);

      if (!overlapsYes) {
        targetX = candidateX;
        targetY = candidateY;
        found = true;
        break;
      }
    }

    if (!found) {
      targetX = yesRelX > cRect.width / 2 ? minX + 10 : maxX - 10;
      targetY = yesRelY > cRect.height / 2 ? minY + 10 : maxY - 10;
    }

    setNoPosition({ x: targetX, y: targetY });
    setHasMovedOnce(true);
    triggerPlayfulMessage();
  }, [triggerPlayfulMessage]);

  // Proximity detection for mouse cursor
  const handleMouseMoveContainer = (e: React.MouseEvent<HTMLDivElement>) => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const noRect = anchor.getBoundingClientRect();
    const noCenterX = noRect.left + noRect.width / 2;
    const noCenterY = noRect.top + noRect.height / 2;

    const dist = Math.hypot(e.clientX - noCenterX, e.clientY - noCenterY);
    // If cursor comes within 90px, dodge away!
    if (dist < 90) {
      moveNoButton();
    }
  };

  // Touch on mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    moveNoButton();
  };

  // If user somehow manages to click NO
  const handleNoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSubtleNotice(APOLOGY_CONFIG.noSelectedMessage);
  };

  const handleYesClick = () => {
    setIsExiting(true);
    setTimeout(() => {
      onYes();
    }, 400);
  };

  // Set initial position relative to container once mounted
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const cRect = container.getBoundingClientRect();
      setNoPosition({
        x: Math.min(cRect.width - 125, cRect.width / 2 + 75),
        y: cRect.height / 2 - 22
      });
    }
  }, []);

  return (
    <div className={`screen-container ${isExiting ? 'screen-fade-out' : 'screen-fade-in'}`}>
      <span className="serif-heading heading-sm">Okay, one last thing...</span>
      <h1 className="serif-heading heading-lg" style={{ marginTop: '0.25rem' }}>Truce?</h1>
      <p className="subtitle">Can uhh plss accept my follow request ?? </p>

      {/* Interactive area where NO button moves freely and avoids YES */}
      <div
        ref={containerRef}
        className="truce-interaction-area"
        onMouseMove={handleMouseMoveContainer}
      >
        <button
          ref={yesButtonRef}
          type="button"
          className="btn-yes"
          onClick={handleYesClick}
          aria-label="Accept truce"
        >
          YES !!
        </button>

        {/* Evasive Anchor holds both the NO button and the speech bubble perfectly synced */}
        <div
          ref={anchorRef}
          className="evasive-anchor"
          style={{
            transform: `translate(${noPosition.x}px, ${noPosition.y}px)`
          }}
        >
          {bubbleText && hasMovedOnce && (
            <div className="playful-bubble-tooltip">
              {bubbleText}
              <div className="bubble-arrow" />
            </div>
          )}

          <button
            type="button"
            className="btn-no-evasive"
            onMouseEnter={moveNoButton}
            onTouchStart={handleTouchStart}
            onClick={handleNoClick}
            aria-label="Decline truce"
          >
            NO :(
          </button>
        </div>
      </div>

      <div className="subtle-notice-container" role="status" aria-live="polite">
        {subtleNotice && (
          <div className="subtle-notice-pill">
            <span>🌸</span>
            <span>{subtleNotice}</span>
          </div>
        )}
      </div>
    </div>
  );
};
