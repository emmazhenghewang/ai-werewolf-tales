
import React, { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { Player, PlayerRole } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Check, Plus, Trash2, User, UserPlus, Play } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';

const GameSetup = () => {
  const { gameState, addPlayer, removePlayer, setPlayers, currentPlayer, sendMessage, startGame: contextStartGame } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [isAI, setIsAI] = useState(false);
  const [selectedRole, setSelectedRole] = useState<PlayerRole>('villager');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const { toast } = useToast();
  
  const handleAddPlayer = () => {
    if (!playerName.trim()) return;
    
    addPlayer(playerName, isAI);
    setPlayerName('');
    setIsAI(false);
  };
  
  const handleSetRole = (playerId: string, role: PlayerRole) => {
    const updatedPlayers = gameState.players.map(p => 
      p.id === playerId ? { ...p, role } : p
    );
    setPlayers(updatedPlayers);
  };
  
  const openEditDialog = (player: Player) => {
    setEditingPlayer(player);
    setSelectedRole(player.role);
    setIsAI(player.isAI);
  };
  
  const handleUpdatePlayer = () => {
    if (!editingPlayer) return;
    
    const updatedPlayers = gameState.players.map(p => 
      p.id === editingPlayer.id 
        ? { ...p, role: selectedRole, isAI: isAI } 
        : p
    );
    
    setPlayers(updatedPlayers);
    setEditingPlayer(null);
  };
  
  const countRoles = () => {
    const roleCounts: Record<PlayerRole, number> = {
      villager: 0,
      wolf: 0,
      seer: 0,
      witch: 0,
      hunter: 0,
      moderator: 0,
    };
    
    gameState.players.forEach(p => {
      roleCounts[p.role]++;
    });
    
    return roleCounts;
  };
  
  const roleCounts = countRoles();
  
  const playersNeeded = 10 - gameState.players.length;
  
  const hasRequiredRoles = 
    roleCounts.villager >= 3 && 
    roleCounts.wolf === 3 && 
    roleCounts.seer === 1 && 
    roleCounts.witch === 1 && 
    roleCounts.hunter === 1 && 
    roleCounts.moderator === 1;
  
  const startGame = () => {
    // Set up AI players if none exist
    if (gameState.players.length === 0) {
      autoFillWithAIPlayers();
      
      // Start game after a short delay to allow for player setup
      setTimeout(() => {
        contextStartGame();
      }, 500);
    } else {
      contextStartGame();
    }
  };

  const simulateGameStart = () => {
    contextStartGame();
  };
  
  const autoFillWithAIPlayers = () => {
    const aiNames = [
      "AI_Olivia", "AI_Noah", "AI_Emma", "AI_Liam", 
      "AI_Ava", "AI_William", "AI_Sophia", "AI_James", 
      "AI_Isabella", "AI_Benjamin"
    ];
    
    // Define required roles
    const requiredRoles: Record<PlayerRole, number> = {
      villager: 3,
      wolf: 3,
      seer: 1,
      witch: 1,
      hunter: 1,
      moderator: 1
    };
    
    // Calculate missing roles
    const missingRoles: PlayerRole[] = [];
    
    Object.entries(requiredRoles).forEach(([role, required]) => {
      const current = roleCounts[role as PlayerRole];
      const needed = Math.max(0, required - current);
      
      for (let i = 0; i < needed; i++) {
        missingRoles.push(role as PlayerRole);
      }
    });
    
    // Shuffle missing roles to randomize assignment
    const shuffledRoles = [...missingRoles].sort(() => Math.random() - 0.5);
    
    // Add AI players for all missing roles at once
    if (shuffledRoles.length > 0) {
      // First create all players
      const newPlayers: { name: string, role: PlayerRole }[] = [];
      
      shuffledRoles.forEach((role, index) => {
        const aiName = aiNames[index % aiNames.length];
        newPlayers.push({ name: aiName, role });
      });
      
      // Then add all players with their roles in a batch
      newPlayers.forEach(({ name, role }) => {
        // Add player
        addPlayer(name, true);
        
        // We need to use setTimeout to ensure the player is added before setting role
        setTimeout(() => {
          const newPlayer = gameState.players.find(p => p.name === name);
          if (newPlayer) {
            handleSetRole(newPlayer.id, role);
          }
        }, 10);
      });
      
      toast({
        title: "AI Players Added",
        description: `Added ${newPlayers.length} AI players with the required roles`,
      });
    } else {
      toast({
        title: "All Roles Filled",
        description: "All required roles are already filled",
      });
    }
  };
  
  return (
    <div className="border-medieval p-4 rounded-md">
      <h2 className="werewolf-header text-xl mb-4">Game Setup</h2>
      
      <div className="mb-6">
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="p-2 border border-werewolf-primary/30 rounded-md text-center">
            <div className="text-xs text-werewolf-secondary">Villagers</div>
            <div className={`text-lg ${roleCounts.villager < 3 ? 'text-werewolf-blood' : 'text-werewolf-accent'}`}>{roleCounts.villager}/3</div>
          </div>
          <div className="p-2 border border-werewolf-primary/30 rounded-md text-center">
            <div className="text-xs text-werewolf-secondary">Wolves</div>
            <div className={`text-lg ${roleCounts.wolf < 3 ? 'text-werewolf-blood' : 'text-werewolf-accent'}`}>{roleCounts.wolf}/3</div>
          </div>
          <div className="p-2 border border-werewolf-primary/30 rounded-md text-center">
            <div className="text-xs text-werewolf-secondary">Seer</div>
            <div className={`text-lg ${roleCounts.seer !== 1 ? 'text-werewolf-blood' : 'text-werewolf-accent'}`}>{roleCounts.seer}/1</div>
          </div>
          <div className="p-2 border border-werewolf-primary/30 rounded-md text-center">
            <div className="text-xs text-werewolf-secondary">Witch</div>
            <div className={`text-lg ${roleCounts.witch !== 1 ? 'text-werewolf-blood' : 'text-werewolf-accent'}`}>{roleCounts.witch}/1</div>
          </div>
          <div className="p-2 border border-werewolf-primary/30 rounded-md text-center">
            <div className="text-xs text-werewolf-secondary">Hunter</div>
            <div className={`text-lg ${roleCounts.hunter !== 1 ? 'text-werewolf-blood' : 'text-werewolf-accent'}`}>{roleCounts.hunter}/1</div>
          </div>
          <div className="p-2 border border-werewolf-primary/30 rounded-md text-center">
            <div className="text-xs text-werewolf-secondary">Moderator</div>
            <div className={`text-lg ${roleCounts.moderator !== 1 ? 'text-werewolf-blood' : 'text-werewolf-accent'}`}>{roleCounts.moderator}/1</div>
          </div>
        </div>
        
        {playersNeeded > 0 && (
          <div className="text-sm text-werewolf-secondary">
            {playersNeeded} more players needed (9 players + 1 moderator)
          </div>
        )}
        
        {!hasRequiredRoles && gameState.players.length >= 10 && (
          <div className="text-sm text-werewolf-blood mt-2">
            Required roles not fulfilled. Please adjust player roles.
          </div>
        )}
      </div>
      
      <div className="mb-4 flex gap-2">
        <div className="flex-grow">
          <Input
            placeholder="Player name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="bg-werewolf-darker border-werewolf-primary/50 text-werewolf-parchment"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch 
            id="ai-player" 
            checked={isAI}
            onCheckedChange={setIsAI}
          />
          <Label htmlFor="ai-player">AI</Label>
        </div>
        <Button className="primary-button" onClick={handleAddPlayer} disabled={!playerName.trim()}>
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>
      
      <Separator className="my-4 bg-werewolf-primary/30" />
      
      <div className="space-y-2">
        <h3 className="font-bold text-werewolf-accent">Players</h3>
        
        {gameState.players.length === 0 && (
          <div className="text-center text-werewolf-secondary py-4">
            No players added yet
          </div>
        )}
        
        {gameState.players.map((player) => (
          <div key={player.id} className="flex items-center justify-between p-2 border border-werewolf-primary/30 rounded-md">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-werewolf-secondary" />
              <span>{player.name}</span>
              {player.isAI && (
                <span className="ml-1 text-xs text-werewolf-secondary">(AI)</span>
              )}
              {player.id === currentPlayer?.id && (
                <span className="ml-1 text-xs text-werewolf-accent">(You)</span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openEditDialog(player)}
                    className="h-8"
                  >
                    {player.role}
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-werewolf-darker border-werewolf-primary">
                  <DialogHeader>
                    <DialogTitle className="text-werewolf-accent">Edit Player</DialogTitle>
                    <DialogDescription>
                      Update role and AI status for {player.name}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="player-role">Role</Label>
                      <Select
                        value={selectedRole}
                        onValueChange={(value) => setSelectedRole(value as PlayerRole)}
                      >
                        <SelectTrigger className="bg-werewolf-darker border-werewolf-primary/50">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent className="bg-werewolf-darker border-werewolf-primary/50">
                          <SelectItem value="villager">Villager</SelectItem>
                          <SelectItem value="wolf">Wolf</SelectItem>
                          <SelectItem value="seer">Seer</SelectItem>
                          <SelectItem value="witch">Witch</SelectItem>
                          <SelectItem value="hunter">Hunter</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="edit-ai-player" 
                        checked={isAI}
                        onCheckedChange={setIsAI}
                      />
                      <Label htmlFor="edit-ai-player">AI Player</Label>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button className="danger-button" onClick={() => removePlayer(player.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                    <Button className="primary-button" onClick={handleUpdatePlayer}>
                      <Check className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => removePlayer(player.id)}
                className="h-8 text-werewolf-blood border-werewolf-blood/30 hover:bg-werewolf-blood/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6">
        <Button 
          className="accent-button w-full"
          onClick={autoFillWithAIPlayers}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Auto-fill with AI Players
        </Button>
      </div>
      
      {hasRequiredRoles && (
        <div className="mt-4">
          <Button 
            className="accent-button w-full" 
            onClick={startGame}
          >
            <Play className="h-4 w-4 mr-2" />
            Start Game
          </Button>
        </div>
      )}
    </div>
  );
};

export default GameSetup;
