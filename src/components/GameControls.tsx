
import React from 'react';
import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Moon, Sun, Check, RotateCcw } from 'lucide-react';

const GameControls = () => {
  const { gameState, currentPlayer, advancePhase, resetGame } = useGame();

  // Only moderator can control game phases
  const isGameModerator = currentPlayer?.role === 'moderator';
  
  const renderPhaseButton = () => {
    if (!isGameModerator) return null;
    
    switch (gameState.phase) {
      case 'lobby':
        return (
          <Button 
            className="primary-button"
            onClick={() => advancePhase()}
          >
            <Moon className="h-4 w-4 mr-2" />
            Start Game
          </Button>
        );
      case 'night':
        return (
          <Button 
            className="accent-button"
            onClick={() => advancePhase()}
          >
            <Sun className="h-4 w-4 mr-2" />
            End Night / Start Day
          </Button>
        );
      case 'day':
        return (
          <Button 
            className="primary-button"
            onClick={() => advancePhase()}
          >
            <Check className="h-4 w-4 mr-2" />
            Begin Voting
          </Button>
        );
      case 'voting':
        return (
          <Button 
            className="primary-button"
            onClick={() => advancePhase()}
          >
            <Moon className="h-4 w-4 mr-2" />
            End Voting / Start Night
          </Button>
        );
      case 'results':
        return (
          <Button 
            className="accent-button"
            onClick={() => advancePhase()}
          >
            <Check className="h-4 w-4 mr-2" />
            Continue
          </Button>
        );
      case 'gameOver':
        return (
          <Button 
            className="secondary-button"
            onClick={() => resetGame()}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            New Game
          </Button>
        );
    }
  };

  const getGamePhaseDisplay = () => {
    switch (gameState.phase) {
      case 'lobby':
        return "Game Lobby";
      case 'night':
        return `Night ${gameState.dayCount}`;
      case 'day':
        return `Day ${gameState.dayCount}`;
      case 'voting':
        return `Day ${gameState.dayCount} - Voting`;
      case 'results':
        return "Results";
      case 'gameOver':
        return "Game Over";
    }
  };

  const getGameWinnerDisplay = () => {
    if (gameState.phase !== 'gameOver' || !gameState.winners) return null;
    
    return (
      <div className="text-center my-4">
        <div className={`text-xl font-bold ${gameState.winners === 'wolf' ? 'text-werewolf-blood' : 'text-werewolf-accent'}`}>
          {gameState.winners === 'wolf' ? 'The Werewolves' : 'The Villagers'} have won!
        </div>
      </div>
    );
  };

  return (
    <div className="border-medieval p-4 rounded-md">
      <h2 className="werewolf-header text-xl mb-2">Game Status</h2>
      
      <div className="flex justify-between items-center mb-4">
        <div className="font-bold text-werewolf-accent">{getGamePhaseDisplay()}</div>
        
        {isGameModerator && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-werewolf-darker border-werewolf-primary">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-werewolf-accent">Reset Game?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset the game to the lobby state. All progress will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-werewolf-secondary text-werewolf-darker hover:bg-werewolf-secondary/80">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-werewolf-blood text-werewolf-parchment hover:bg-werewolf-blood/80"
                  onClick={resetGame}
                >
                  Reset Game
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      
      {getGameWinnerDisplay()}
      
      <div className="flex justify-center">
        {renderPhaseButton()}
      </div>
    </div>
  );
};

export default GameControls;
