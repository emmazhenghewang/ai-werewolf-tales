
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
  simulateFullGame: () => void;
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
  const [simulationInterval, setSimulationInterval] = useState<NodeJS.Timeout | null>(null);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);

  const addSystemMessage = (content: string, type: ChatMessageType = 'system') => {
    const systemMessage: ChatMessage = {
      id: uuidv4(),
      senderId: 'system',
      senderName: 'System',
      content,
      timestamp: Date.now(),
      type,
    };

    setGameState(prev => {
      // Determine which chat channel to update
      if (type === 'wolf') {
        return {
          ...prev,
          messages: {
            ...prev.messages,
            wolf: [...prev.messages.wolf, systemMessage]
          }
        };
      } else {
        return {
          ...prev,
          messages: {
            ...prev.messages,
            village: [...prev.messages.village, systemMessage]
          }
        };
      }
    });
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
    // Clear any running simulation
    if (simulationInterval) {
      clearInterval(simulationInterval);
      setSimulationInterval(null);
    }
    setIsSimulationRunning(false);
    
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

    setGameState(prev => {
      if (type === 'wolf') {
        return {
          ...prev,
          messages: {
            ...prev.messages,
            wolf: [...prev.messages.wolf, newMessage]
          }
        };
      } else {
        return {
          ...prev,
          messages: {
            ...prev.messages,
            village: [...prev.messages.village, newMessage]
          }
        };
      }
    });
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
        // Check if game is over after day voting
        const winners = determineWinners();
        if (winners) {
          setGameState(prev => ({
            ...prev,
            phase: 'gameOver',
            winners,
          }));
          addSystemMessage(`Game Over! The ${winners === 'wolf' ? 'Werewolves' : 'Villagers'} have won!`, 'moderator');
        } else {
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
      case 'results':
        const finalWinners = determineWinners();
        if (finalWinners) {
          setGameState(prev => ({
            ...prev,
            phase: 'gameOver',
            winners: finalWinners,
          }));
          addSystemMessage(`Game Over! The ${finalWinners === 'wolf' ? 'Werewolves' : 'Villagers'} have won!`, 'moderator');
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

  // Simulation of full game with 4 nights
  const simulateFullGame = () => {
    if (isSimulationRunning) return;
    setIsSimulationRunning(true);
    
    // Reset any existing game
    resetGame();
    
    // Setup roles for simulation
    const roles: PlayerRole[] = [
      'moderator', 'wolf', 'wolf', 'wolf', 'villager', 'villager', 'villager', 
      'seer', 'witch', 'hunter'
    ];
    
    const playerNames = [
      "Moderator", "EvilWolf1", "SneakyWolf2", "CunningWolf3", 
      "TrustyVillager1", "SuspiciousVillager2", "InnocentVillager3", 
      "MysticSeer", "WiseWitch", "BraveHunter"
    ];
    
    // Generate players with specified roles
    const simulatedPlayers: Player[] = playerNames.map((name, index) => ({
      id: uuidv4(),
      name,
      role: roles[index],
      status: 'alive',
      isAI: true
    }));
    
    // Create player for user (villager by default)
    const userPlayer: Player = {
      id: uuidv4(),
      name: "You",
      role: 'villager',
      status: 'alive',
      isAI: false
    };
    
    setCurrentPlayer(userPlayer);
    
    // Add players to game state
    setGameState({
      ...initialGameState,
      players: [...simulatedPlayers, userPlayer]
    });
    
    // Predefined script for the full game
    let step = 0;
    const totalSteps = 100; // Approximate steps for 4 nights
    
    // Delay to ensure players are set up
    setTimeout(() => {
      // Start the game
      startGame();
      
      // Run simulation at intervals
      const interval = setInterval(() => {
        step++;
        
        if (step >= totalSteps || gameState.phase === 'gameOver') {
          clearInterval(interval);
          setSimulationInterval(null);
          setIsSimulationRunning(false);
          return;
        }
        
        simulateGameStep(step);
      }, 3000);
      
      setSimulationInterval(interval);
    }, 500);
  };
  
  const simulateGameStep = (step: number) => {
    const phase = gameState.phase;
    const dayCount = gameState.dayCount;
    
    // Get the simulation script based on current day/phase
    const script = getSimulationScript(dayCount, phase, step);
    
    // Execute the script action
    if (script.action === 'message') {
      simulateMessage(script.senderId, script.content, script.type as ChatMessageType);
    } else if (script.action === 'vote') {
      simulateVote(script.senderId, script.targetId, script.voteType as ActionType);
    } else if (script.action === 'advance') {
      advancePhase();
    }
  };
  
  const simulateMessage = (senderId: string, content: string, type: ChatMessageType) => {
    const sender = gameState.players.find(p => p.id === senderId || p.name === senderId);
    if (!sender) return;
    
    const message: ChatMessage = {
      id: uuidv4(),
      senderId: sender.id,
      senderName: sender.name,
      content,
      timestamp: Date.now(),
      type
    };
    
    setGameState(prev => {
      if (type === 'wolf') {
        return {
          ...prev,
          messages: {
            ...prev.messages,
            wolf: [...prev.messages.wolf, message]
          }
        };
      } else {
        return {
          ...prev,
          messages: {
            ...prev.messages,
            village: [...prev.messages.village, message]
          }
        };
      }
    });
  };
  
  const simulateVote = (senderId: string, targetId: string, actionType: ActionType) => {
    const sender = gameState.players.find(p => p.id === senderId || p.name === senderId);
    const target = gameState.players.find(p => p.id === targetId || p.name === targetId);
    
    if (!sender || !target) return;
    
    const vote: VoteAction = {
      voterId: sender.id,
      targetId: target.id,
      actionType
    };
    
    // Remove any existing votes from this player for this action type
    const filteredVotes = gameState.votes.filter(
      v => !(v.voterId === sender.id && v.actionType === actionType)
    );
    
    setGameState(prev => ({
      ...prev,
      votes: [...filteredVotes, vote],
    }));
    
    // If it's a night action, record it
    if (gameState.phase === 'night') {
      switch (actionType) {
        case 'wolfKill':
          setGameState(prev => ({
            ...prev,
            nightActions: { ...prev.nightActions, wolfKill: target.id },
          }));
          break;
        case 'seerReveal':
          setGameState(prev => ({
            ...prev,
            nightActions: { ...prev.nightActions, seerReveal: target.id },
          }));
          break;
        case 'witchSave':
          setGameState(prev => ({
            ...prev,
            nightActions: { ...prev.nightActions, witchSave: target.id },
          }));
          break;
        case 'witchKill':
          setGameState(prev => ({
            ...prev,
            nightActions: { ...prev.nightActions, witchKill: target.id },
          }));
          break;
      }
    }
  };
  
  const getSimulationScript = (day: number, phase: GamePhase, step: number) => {
    // Default empty script
    const defaultScript = { action: 'none' };
    
    // Find villager, wolf, and special role targets
    const villagers = getAlivePlayersWithRole('villager');
    const wolves = getAlivePlayersWithRole('wolf');
    const moderator = gameState.players.find(p => p.role === 'moderator');
    
    if (!moderator) return defaultScript;
    
    // Night 1
    if (day === 1 && phase === 'night') {
      if (step === 1) {
        return {
          action: 'message',
          senderId: moderator.id,
          content: "Night 1 has begun. Wolves, select your victim.",
          type: 'moderator'
        };
      } else if (step === 2) {
        return {
          action: 'message',
          senderId: wolves[0]?.id,
          content: "I think we should kill the seer first.",
          type: 'wolf'
        };
      } else if (step === 3) {
        return {
          action: 'message',
          senderId: wolves[1]?.id,
          content: "Good idea. Let's find them.",
          type: 'wolf'
        };
      } else if (step === 4) {
        const seer = gameState.players.find(p => p.role === 'seer');
        if (seer) {
          return {
            action: 'vote',
            senderId: wolves[0]?.id,
            targetId: seer.id,
            voteType: 'wolfKill'
          };
        }
      } else if (step === 5) {
        const witch = gameState.players.find(p => p.role === 'witch');
        if (witch) {
          return {
            action: 'message',
            senderId: moderator.id,
            content: `The wolves have chosen ${gameState.players.find(p => p.role === 'seer')?.name} as their victim. Witch, do you want to save them?`,
            type: 'moderator'
          };
        }
      } else if (step === 6) {
        // Witch decides to save seer
        const seer = gameState.players.find(p => p.role === 'seer');
        if (seer) {
          return {
            action: 'vote',
            senderId: 'WiseWitch',
            targetId: seer.id,
            voteType: 'witchSave'
          };
        }
      } else if (step === 7) {
        return {
          action: 'advance', // End night 1, start day 1
        };
      }
    }
    
    // Day 1
    else if (day === 1 && phase === 'day') {
      if (step === 8) {
        return {
          action: 'message',
          senderId: moderator.id,
          content: "Day 1 has begun. Someone was attacked in the night, but a mysterious force saved them! Discuss your suspicions.",
          type: 'moderator'
        };
      } else if (step === 9) {
        return {
          action: 'message',
          senderId: villagers[0]?.id,
          content: "That was a close call! I wonder who the wolves tried to kill?",
          type: 'village'
        };
      } else if (step === 10) {
        return {
          action: 'message',
          senderId: wolves[0]?.id,
          content: "I'm just glad everyone's still alive. Let's try to figure this out.",
          type: 'village'
        };
      } else if (step === 11) {
        return {
          action: 'message',
          senderId: gameState.players.find(p => p.role === 'seer')?.id,
          content: "I have information that might help, but revealing it could make me a target.",
          type: 'village'
        };
      } else if (step === 12) {
        return {
          action: 'message',
          senderId: villagers[1]?.id,
          content: "That sounds suspicious. Why wouldn't you share helpful information?",
          type: 'village'
        };
      } else if (step === 13) {
        return {
          action: 'advance', // End day 1, start voting
        };
      }
    }
    
    // Voting Day 1
    else if (day === 1 && phase === 'voting') {
      if (step === 14) {
        return {
          action: 'message',
          senderId: moderator.id,
          content: "It's time to vote. Choose who you think is a werewolf.",
          type: 'moderator'
        };
      } else if (step === 15) {
        return {
          action: 'message',
          senderId: wolves[0]?.id,
          content: `I vote for ${villagers[0]?.name}, their behavior seems odd.`,
          type: 'village'
        };
      } else if (step === 16) {
        return {
          action: 'vote',
          senderId: wolves[0]?.id,
          targetId: villagers[0]?.id,
          voteType: 'vote'
        };
      } else if (step === 17) {
        return {
          action: 'message',
          senderId: wolves[1]?.id,
          content: `I agree, ${villagers[0]?.name} is acting suspicious.`,
          type: 'village'
        };
      } else if (step === 18) {
        return {
          action: 'vote',
          senderId: wolves[1]?.id,
          targetId: villagers[0]?.id,
          voteType: 'vote'
        };
      } else if (step === 19) {
        return {
          action: 'message',
          senderId: gameState.players.find(p => p.role === 'hunter')?.id,
          content: `I don't think it's ${villagers[0]?.name}. I'm voting for ${wolves[0]?.name}.`,
          type: 'village'
        };
      } else if (step === 20) {
        return {
          action: 'vote',
          senderId: gameState.players.find(p => p.role === 'hunter')?.id,
          targetId: wolves[0]?.id,
          voteType: 'vote'
        };
      } else if (step === 21) {
        return {
          action: 'advance', // End voting day 1, start night 2
        };
      }
    }
    
    // Night 2
    else if (day === 2 && phase === 'night') {
      if (step === 22) {
        return {
          action: 'message',
          senderId: moderator.id,
          content: "Night 2 has begun. Wolves, select your victim.",
          type: 'moderator'
        };
      } else if (step === 23) {
        return {
          action: 'message',
          senderId: wolves[0]?.id,
          content: "Let's go after the hunter this time, they're suspicious.",
          type: 'wolf'
        };
      } else if (step === 24) {
        const hunter = gameState.players.find(p => p.role === 'hunter');
        if (hunter) {
          return {
            action: 'vote',
            senderId: wolves[0]?.id,
            targetId: hunter.id,
            voteType: 'wolfKill'
          };
        }
      } else if (step === 25) {
        return {
          action: 'message',
          senderId: gameState.players.find(p => p.role === 'seer')?.id,
          content: "I would like to check if EvilWolf1 is a werewolf.",
          type: 'village'
        };
      } else if (step === 26) {
        return {
          action: 'vote',
          senderId: gameState.players.find(p => p.role === 'seer')?.id,
          targetId: wolves[0]?.id,
          voteType: 'seerReveal'
        };
      } else if (step === 27) {
        // Witch doesn't save anyone this time but poisons a villager
        return {
          action: 'vote',
          senderId: gameState.players.find(p => p.role === 'witch')?.id,
          targetId: villagers[1]?.id,
          voteType: 'witchKill'
        };
      } else if (step === 28) {
        return {
          action: 'advance', // End night 2, start day 2
        };
      }
    }
    
    // Day 2
    else if (day === 2 && phase === 'day') {
      if (step === 29) {
        // Get the names of the players who died
        const hunterName = gameState.players.find(p => p.role === 'hunter')?.name;
        const villagerName = villagers[1]?.name;
        
        return {
          action: 'message',
          senderId: moderator.id,
          content: `Dawn breaks. ${hunterName} was killed by wolves in the night! ${villagerName} was found poisoned by a mysterious substance!`,
          type: 'moderator'
        };
      } else if (step === 30) {
        return {
          action: 'message',
          senderId: gameState.players.find(p => p.role === 'seer')?.id,
          content: "I have important information. I checked EvilWolf1 last night and they ARE a werewolf!",
          type: 'village'
        };
      } else if (step === 31) {
        return {
          action: 'message',
          senderId: wolves[0]?.id,
          content: "That's a lie! The seer is trying to frame me because I'm onto them!",
          type: 'village'
        };
      } else if (step === 32) {
        return {
          action: 'message',
          senderId: villagers[0]?.id,
          content: "I believe the seer. We should vote out EvilWolf1 today.",
          type: 'village'
        };
      } else if (step === 33) {
        return {
          action: 'message',
          senderId: wolves[1]?.id,
          content: "Wait, we shouldn't rush to judgment. The seer could be a werewolf trying to mislead us.",
          type: 'village'
        };
      } else if (step === 34) {
        return {
          action: 'advance', // End day 2, start voting
        };
      }
    }
    
    // Voting Day 2
    else if (day === 2 && phase === 'voting') {
      if (step === 35) {
        return {
          action: 'message',
          senderId: moderator.id,
          content: "Time to vote. Choose who you think is a werewolf.",
          type: 'moderator'
        };
      } else if (step === 36) {
        return {
          action: 'message',
          senderId: gameState.players.find(p => p.role === 'seer')?.id,
          content: `I vote for ${wolves[0]?.name}, who I know is a werewolf.`,
          type: 'village'
        };
      } else if (step === 37) {
        return {
          action: 'vote',
          senderId: gameState.players.find(p => p.role === 'seer')?.id,
          targetId: wolves[0]?.id,
          voteType: 'vote'
        };
      } else if (step === 38) {
        return {
          action: 'message',
          senderId: villagers[0]?.id,
          content: `I also vote for ${wolves[0]?.name}.`,
          type: 'village'
        };
      } else if (step === 39) {
        return {
          action: 'vote',
          senderId: villagers[0]?.id,
          targetId: wolves[0]?.id,
          voteType: 'vote'
        };
      } else if (step === 40) {
        return {
          action: 'message',
          senderId: wolves[0]?.id,
          content: `This is ridiculous! I vote for ${gameState.players.find(p => p.role === 'seer')?.name}, they're the real wolf!`,
          type: 'village'
        };
      } else if (step === 41) {
        return {
          action: 'vote',
          senderId: wolves[0]?.id,
          targetId: gameState.players.find(p => p.role === 'seer')?.id,
          voteType: 'vote'
        };
      } else if (step === 42) {
        return {
          action: 'message',
          senderId: wolves[1]?.id,
          content: `I agree, ${gameState.players.find(p => p.role === 'seer')?.name} is suspicious.`,
          type: 'village'
        };
      } else if (step === 43) {
        return {
          action: 'vote',
          senderId: wolves[1]?.id,
          targetId: gameState.players.find(p => p.role === 'seer')?.id,
          voteType: 'vote'
        };
      } else if (step === 44) {
        return {
          action: 'message',
          senderId: gameState.players.find(p => p.role === 'witch')?.id,
          content: `I vote for ${wolves[0]?.name} as well.`,
          type: 'village'
        };
      } else if (step === 45) {
        return {
          action: 'vote',
          senderId: gameState.players.find(p => p.role === 'witch')?.id,
          targetId: wolves[0]?.id,
          voteType: 'vote'
        };
      } else if (step === 46) {
        return {
          action: 'advance', // End voting day 2, start night 3
        };
      }
    }
    
    // Night 3
    else if (day === 3 && phase === 'night') {
      if (step === 47) {
        return {
          action: 'message',
          senderId: moderator.id,
          content: `Night falls. ${wolves[0]?.name} was lynched by the village and revealed to be a WEREWOLF!`,
          type: 'moderator'
        };
      } else if (step === 48) {
        return {
          action: 'message',
          senderId: wolves[1]?.id,
          content: "We need to kill the seer tonight before they expose more of us.",
          type: 'wolf'
        };
      } else if (step === 49) {
        const seer = gameState.players.find(p => p.role === 'seer' && p.status === 'alive');
        if (seer) {
          return {
            action: 'vote',
            senderId: wolves[1]?.id,
            targetId: seer.id,
            voteType: 'wolfKill'
          };
        } else {
          return {
            action: 'vote',
            senderId: wolves[1]?.id,
            targetId: villagers[0]?.id,
            voteType: 'wolfKill'
          };
        }
      } else if (step === 50) {
        // Seer checks another wolf
        return {
          action: 'vote',
          senderId: gameState.players.find(p => p.role === 'seer' && p.status === 'alive')?.id,
          targetId: wolves[1]?.id,
          voteType: 'seerReveal'
        };
      } else if (step === 51) {
        return {
          action: 'advance', // End night 3, start day 3
        };
      }
    }
    
    // Day 3
    else if (day === 3 && phase === 'day') {
      if (step === 52) {
        const seer = gameState.players.find(p => p.role === 'seer');
        return {
          action: 'message',
          senderId: moderator.id,
          content: `Dawn breaks. ${seer?.name} was killed by wolves in the night!`,
          type: 'moderator'
        };
      } else if (step === 53) {
        return {
          action: 'message',
          senderId: villagers[0]?.id,
          content: "We've lost our seer! That's a big blow to the village.",
          type: 'village'
        };
      } else if (step === 54) {
        return {
          action: 'message',
          senderId: wolves[1]?.id,
          content: "This is bad. We need to figure out who the remaining wolves are, and fast.",
          type: 'village'
        };
      } else if (step === 55) {
        return {
          action: 'message',
          senderId: gameState.players.find(p => p.role === 'witch')?.id,
          content: `I have a suspicion that ${wolves[1]?.name} might be a wolf. They've been very quiet.`,
          type: 'village'
        };
      } else if (step === 56) {
        return {
          action: 'message',
          senderId: wolves[1]?.id,
          content: "I've been quiet because I'm trying to observe everyone! That's a weak accusation.",
          type: 'village'
        };
      } else if (step === 57) {
        return {
          action: 'advance', // End day 3, start voting
        };
      }
    }
    
    // Voting Day 3
    else if (day === 3 && phase === 'voting') {
      if (step === 58) {
        return {
          action: 'message',
          senderId: moderator.id,
          content: "Time to vote. Choose who you think is a werewolf.",
          type: 'moderator'
        };
      } else if (step === 59) {
        return {
          action: 'message',
          senderId: gameState.players.find(p => p.role === 'witch')?.id,
          content: `I vote for ${wolves[1]?.name}, I think they're a werewolf.`,
          type: 'village'
        };
      } else if (step === 60) {
        return {
          action: 'vote',
          senderId: gameState.players.find(p => p.role === 'witch')?.id,
          targetId: wolves[1]?.id,
          voteType: 'vote'
        };
      } else if (step === 61) {
        return {
          action: 'message',
          senderId: villagers[0]?.id,
          content: `I agree, ${wolves[1]?.name} has been acting strange.`,
          type: 'village'
        };
      } else if (step === 62) {
        return {
          action: 'vote',
          senderId: villagers[0]?.id,
          targetId: wolves[1]?.id,
          voteType: 'vote'
        };
      } else if (step === 63) {
        return {
          action: 'message',
          senderId: wolves[1]?.id,
          content: `You're making a mistake! I vote for ${gameState.players.find(p => p.role === 'witch')?.name}!`,
          type: 'village'
        };
      } else if (step === 64) {
        return {
          action: 'vote',
          senderId: wolves[1]?.id,
          targetId: gameState.players.find(p => p.role === 'witch')?.id,
          voteType: 'vote'
        };
      } else if (step === 65) {
        return {
          action: 'message',
          senderId: wolves[2]?.id,
          content: `I also think ${gameState.players.find(p => p.role === 'witch')?.name} is suspicious.`,
          type: 'village'
        };
      } else if (step === 66) {
        return {
          action: 'vote',
          senderId: wolves[2]?.id,
          targetId: gameState.players.find(p => p.role === 'witch')?.id,
          voteType: 'vote'
        };
      } else if (step === 67) {
        return {
          action: 'message',
          senderId: currentPlayer?.id,
          content: `I vote for ${wolves[1]?.name} as well.`,
          type: 'village'
        };
      } else if (step === 68) {
        return {
          action: 'vote',
          senderId: currentPlayer?.id,
          targetId: wolves[1]?.id,
          voteType: 'vote'
        };
      } else if (step === 69) {
        return {
          action: 'advance', // End voting day 3, start night 4
        };
      }
    }
    
    // Night 4
    else if (day === 4 && phase === 'night') {
      if (step === 70) {
        return {
          action: 'message',
          senderId: moderator.id,
          content: `Night falls. ${wolves[1]?.name} was lynched by the village and revealed to be a WEREWOLF!`,
          type: 'moderator'
        };
      } else if (step === 71) {
        return {
          action: 'message',
          senderId: wolves[2]?.id,
          content: "I'm the last wolf standing. I need to be careful now.",
          type: 'wolf'
        };
      } else if (step === 72) {
        const witch = gameState.players.find(p => p.role === 'witch' && p.status === 'alive');
        if (witch) {
          return {
            action: 'vote',
            senderId: wolves[2]?.id,
            targetId: witch.id,
            voteType: 'wolfKill'
          };
        } else {
          return {
            action: 'vote',
            senderId: wolves[2]?.id,
            targetId: villagers[0]?.id,
            voteType: 'wolfKill'
          };
        }
      } else if (step === 73) {
        return {
          action: 'advance', // End night 4, start day 4
        };
      }
    }
    
    // Day 4
    else if (day === 4 && phase === 'day') {
      if (step === 74) {
        const witch = gameState.players.find(p => p.role === 'witch');
        return {
          action: 'message',
          senderId: moderator.id,
          content: `Dawn breaks. ${witch?.name} was killed by wolves in the night!`,
          type: 'moderator'
        };
      } else if (step === 75) {
        return {
          action: 'message',
          senderId: villagers[0]?.id,
          content: "We've lost our witch now too. We're down to very few villagers.",
          type: 'village'
        };
      } else if (step === 76) {
        return {
          action: 'message',
          senderId: wolves[2]?.id,
          content: "This is getting tense. There must still be a wolf among us.",
          type: 'village'
        };
      } else if (step === 77) {
        return {
          action: 'message',
          senderId: currentPlayer?.id,
          content: `I think ${wolves[2]?.name} might be our last wolf.`,
          type: 'village'
        };
      } else if (step === 78) {
        return {
          action: 'advance', // End day 4, start voting
        };
      }
    }
    
    // Voting Day 4
    else if (day === 4 && phase === 'voting') {
      if (step === 79) {
        return {
          action: 'message',
          senderId: moderator.id,
          content: "Time for the final vote. Choose who you think is the last werewolf.",
          type: 'moderator'
        };
      } else if (step === 80) {
        return {
          action: 'message',
          senderId: villagers[0]?.id,
          content: `I vote for ${wolves[2]?.name}, I'm sure they're the last wolf.`,
          type: 'village'
        };
      } else if (step === 81) {
        return {
          action: 'vote',
          senderId: villagers[0]?.id,
          targetId: wolves[2]?.id,
          voteType: 'vote'
        };
      } else if (step === 82) {
        return {
          action: 'message',
          senderId: currentPlayer?.id,
          content: `I also vote for ${wolves[2]?.name}.`,
          type: 'village'
        };
      } else if (step === 83) {
        return {
          action: 'vote',
          senderId: currentPlayer?.id,
          targetId: wolves[2]?.id,
          voteType: 'vote'
        };
      } else if (step === 84) {
        return {
          action: 'message',
          senderId: wolves[2]?.id,
          content: `No, you're making a mistake! I vote for ${villagers[0]?.name}!`,
          type: 'village'
        };
      } else if (step === 85) {
        return {
          action: 'vote',
          senderId: wolves[2]?.id,
          targetId: villagers[0]?.id,
          voteType: 'vote'
        };
      } else if (step === 86) {
        return {
          action: 'advance', // End voting day 4, reveal results
        };
      }
    }
    
    // Game over
    else if (gameState.phase === 'gameOver') {
      if (step === 87) {
        return {
          action: 'message',
          senderId: moderator.id,
          content: `${wolves[2]?.name} was lynched and revealed to be the LAST WEREWOLF! The village has won!`,
          type: 'moderator'
        };
      } else if (step === 88) {
        return {
          action: 'message',
          senderId: villagers[0]?.id,
          content: "We did it! The village is saved!",
          type: 'village'
        };
      } else if (step === 89) {
        return {
          action: 'message',
          senderId: moderator.id,
          content: "GAME OVER - The villagers have successfully eliminated all the werewolves!",
          type: 'moderator'
        };
      }
    }
    
    return defaultScript;
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
        simulateFullGame,
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
