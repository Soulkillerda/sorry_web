import React, { useState } from 'react';
import { ApologyPage } from './pages/ApologyPage';
import { TrucePage } from './pages/TrucePage';
import { ConfirmationPage } from './pages/ConfirmationPage';
import { CatRunner } from './pages/CatRunner';

type ScreenStep = 1 | 2 | 3 | 4;

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenStep>(1);

  return (
    <main className="app-viewport">
      {currentScreen === 1 && (
        <ApologyPage onContinue={() => setCurrentScreen(2)} />
      )}

      {currentScreen === 2 && (
        <TrucePage onYes={() => setCurrentScreen(3)} />
      )}

      {currentScreen === 3 && (
        <ConfirmationPage onNext={() => setCurrentScreen(4)} />
      )}

      {currentScreen === 4 && (
        <CatRunner onBackToStart={() => setCurrentScreen(1)} />
      )}
    </main>
  );
}

