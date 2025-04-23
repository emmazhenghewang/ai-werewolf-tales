
import React, { useState, useEffect } from 'react';
import { GameProvider, useGame } from '@/context/GameContext';
import PlayerList from '@/components/PlayerList';
import ChatBox from '@/components/ChatBox';
import GameControls from '@/components/GameControls';
import VotingPanel from '@/components/VotingPanel';
import GameSetup from '@/components/GameSetup';

// Game screen that will be wrapped with GameProvider
const GameScreen = () => {
  const { gameState } = useGame();
  const [nightMode, setNightMode] = useState(true);

  // Update night mode based on game phase
  useEffect(() => {
    setNightMode(gameState.phase === 'night' || gameState.phase === 'lobby');
  }, [gameState.phase]);

  // -- "Balatro" inspired layout --
  return (
    <div
      className={
        "min-h-screen w-full pt-6 pb-12 px-2 bg-balatro-bg-dark bg-balatro-radial"
      }
    >
      <div className="container mx-auto max-w-7xl">
        <header className="mt-2 mb-8">
          <h1 className="balatro-header text-center mb-3 animate-fade-in">
            Werewolf Tales
          </h1>
          <p className="balatro-subheader text-center">
            Moderation Suite
          </p>
          <div className="mx-auto text-center mt-2 px-4 inline-block balatro-card shadow-balatro">
            <span className="text-balatro-purple-tertiary font-bold uppercase text-xs tracking-widest">
              Moderator View &bull; Phase: {gameState.phase} {gameState.dayCount > 0 && `- Day ${gameState.dayCount}`}
            </span>
          </div>
        </header>
        {gameState.phase === 'lobby' ? (
          // Lobby view
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="balatro-panel animate-fade-in">
              <GameSetup />
            </div>
            <div className="balatro-panel animate-fade-in">
              <GameControls />
            </div>
          </div>
        ) : (
          // Main game panels
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 flex flex-col gap-6">
              <div className="balatro-panel animate-fade-in">
                <PlayerList />
              </div>
              <div className="balatro-panel animate-fade-in">
                <GameControls />
              </div>
              <div className="balatro-panel animate-fade-in">
                <VotingPanel />
              </div>
            </div>
            <div className="lg:col-span-3">
              <div className="balatro-panel h-[650px] animate-fade-in flex flex-col">
                <ChatBox />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Index component that provides the GameProvider context
const Index = () => {
  return (
    <GameProvider>
      <GameScreen />
    </GameProvider>
  );
};

export default Index;
