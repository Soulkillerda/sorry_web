import React, { useState } from 'react';
import { APOLOGY_CONFIG } from '../config';

interface ApologyPageProps {
  onContinue: () => void;
}

export const ApologyPage: React.FC<ApologyPageProps> = ({ onContinue }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClickContinue = () => {
    setIsExiting(true);
    setTimeout(() => {
      onContinue();
    }, 400); // 400ms matches screen-fade-out transition
  };

  return (
    <div className={`screen-container ${isExiting ? 'screen-fade-out' : 'screen-fade-in'}`}>
      <h1 className="serif-heading heading-lg">{APOLOGY_CONFIG.headerTitle}</h1>
      
      <div className="paper-card">
        <p className="paper-text">{APOLOGY_CONFIG.message}</p>
        {APOLOGY_CONFIG.signOff && (
          <p className="paper-signoff">{APOLOGY_CONFIG.signOff}</p>
        )}
      </div>

      <button 
        type="button"
        className="btn-primary"
        onClick={handleClickContinue}
        aria-label="Continue to next screen"
      >
        Continue →
      </button>
    </div>
  );
};

