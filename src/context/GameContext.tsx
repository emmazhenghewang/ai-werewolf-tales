
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ActionType, ChatMessage, ChatMessageType, GamePhase, GameState, Player, PlayerRole, VoteAction } from '@/types/game';
import { useToast } from '@/components/ui/use-toast';

type GameContextType = {
  gameState: GameState;
  currentPlayer: Player | null;
  startGame: () => void;
  resetGame: () => void;
  setPlayers: (players: Player[]) => void;
  addPlayer: (name: string, isAI: boolean) => void;
  removePlayer: (id: string) => void;
  sendMessage: (content: string, type: ChatMessageType) => void;
  castVote: (targetId: string, actionType: ActionType) => void;
  advancePhase: () => void;
  determineWinners: () => PlayerRole | null;
  isActionAllowed: (playerId: string, actionType: ActionType) => boolean;
  getAlivePlayersWithRole: (role: PlayerRole) => Player[];
  getAlivePlayersWithoutRole: (role: PlayerRole) => Player[];
  getActiveChannel: () => 'village' | 'wolf';
};

const initialNightActions = {
  wolfKill: null,
  seerReveal: null,
  witchSave: null,
  witchKill: null,
  hunterTarget: null,
};

const initialGameState: GameState = {
  gameId: uuidv4(),
  phase: 'lobby',
  players: [],
  messages: {
    village: [],
    wolf: [],
  },
  votes: [],
  dayCount: 0,
  nightActions: { ...initialNightActions },
  winners: null,
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const { toast } = useToast();

  const addSystemMessage = (content: string, type: ChatMessageType = 'system') => {
    const systemMessage: ChatMessage = {
      id: uuidv4(),
      senderId: 'system',
      senderName: 'System',
      content,
      timestamp: Date.now(),
      type,
    };

    setGameState(prev => ({
      ...prev,
      messages: {
        ...prev.messages,
        village: type === 'wolf' ? prev.messages.village : [...prev.messages.village, systemMessage],
        wolf: type === 'wolf' ? [...prev.messages.wolf, systemMessage] : prev.messages.wolf,
      },
    }));
  };

  const startGame = () => {
    if (gameState.players.length < 3) {
      toast({
        title: "Not enough players",
        description: "You need at least 3 players to start the game.",
        variant: "destructive",
      });
      return;
    }

    // Check if we have a moderator
    const hasModerator = gameState.players.some(p => p.role === 'moderator');
    if (!hasModerator) {
      toast({
        title: "No moderator",
        description: "You need a moderator to start the game.",
        variant: "destructive",
      });
      return;
    }
    
    setGameState(prev => ({
      ...prev,
      phase: 'night',
      dayCount: 1,
    }));
    
    addSystemMessage("The game has begun! The village falls into a deep slumber as night descends...", 'moderator');
    addSystemMessage("Wolves, choose your victim...", 'wolf');
  };

  const resetGame = () => {
    setGameState({
      ...initialGameState,
      gameId: uuidv4(),
    });
    setCurrentPlayer(null);
  };

  const setPlayers = (players: Player[]) => {
    setGameState(prev => ({
      ...prev,
      players,
    }));
  };

  const addPlayer = (name: string, isAI: boolean = false) => {
    const newPlayer: Player = {
      id: uuidv4(),
      name,
      role: 'villager', // Default role
      status: 'alive',
      isAI,
    };

    setGameState(prev => ({
      ...prev,
      players: [...prev.players, newPlayer],
    }));

    if (!currentPlayer && !isAI) {
      setCurrentPlayer(newPlayer);
    }
  };

  const removePlayer = (id: string) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.filter(p => p.id !== id),
    }));

    if (currentPlayer?.id === id) {
      setCurrentPlayer(null);
    }
  };

  const sendMessage = (content: string, type: ChatMessageType) => {
    if (!currentPlayer) return;

    const newMessage: ChatMessage = {
      id: uuidv4(),
      senderId: currentPlayer.id,
      senderName: currentPlayer.name,
      content,
      timestamp: Date.now(),
      type,
    };

    setGameState(prev => ({
      ...prev,
      messages: {
        ...prev.messages,
        village: type === 'village' || type === 'moderator' 
          ? [...prev.messages.village, newMessage]
          : prev.messages.village,
        wolf: type === 'wolf' 
          ? [...prev.messages.wolf, newMessage]
          : prev.messages.wolf,
      },
    }));
  };

  const castVote = (targetId: string, actionType: ActionType) => {
    if (!currentPlayer) return;

    const newVote: VoteAction = {
      voterId: currentPlayer.id,
      targetId,
      actionType,
    };

    // Remove any existing votes from this player for this action type
    const filteredVotes = gameState.votes.filter(
      v => !(v.voterId === currentPlayer.id && v.actionType === actionType)
    );

    setGameState(prev => ({
      ...prev,
      votes: [...filteredVotes, newVote],
    }));

    // If it's a night action, record it
    if (gameState.phase === 'night') {
      switch (actionType) {
        case 'wolfKill':
          setGameState(prev => ({
            ...prev,
            nightActions: { ...prev.nightActions, wolfKill: targetId },
          }));
          break;
        case 'seerReveal':
          setGameState(prev => ({
            ...prev,
            nightActions: { ...prev.nightActions, seerReveal: targetId },
          }));
          break;
        case 'witchSave':
          setGameState(prev => ({
            ...prev,
            nightActions: { ...prev.nightActions, witchSave: targetId },
          }));
          break;
        case 'witchKill':
          setGameState(prev => ({
            ...prev,
            nightActions: { ...prev.nightActions, witchKill: targetId },
          }));
          break;
        case 'hunterShoot':
          setGameState(prev => ({
            ...prev,
            nightActions: { ...prev.nightActions, hunterTarget: targetId },
          }));
          break;
      }
    }
  };

  const advancePhase = () => {
    switch (gameState.phase) {
      case 'lobby':
        startGame();
        break;
      case 'night':
        // Process night actions
        processNightActions();
        setGameState(prev => ({
          ...prev,
          phase: 'day',
          votes: [],
        }));
        addSystemMessage("Dawn breaks over the village. The villagers wake to discover the events of the night...", 'moderator');
        break;
      case 'day':
        setGameState(prev => ({
          ...prev,
          phase: 'voting',
        }));
        addSystemMessage("It's time to vote! Who do you suspect is a werewolf?", 'moderator');
        break;
      case 'voting':
        // Process day voting
        processDayVoting();
        setGameState(prev => ({
          ...prev,
          phase: 'night',
          dayCount: prev.dayCount + 1,
          votes: [],
          nightActions: { ...initialNightActions },
        }));
        addSystemMessage("Night falls once more. The village sleeps, uneasy with the knowledge that wolves walk among them...", 'moderator');
        addSystemMessage("Wolves, choose your next victim...", 'wolf');
        break;
      case 'results':
        const winners = determineWinners();
        if (winners) {
          setGameState(prev => ({
            ...prev,
            phase: 'gameOver',
            winners,
          }));
          addSystemMessage(`Game Over! The ${winners === 'wolf' ? 'Werewolves' : 'Villagers'} have won!`, 'moderator');
        } else {
          // Continue to next phase
          setGameState(prev => ({
            ...prev,
            phase: 'night',
            dayCount: prev.dayCount + 1,
            votes: [],
            nightActions: { ...initialNightActions },
          }));
          addSystemMessage("Night falls once more. The village sleeps, uneasy with the knowledge that wolves walk among them...", 'moderator');
          addSystemMessage("Wolves, choose your next victim...", 'wolf');
        }
        break;
      case 'gameOver':
        resetGame();
        break;
    }
  };

  const processNightActions = () => {
    const { wolfKill, witchSave, witchKill } = gameState.nightActions;
    let killedPlayerId = wolfKill;
    
    // Witch can save the wolf's target
    if (wolfKill && witchSave && wolfKill === witchSave) {
      killedPlayerId = null;
      addSystemMessage("A villager was attacked in the night, but someone mysterious saved them!", 'moderator');
    } else if (wolfKill) {
      const killedPlayer = gameState.players.find(p => p.id === wolfKill);
      if (killedPlayer) {
        addSystemMessage(`${killedPlayer.name} was killed in the night by the werewolves!`, 'moderator');
        
        // Update player status
        setGameState(prev => ({
          ...prev,
          players: prev.players.map(p => 
            p.id === wolfKill ? { ...p, status: 'dead' } : p
          ),
        }));
      }
    }
    
    // Witch can also kill someone
    if (witchKill) {
      const killedPlayer = gameState.players.find(p => p.id === witchKill);
      if (killedPlayer) {
        addSystemMessage(`${killedPlayer.name} was found dead, poisoned by an unknown assailant!`, 'moderator');
        
        // Update player status
        setGameState(prev => ({
          ...prev,
          players: prev.players.map(p => 
            p.id === witchKill ? { ...p, status: 'dead' } : p
          ),
        }));
      }
    }
    
    // Check if Hunter was killed and if so, process their shot
    if ((killedPlayerId || witchKill) && gameState.nightActions.hunterTarget) {
      const hunter = gameState.players.find(p => p.role === 'hunter');
      if (hunter && (hunter.id === killedPlayerId || hunter.id === witchKill)) {
        const targetId = gameState.nightActions.hunterTarget;
        const target = gameState.players.find(p => p.id === targetId);
        
        if (target) {
          addSystemMessage(`With their last breath, the Hunter shoots ${target.name}!`, 'moderator');
          
          // Update target status
          setGameState(prev => ({
            ...prev,
            players: prev.players.map(p => 
              p.id === targetId ? { ...p, status: 'dead' } : p
            ),
          }));
        }
      }
    }
    
    // Check win conditions after night actions
    const winners = determineWinners();
    if (winners) {
      setGameState(prev => ({
        ...prev,
        phase: 'gameOver',
        winners,
      }));
      addSystemMessage(`Game Over! The ${winners === 'wolf' ? 'Werewolves' : 'Villagers'} have won!`, 'moderator');
    }
  };

  const processDayVoting = () => {
    // Count votes
    const voteCounts: Record<string, number> = {};
    
    gameState.votes.forEach(vote => {
      if (vote.actionType === 'vote') {
        voteCounts[vote.targetId] = (voteCounts[vote.targetId] || 0) + 1;
      }
    });
    
    // Find max votes
    let maxVotes = 0;
    let lynchTargetIds: string[] = [];
    
    Object.entries(voteCounts).forEach(([targetId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        lynchTargetIds = [targetId];
      } else if (count === maxVotes) {
        lynchTargetIds.push(targetId);
      }
    });
    
    // Handle tie or no votes
    if (lynchTargetIds.length === 0) {
      addSystemMessage("The village couldn't decide on anyone to lynch today.", 'moderator');
    } else if (lynchTargetIds.length > 1) {
      addSystemMessage("The vote was tied! No one was lynched today.", 'moderator');
    } else {
      const targetId = lynchTargetIds[0];
      const target = gameState.players.find(p => p.id === targetId);
      
      if (target) {
        addSystemMessage(`The village has spoken. ${target.name} has been lynched!`, 'moderator');
        
        // Update target status
        setGameState(prev => ({
          ...prev,
          players: prev.players.map(p => 
            p.id === targetId ? { ...p, status: 'dead' } : p
          ),
        }));
        
        // If hunter was lynched, they get to shoot
        if (target.role === 'hunter') {
          // Will be handled in UI with a special action prompt
          addSystemMessage(`The Hunter gets a final shot before dying!`, 'moderator');
        }
      }
    }
    
    // Check win conditions after voting
    const winners = determineWinners();
    if (winners) {
      setGameState(prev => ({
        ...prev,
        phase: 'gameOver',
        winners,
      }));
      addSystemMessage(`Game Over! The ${winners === 'wolf' ? 'Werewolves' : 'Villagers'} have won!`, 'moderator');
    }
  };

  const determineWinners = (): PlayerRole | null => {
    const alivePlayers = gameState.players.filter(p => p.status === 'alive');
    const aliveWolves = alivePlayers.filter(p => p.role === 'wolf');
    const aliveVillagers = alivePlayers.filter(p => p.role !== 'wolf' && p.role !== 'moderator');
    
    // Wolves win if they equal or outnumber the villagers
    if (aliveWolves.length >= aliveVillagers.length) {
      return 'wolf';
    }
    
    // Villagers win if all wolves are dead
    if (aliveWolves.length === 0) {
      return 'villager';
    }
    
    // Game continues
    return null;
  };

  const isActionAllowed = (playerId: string, actionType: ActionType): boolean => {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player || player.status === 'dead') return false;
    
    switch (actionType) {
      case 'vote':
        return gameState.phase === 'voting';
      case 'wolfKill':
        return gameState.phase === 'night' && player.role === 'wolf';
      case 'seerReveal':
        return gameState.phase === 'night' && player.role === 'seer';
      case 'witchSave':
      case 'witchKill':
        return gameState.phase === 'night' && player.role === 'witch';
      case 'hunterShoot':
        return player.role === 'hunter';
      default:
        return false;
    }
  };

  const getAlivePlayersWithRole = (role: PlayerRole): Player[] => {
    return gameState.players.filter(p => p.role === role && p.status === 'alive');
  };

  const getAlivePlayersWithoutRole = (role: PlayerRole): Player[] => {
    return gameState.players.filter(p => p.role !== role && p.status === 'alive');
  };

  const getActiveChannel = (): 'village' | 'wolf' => {
    if (!currentPlayer) return 'village';
    
    // During the day, everyone uses the village chat
    if (gameState.phase === 'day' || gameState.phase === 'voting') {
      return 'village';
    }
    
    // At night, wolves use the wolf chat, everyone else is not chatting
    if (gameState.phase === 'night' && currentPlayer.role === 'wolf') {
      return 'wolf';
    }
    
    // The moderator can always see and post to the village chat
    if (currentPlayer.role === 'moderator') {
      return 'village';
    }
    
    return 'village';
  };

  useEffect(() => {
    // Check for win conditions after any game state change
    const winners = determineWinners();
    if (winners && !gameState.winners && gameState.phase !== 'lobby') {
      setGameState(prev => ({
        ...prev,
        phase: 'gameOver',
        winners,
      }));
    }
  }, [gameState.players]);

  return (
    <GameContext.Provider
      value={{
        gameState,
        currentPlayer,
        startGame,
        resetGame,
        setPlayers,
        addPlayer,
        removePlayer,
        sendMessage,
        castVote,
        advancePhase,
        determineWinners,
        isActionAllowed,
        getAlivePlayersWithRole,
        getAlivePlayersWithoutRole,
        getActiveChannel,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
