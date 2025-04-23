
import React, { useEffect } from 'react';
import { GameProvider, useGame } from '@/context/GameContext';
import PlayerList from '@/components/PlayerList';
import ChatBox from '@/components/ChatBox';
import GameControls from '@/components/GameControls';
import VotingPanel from '@/components/VotingPanel';
import GameSetup from '@/components/GameSetup';

const FloatingGameStatus = () => {
  const { gameState } = useGame();
  // Text to show in floating banner, e.g. "Game Status – Night 1"
  let phaseText = '';
  switch (gameState.phase) {
    case 'night':
      phaseText = `Game Status – Night ${gameState.dayCount}`;
      break;
    case 'day':
      phaseText = `Game Status – Day ${gameState.dayCount}`;
      break;
    case 'voting':
      phaseText = `Game Status – Voting`;
      break;
    case 'results':
      phaseText = `Game Status – Results`;
      break;
    case 'gameOver':
      phaseText = `Game Status – Game Over`;
      break;
    default:
      phaseText = '';
  }

  if (!phaseText) return null;
  return (
    <div
      className="fixed top-3 left-1/2 z-30 w-[320px] md:w-[400px] -translate-x-1/2 bg-mystic-yellow border-4 border-mystic-border shadow-game rounded-xl px-4 py-2 text-center
        font-display text-sm md:text-lg text-mystic-bg tracking-wide animate-fade-in glass-card"
      style={{ pointerEvents: 'none' }} // so it's non-interactive
    >
      {phaseText}
    </div>
  );
};

const GameScreen = () => {
  const { gameState } = useGame();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [gameState.phase]);

  return (
    <div className="min-h-screen w-full pt-section pb-section px-2 bg-mystic-bg bg-mystic-noise relative">
      <div className="container mx-auto max-w-[1160px] rounded-xl">
        {/* Header area */}
        <header className="flex flex-col gap-3 items-center justify-center mb-section">
          <div className="mb-1 mt-10">
            <h1 className="pixel-header">Werewolf Tales</h1>
          </div>
          {/* If in lobby, show "Moderator View | Lobby" */}
          {gameState.phase === 'lobby' && (
            <p className="pixel-subheader">Moderator View | Lobby</p>
          )}
        </header>

        {/* Game Setup is the ONLY visible panel in the lobby */}
        {gameState.phase === 'lobby' ? (
          <div className="w-full flex justify-center">
            <div className="pixel-panel animate-fade-in w-full max-w-[740px] xl:max-w-[880px]">
              <GameSetup />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-section">
            {/* Sidebar */}
            <div className="lg:col-span-1 flex flex-col gap-section">
              <div className="pixel-panel animate-fade-in">
                <PlayerList />
              </div>
              <div className="pixel-panel animate-fade-in">
                <GameControls />
              </div>
              <div className="pixel-panel animate-fade-in">
                <VotingPanel />
              </div>
            </div>
            {/* Main chat zone */}
            <div className="lg:col-span-3 flex min-h-[600px]">
              <div className="glass-card w-full h-full animate-fade-in flex flex-col min-h-[600px]">
                <ChatBox />
              </div>
            </div>
          </div>
        )}

        {/* Render a floating status banner for game phases after lobby */}
        {gameState.phase !== 'lobby' && <FloatingGameStatus />}
      </div>
    </div>
  );
};

const Index = () => {
  return (
    <GameProvider>
      <GameScreen />
    </GameProvider>
  );
};

export default Index;
