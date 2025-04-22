import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ActionType, ChatMessage, ChatMessageType, GamePhase, GameState, Player, PlayerRole, PlayerStatus, VoteAction, SimulationScriptAction, DefaultScriptAction } from '@/types/game';
import { useToast } from '@/components/ui/use-toast';

type GameContextType = {
  gameState: GameState;
  currentPlayer: Player | null;
  startGame: () => void;
  resetGame: () => void;
  setPlayers: (players: Player[]) => void;
  addPlayer: (name: string, isAI: boolean, role?: PlayerRole) => void;
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
  setNextSpeaker: () => void;
};

const initialNightActions = {
  wolfKill: null,
  seerReveal: null,
  witchSave: null,
  witchKill: null,
  hunterTarget: null,
  wolfKingTarget: null,
  guardTarget: null,
  lastGuardTarget: null
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
  witchPowers: {
    hasPotion: true,
    hasPoison: true,
  },
  speakingPlayerId: null,
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
      if (type === 'moderator') {
        return {
          ...prev,
          messages: {
            ...prev.messages,
            village: [...prev.messages.village, systemMessage]
          }
        };
      } else if (type === 'wolf') {
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
    if (gameState.players.length < 4) {
      toast({
        title: "Not enough players",
        description: "You need at least 4 players to start the game.",
        variant: "destructive",
      });
      return;
    }

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
      witchPowers: {
        hasPotion: true,
        hasPoison: true,
      }
    }));
    
    addSystemMessage("The game has begun! The village falls into a deep slumber as night descends...", 'moderator');
    addSystemMessage("Wolves, choose your victim...", 'wolf');
  };

  const resetGame = () => {
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

  const addPlayer = (name: string, isAI: boolean = false, role: PlayerRole = 'villager') => {
    const newPlayer: Player = {
      id: uuidv4(),
      name,
      role,
      status: 'alive' as PlayerStatus,
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

    const filteredVotes = gameState.votes.filter(
      v => !(v.voterId === currentPlayer.id && v.actionType === actionType)
    );

    setGameState(prev => ({
      ...prev,
      votes: [...filteredVotes, newVote],
    }));

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
            witchPowers: { ...prev.witchPowers, hasPotion: false }
          }));
          break;
        case 'witchKill':
          setGameState(prev => ({
            ...prev,
            nightActions: { ...prev.nightActions, witchKill: targetId },
            witchPowers: { ...prev.witchPowers, hasPoison: false }
          }));
          break;
        case 'hunterShoot':
          setGameState(prev => ({
            ...prev,
            nightActions: { ...prev.nightActions, hunterTarget: targetId },
          }));
          break;
        case 'wolfKingKill':
          setGameState(prev => ({
            ...prev,
            nightActions: { ...prev.nightActions, wolfKingTarget: targetId },
          }));
          break;
        case 'guardProtect':
          if (gameState.nightActions.lastGuardTarget === targetId) {
            toast({
              title: "Invalid protection",
              description: "You cannot protect the same player in consecutive rounds.",
              variant: "destructive",
            });
            return;
          }
          
          setGameState(prev => ({
            ...prev,
            nightActions: { 
              ...prev.nightActions, 
              guardTarget: targetId,
              lastGuardTarget: targetId
            },
          }));
          break;
      }
    }
  };

  const setNextSpeaker = () => {
    const alivePlayers = gameState.players.filter(p => 
      p.status === 'alive' && p.role !== 'moderator'
    );
    
    const currentSpeakerIndex = alivePlayers.findIndex(
      p => p.id === gameState.speakingPlayerId
    );
    
    const nextSpeakerIndex = (currentSpeakerIndex + 1) % alivePlayers.length;
    const nextSpeaker = alivePlayers[nextSpeakerIndex];
    
    if (nextSpeaker) {
      setGameState(prev => ({
        ...prev,
        speakingPlayerId: nextSpeaker.id
      }));
      
      addSystemMessage(`It's now ${nextSpeaker.name}'s turn to speak.`, 'moderator');
    }
  };

  const advancePhase = () => {
    switch (gameState.phase) {
      case 'lobby':
        startGame();
        break;
      case 'night':
        processNightActions();
        
        const alivePlayers = gameState.players.filter(p => 
          p.status === 'alive' && p.role !== 'moderator'
        );
        
        if (alivePlayers.length > 0) {
          const firstSpeaker = alivePlayers[0];
          setGameState(prev => ({
            ...prev,
            phase: 'day',
            votes: [],
            speakingPlayerId: firstSpeaker.id
          }));
          
          addSystemMessage("Dawn breaks over the village. The villagers wake to discover the events of the night...", 'moderator');
          addSystemMessage(`${firstSpeaker.name}, please share your thoughts with the village.`, 'moderator');
        } else {
          setGameState(prev => ({
            ...prev,
            phase: 'day',
            votes: [],
          }));
          
          addSystemMessage("Dawn breaks over the village. The villagers wake to discover the events of the night...", 'moderator');
        }
        break;
      case 'day':
        setGameState(prev => ({
          ...prev,
          phase: 'voting',
          speakingPlayerId: null
        }));
        addSystemMessage("It's time to vote! Who do you suspect is a werewolf?", 'moderator');
        break;
      case 'voting':
        processDayVoting();
        const winners = determineWinners();
        if (winners) {
          setGameState(prev => ({
            ...prev,
            phase: 'gameOver',
            winners,
          }));
          
          const winnerText = winners === 'wolf' || winners === 'wolfKing' 
            ? 'The Werewolves' 
            : 'The Villagers';
          
          addSystemMessage(`Game Over! ${winnerText} have won!`, 'moderator');
        } else {
          setGameState(prev => ({
            ...prev,
            phase: 'night',
            dayCount: prev.dayCount + 1,
            votes: [],
            nightActions: { 
              ...initialNightActions,
              lastGuardTarget: prev.nightActions.guardTarget
            },
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
          
          const winnerText = finalWinners === 'wolf' || finalWinners === 'wolfKing' 
            ? 'The Werewolves' 
            : 'The Villagers';
          
          addSystemMessage(`Game Over! ${winnerText} have won!`, 'moderator');
        } else {
          setGameState(prev => ({
            ...prev,
            phase: 'night',
            dayCount: prev.dayCount + 1,
            votes: [],
            nightActions: { 
              ...initialNightActions,
              lastGuardTarget: prev.nightActions.guardTarget
            },
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
    const { wolfKill, witchSave, witchKill, guardTarget } = gameState.nightActions;
    let killedPlayerId = wolfKill;
    
    if (wolfKill && guardTarget && wolfKill === guardTarget) {
      killedPlayerId = null;
      addSystemMessage("A villager was attacked in the night, but someone mysterious protected them!", 'moderator');
    } 
    else if (wolfKill && witchSave && wolfKill === witchSave) {
      killedPlayerId = null;
      addSystemMessage("A villager was attacked in the night, but someone mysterious saved them!", 'moderator');
    } 
    else if (wolfKill) {
      const killedPlayer = gameState.players.find(p => p.id === wolfKill);
      if (killedPlayer) {
        addSystemMessage(`${killedPlayer.name} was killed in the night by the werewolves!`, 'moderator');
        
        setGameState(prev => ({
          ...prev,
          players: prev.players.map(p => 
            p.id === wolfKill ? { ...p, status: 'dead' } : p
          ),
        }));
        
        if (killedPlayer.role === 'hunter') {
          addSystemMessage(`The Hunter gets a final shot before dying!`, 'moderator');
          processHunterAbility(killedPlayer.id);
        } else if (killedPlayer.role === 'wolfKing') {
          addSystemMessage(`The Wolf King howls with rage as they die, choosing a final victim!`, 'moderator');
          processWolfKingAbility(killedPlayer.id);
        }
      }
    }
    
    if (witchKill) {
      const killedPlayer = gameState.players.find(p => p.id === witchKill);
      if (killedPlayer) {
        addSystemMessage(`${killedPlayer.name} was found dead, poisoned by an unknown assailant!`, 'moderator');
        
        setGameState(prev => ({
          ...prev,
          players: prev.players.map(p => 
            p.id === witchKill ? { ...p, status: 'dead' } : p
          ),
        }));
        
        if (killedPlayer.role === 'hunter') {
          addSystemMessage(`The Hunter gets a final shot before dying!`, 'moderator');
          processHunterAbility(killedPlayer.id);
        } else if (killedPlayer.role === 'wolfKing') {
          addSystemMessage(`The Wolf King howls with rage as they die, choosing a final victim!`, 'moderator');
          processWolfKingAbility(killedPlayer.id);
        }
      }
    }
    
    if (gameState.nightActions.seerReveal) {
      const targetId = gameState.nightActions.seerReveal;
      const target = gameState.players.find(p => p.id === targetId);
      const seer = gameState.players.find(p => p.role === 'seer' && p.status === 'alive');
      
      if (target && seer) {
        const isWolf = target.role === 'wolf' || target.role === 'wolfKing';
        const secretMessage = `You examined ${target.name} and discovered they ${isWolf ? 'ARE' : 'are NOT'} a werewolf.`;
        
        console.log(`Seer information: ${secretMessage}`);
        
        const seerMessage: ChatMessage = {
          id: uuidv4(),
          senderId: 'system',
          senderName: 'Moderator',
          content: secretMessage,
          timestamp: Date.now(),
          type: 'system',
        };
        
        setGameState(prev => ({
          ...prev,
          messages: {
            ...prev.messages,
            wolf: [...prev.messages.wolf, seerMessage]
          }
        }));
      }
    }
    
    const winners = determineWinners();
    if (winners) {
      setGameState(prev => ({
        ...prev,
        phase: 'gameOver',
        winners,
      }));
      
      const winnerText = winners === 'wolf' || winners === 'wolfKing' 
        ? 'The Werewolves' 
        : 'The Villagers';
      
      addSystemMessage(`Game Over! ${winnerText} have won!`, 'moderator');
    }
  };

  const processHunterAbility = (hunterId: string) => {
    const hunterTarget = gameState.nightActions.hunterTarget;
    if (hunterTarget) {
      const target = gameState.players.find(p => p.id === hunterTarget);
      if (target) {
        addSystemMessage(`With their last breath, the Hunter shoots ${target.name}!`, 'moderator');
        
        setGameState(prev => ({
          ...prev,
          players: prev.players.map(p => 
            p.id === hunterTarget ? { ...p, status: 'dead' } : p
          ),
        }));
        
        if (target.role === 'wolfKing') {
          addSystemMessage(`The Wolf King howls with rage as they die, choosing a final victim!`, 'moderator');
          processWolfKingAbility(target.id);
        }
      }
    }
  };

  const processWolfKingAbility = (wolfKingId: string) => {
    const wolfKingTarget = gameState.nightActions.wolfKingTarget;
    if (wolfKingTarget) {
      const target = gameState.players.find(p => p.id === wolfKingTarget);
      if (target) {
        addSystemMessage(`With a final howl, the Wolf King drags ${target.name} to their death!`, 'moderator');
        
        setGameState(prev => ({
          ...prev,
          players: prev.players.map(p => 
            p.id === wolfKingTarget ? { ...p, status: 'dead' } : p
          ),
        }));
        
        if (target.role === 'hunter') {
          addSystemMessage(`The Hunter gets a final shot before dying!`, 'moderator');
          processHunterAbility(target.id);
        }
      }
    }
  };

  const processDayVoting = () => {
    const voteCounts: Record<string, number> = {};
    
    gameState.votes.forEach(vote => {
      if (vote.actionType === 'vote') {
        voteCounts[vote.targetId] = (voteCounts[vote.targetId] || 0) + 1;
      }
    });
    
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
    
    if (lynchTargetIds.length === 0) {
      addSystemMessage("The village couldn't decide on anyone to lynch today.", 'moderator');
    } else if (lynchTargetIds.length > 1) {
      addSystemMessage("The vote was tied! No one was lynched today.", 'moderator');
    } else {
      const targetId = lynchTargetIds[0];
      const target = gameState.players.find(p => p.id === targetId);
      
      if (target) {
        addSystemMessage(`The village has spoken. ${target.name} has been lynched!`, 'moderator');
        
        setGameState(prev => ({
          ...prev,
          players: prev.players.map(p => 
            p.id === targetId ? { ...p, status: 'dead' } : p
          ),
        }));
        
        if (target.role === 'hunter') {
          addSystemMessage(`The Hunter gets a final shot before dying!`, 'moderator');
          processHunterAbility(target.id);
        } else if (target.role === 'wolfKing') {
          addSystemMessage(`The Wolf King howls with rage as they die, choosing a final victim!`, 'moderator');
          processWolfKingAbility(target.id);
        }
      }
    }
  };

  const determineWinners = (): PlayerRole | null => {
    const alivePlayers = gameState.players.filter(p => p.status === 'alive');
    const aliveWolves = alivePlayers.filter(p => p.role === 'wolf' || p.role === 'wolfKing');
    const aliveVillagers = alivePlayers.filter(p => p.role === 'villager');
    const aliveSpecialVillagers = alivePlayers.filter(p => 
      p.role !== 'wolf' && p.role !== 'wolfKing' && p.role !== 'villager' && p.role !== 'moderator'
    );
    
    if (aliveVillagers.length === 0 || aliveSpecialVillagers.length === 0) {
      return 'wolf';
    }
    
    if (aliveWolves.length === 0) {
      return 'villager';
    }
    
    return null;
  };

  const isActionAllowed = (playerId: string, actionType: ActionType): boolean => {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player || player.status === 'dead') return false;
    
    switch (actionType) {
      case 'vote':
        return gameState.phase === 'voting';
      case 'wolfKill':
        return gameState.phase === 'night' && (player.role === 'wolf' || player.role === 'wolfKing');
      case 'seerReveal':
        return gameState.phase === 'night' && player.role === 'seer';
      case 'witchSave':
        return gameState.phase === 'night' && player.role === 'witch' && gameState.witchPowers.hasPotion;
      case 'witchKill':
        return gameState.phase === 'night' && player.role === 'witch' && gameState.witchPowers.hasPoison;
      case 'hunterShoot':
        return player.role === 'hunter';
      case 'wolfKingKill':
        return player.role === 'wolfKing';
      case 'guardProtect':
        return gameState.phase === 'night' && player.role === 'guard';
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
    
    if (gameState.phase === 'day' || gameState.phase === 'voting') {
      return 'village';
    }
    
    if (gameState.phase === 'night' && (currentPlayer.role === 'wolf' || currentPlayer.role === 'wolfKing')) {
      return 'wolf';
    }
    
    if (currentPlayer.role === 'moderator') {
      return 'village';
    }
    
    return 'village';
  };

  const simulateFullGame = () => {
    if (isSimulationRunning) return;
    setIsSimulationRunning(true);
    
    resetGame();
    
    const roles: PlayerRole[] = [
      'moderator', 'wolfKing', 'wolf', 'wolf', 
      'villager', 'villager', 'villager', 'villager',  
      'seer', 'witch', 'hunter', 'guard'
    ];
    
    const playerNames = [
      "Moderator", "Alpha Wolf", "Sneaky Wolf", "Shadow Wolf", 
      "Innocent Villager", "Suspicious Farmer", "Old Miller", "Young Maiden", 
      "Mystic Seer", "Wise Witch", "Brave Hunter", "Loyal Guard"
    ];
    
    const simulatedPlayers: Player[] = playerNames.map((name, index) => ({
      id: uuidv4(),
      name,
      role: roles[index],
      status: 'alive' as PlayerStatus,
      isAI: true
    }));
    
    const userPlayer: Player = {
      id: uuidv4(),
      name: "You",
      role: 'villager' as PlayerRole,
      status: 'alive' as PlayerStatus,
      isAI: false
    };
    
    setCurrentPlayer(userPlayer);
    
    setGameState({
      ...initialGameState,
      players: [...simulatedPlayers, userPlayer]
    });
    
    // Start the game after a short delay
    setTimeout(() => {
      startGame();
      
      let step = 0;
      const totalSteps = 200;
      const timeDelay = 2000; // 2 seconds between steps
      
      const interval = setInterval(() => {
        step++;
        
        if (step >= totalSteps || gameState.phase === 'gameOver') {
          clearInterval(interval);
          setSimulationInterval(null);
          setIsSimulationRunning(false);
          return;
        }
        
        simulateGameStep(step);
      }, timeDelay);
      
      setSimulationInterval(interval);
    }, 1000);
  };

  const simulateGameStep = (step: number) => {
    console.log(`Simulating step ${step}, current phase: ${gameState.phase}, day: ${gameState.dayCount}`);
    
    const phase = gameState.phase;
    const dayCount = gameState.dayCount;
    
    const script = getSimulationScript(dayCount, phase, step);
    console.log("Script for this step:", script);
    
    if (script && 'action' in script) {
      if (script.action === 'message' && 'senderId' in script && 'content' in script && 'type' in script) {
        simulateMessage(script.senderId, script.content, script.type as ChatMessageType);
      } else if (script.action === 'vote' && 'senderId' in script && 'targetId' in script && 'voteType' in script) {
        simulateVote(script.senderId, script.targetId, script.voteType as ActionType);
      } else if (script.action === 'advance') {
        advancePhase();
      }
    }
  };

  const simulateMessage = (senderId: string, content: string, type: ChatMessageType) => {
    const sender = gameState.players.find(p => p.id === senderId || p.name === senderId);
    if (!sender) {
      console.log(`Cannot find sender: ${senderId}`);
      return;
    }
    
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
    
    if (!sender || !target) {
      console.log(`Cannot find sender: ${senderId} or target: ${targetId}`);
      return;
    }
    
    const vote: VoteAction = {
      voterId: sender.id,
      targetId: target.id,
      actionType
    };
    
    const filteredVotes = gameState.votes.filter(
      v => !(v.voterId === sender.id && v.actionType === actionType)
    );
    
    setGameState(prev => ({
      ...prev,
      votes: [...filteredVotes, vote],
    }));
    
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
            witchPowers: { ...prev.witchPowers, hasPotion: false }
          }));
          break;
        case 'witchKill':
          setGameState(prev => ({
            ...prev,
            nightActions: { ...prev.nightActions, witchKill: target.id },
            witchPowers: { ...prev.witchPowers, hasPoison: false }
          }));
          break;
        case 'hunterShoot':
          setGameState(prev => ({
            ...prev,
            nightActions: { ...prev.nightActions, hunterTarget: target.id },
          }));
          break;
        case 'wolfKingKill':
          setGameState(prev => ({
            ...prev,
            nightActions: { ...prev.nightActions, wolfKingTarget: target.id },
          }));
          break;
        case 'guardProtect':
          setGameState(prev => ({
            ...prev,
            nightActions: { ...prev.nightActions, guardTarget: target.id },
          }));
          break;
      }
    }
  };

  const getSimulationScript = (day: number, phase: GamePhase, step: number): SimulationScriptAction => {
    const defaultScript: DefaultScriptAction = { action: 'none' };
    
    // Get updated player roles after any deaths
    const villagers = gameState.players.filter(p => p.role === 'villager' && p.status === 'alive');
    const wolves = gameState.players.filter(p => (p.role === 'wolf' || p.role === 'wolfKing') && p.status === 'alive');
    const moderator = gameState.players.find(p => p.role === 'moderator');
    const seer = gameState.players.find(p => p.role === 'seer' && p.status === 'alive');
    const witch = gameState.players.find(p => p.role === 'witch' && p.status === 'alive');
    const hunter = gameState.players.find(p => p.role === 'hunter' && p.status === 'alive');
    const guard = gameState.players.find(p => p.role === 'guard' && p.status === 'alive');
    const wolfKing = gameState.players.find(p => p.role === 'wolfKing' && p.status === 'alive');
    
    if (!moderator) return defaultScript;
    
    // DAY 1 - NIGHT PHASE
    if (day === 1 && phase === 'night') {
      if (step === 1) {
        return {
          action: 'message',
          senderId: moderator.id,
          content: "Night falls on the village. Everyone please close your eyes.",
          type: 'moderator'
        };
      } else if (step === 2) {
        return {
          action: 'message',
          senderId: moderator.id,
          content: "Wolves, please open your eyes and choose your victim.",
          type: 'moderator'
        };
      } else if (step === 3 && wolves.length > 0) {
        return {
          action: 'message',
          senderId: wolves[0]?.id,
          content: "I think we should target the Seer first before they can identify us.",
          type: 'wolf'
        };
      } else if (step === 4 && wolves.length > 1) {
        return {
          action: 'message',
          senderId: wolves[1]?.id,
          content: "Agreed. The Seer is our biggest threat.",
          type: 'wolf'
        };
      } else if (step === 5 && wolfKing) {
        return {
          action: 'message',
          senderId: wolfKing.id,
          content: "Let's go after the Seer. Everyone agree?",
          type: 'wolf'
        };
      } else if (step === 6 && wolfKing && seer) {
        return {
          action: 'vote',
          senderId: wolfKing.id,
          targetId: seer.id,
          voteType: 'wolfKill'
        };
      } else if (step ===
