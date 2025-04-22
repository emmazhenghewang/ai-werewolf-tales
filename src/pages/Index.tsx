
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

  return (
    <div className={`min-h-screen ${nightMode ? '' : 'day-mode'} transition-colors duration-1000`}>
      <div className="container mx-auto p-4">
        <header className="py-6 text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-parchment font-bold text-werewolf-accent mb-2">
            Werewolf Tales
          </h1>
          <p className="text-werewolf-secondary text-sm md:text-base italic mb-1">
            A game of deception, deduction, and survival
          </p>
          <p className="text-werewolf-accent text-xs md:text-sm font-bold">
            MODERATOR VIEW - All Player Information Visible
          </p>
        </header>
        
        {gameState.phase === 'lobby' ? (
          // Lobby view
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GameSetup />
            <GameControls />
          </div>
        ) : (
          // Game view
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <PlayerList />
              <GameControls />
              <VotingPanel />
            </div>
            <div className="lg:col-span-3 h-[600px]">
              <ChatBox />
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
