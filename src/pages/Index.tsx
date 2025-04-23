
import React, { useState, useEffect } from 'react';
import { GameProvider, useGame } from '@/context/GameContext';
import PlayerList from '@/components/PlayerList';
import ChatBox from '@/components/ChatBox';
import GameControls from '@/components/GameControls';
import VotingPanel from '@/components/VotingPanel';
import GameSetup from '@/components/GameSetup';

const GameScreen = () => {
  const { gameState } = useGame();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [gameState.phase]);

  return (
    <div className="min-h-screen w-full pt-section pb-section px-2 bg-mystic-bg bg-mystic-noise relative">
      <div className="container mx-auto max-w-[1160px] rounded-xl">
        {/* Header hero area */}
        <header className="flex flex-col gap-3 items-center justify-center mb-section">
          <div className="mb-1 mt-10">
            <h1 className="pixel-header">Werewolf Tales</h1>
          </div>
          <p className="pixel-subheader">Moderation Suite</p>
        </header>
        {/* Only GameSetup in lobby */}
        {gameState.phase === 'lobby' ? (
          <div className="w-full flex justify-center">
            <div className="pixel-panel animate-fade-in w-full max-w-[650px]">
              <GameSetup />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-section">
            {/* Sidebar with list/controls/voting */}
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
