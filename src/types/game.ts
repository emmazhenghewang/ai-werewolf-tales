
export type PlayerRole = 
  | 'villager'
  | 'wolf'
  | 'wolfKing'
  | 'seer'
  | 'witch'
  | 'hunter'
  | 'guard'
  | 'moderator';

export type PlayerStatus = 'alive' | 'dead';

export type Player = {
  id: string;
  name: string;
  role: PlayerRole;
  status: PlayerStatus;
  isAI: boolean;
};

export type GamePhase = 
  | 'lobby'
  | 'night'
  | 'day'
  | 'voting'
  | 'results'
  | 'gameOver';

export type ActionType = 
  | 'vote'
  | 'wolfKill'
  | 'seerReveal'
  | 'witchSave'
  | 'witchKill'
  | 'hunterShoot'
  | 'wolfKingKill'
  | 'guardProtect';

export type ChatMessageType = 
  | 'village'
  | 'wolf'
  | 'moderator'
  | 'system';

export type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  type: ChatMessageType;
};

export type VoteAction = {
  voterId: string;
  targetId: string;
  actionType: ActionType;
};

export type GameState = {
  gameId: string;
  phase: GamePhase;
  players: Player[];
  messages: {
    village: ChatMessage[];
    wolf: ChatMessage[];
  };
  votes: VoteAction[];
  dayCount: number;
  nightActions: {
    wolfKill: string | null;
    seerReveal: string | null;
    witchSave: string | null;
    witchKill: string | null;
    hunterTarget: string | null;
    wolfKingTarget: string | null;
    guardTarget: string | null;
    lastGuardTarget: string | null;
  };
  witchPowers: {
    hasPotion: boolean;
    hasPoison: boolean;
  };
  speakingPlayerId: string | null;
  winners: PlayerRole | null;
};

// Adding the missing type definitions
export type MessageScriptAction = {
  action: 'message';
  senderId: string;
  content: string;
  type: string;
};

export type VoteScriptAction = {
  action: 'vote';
  senderId: string;
  targetId: string;
  voteType: string;
};

export type AdvanceScriptAction = {
  action: 'advance';
};

export type DefaultScriptAction = {
  action: 'none';
};

export type SimulationScriptAction = 
  | MessageScriptAction
  | VoteScriptAction 
  | AdvanceScriptAction
  | DefaultScriptAction;
