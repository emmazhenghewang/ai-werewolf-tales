
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
import { Check, Plus, Trash2, User, UserPlus, Play, Film } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';

const GameSetup = () => {
  const { gameState, addPlayer, removePlayer, setPlayers, currentPlayer, startGame: contextStartGame, simulateFullGame } = useGame();
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
      wolfKing: 0,
      seer: 0,
      witch: 0,
      hunter: 0,
      guard: 0,
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
    roleCounts.wolf >= 1 && 
    roleCounts.seer === 1 && 
    roleCounts.witch === 1 && 
    roleCounts.hunter === 1 && 
    roleCounts.moderator === 1;
  
  const startGame = () => {
    contextStartGame();
  };
  
  const autoFillWithAIPlayers = () => {
    // Create a list of available roles we need
    const roles: PlayerRole[] = [];
    
    // Add required roles based on what's missing
    if (roleCounts.moderator < 1) roles.push('moderator');
    if (roleCounts.wolf < 3) {
      for (let i = roleCounts.wolf; i < 3; i++) roles.push('wolf');
    }
    if (roleCounts.seer < 1) roles.push('seer');
    if (roleCounts.witch < 1) roles.push('witch');
    if (roleCounts.hunter < 1) roles.push('hunter');
    
    // Fill remaining slots with villagers
    const remainingSlots = 10 - gameState.players.length - roles.length;
    for (let i = 0; i < remainingSlots && roleCounts.villager < 3; i++) {
      roles.push('villager');
    }
    
    // Shuffle the roles for random assignment
    const shuffledRoles = [...roles].sort(() => Math.random() - 0.5);
    
    // List of AI names
    const aiNames = [
      "AI_Olivia", "AI_Noah", "AI_Emma", "AI_Liam", 
      "AI_Ava", "AI_William", "AI_Sophia", "AI_James", 
      "AI_Isabella", "AI_Benjamin", "AI_Mia", "AI_Lucas"
    ];
    
    // Create AI players with roles
    let playersAdded = 0;
    
    shuffledRoles.forEach((role, index) => {
      // Generate unique name
      const name = `${aiNames[index % aiNames.length]}${Math.floor(Math.random() * 100)}`;
      
      // Create a new player with generated ID
      const newPlayer = {
        id: uuidv4(),
        name,
        role,
        status: 'alive',
        isAI: true
      };
      
      // Add the player using the addPlayer function from context
      addPlayer(name, true, role);
      
      playersAdded++;
    });
    
    if (playersAdded > 0) {
      toast({
        title: "AI Players Added",
        description: `Added ${playersAdded} AI players with randomly assigned roles`,
      });
    } else {
      toast({
        title: "All Roles Filled",
        description: "No more AI players needed",
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
      
      <div className="mt-6 space-y-4">
        <Button 
          className="accent-button w-full"
          onClick={autoFillWithAIPlayers}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Auto-fill with AI Players
        </Button>
        
        {hasRequiredRoles && (
          <Button 
            className="accent-button w-full" 
            onClick={startGame}
          >
            <Play className="h-4 w-4 mr-2" />
            Start Game
          </Button>
        )}
        
        <div className="relative">
          <Separator className="my-4 bg-werewolf-primary/30" />
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-werewolf-darker px-4 text-xs text-werewolf-secondary">
            OR
          </div>
        </div>
        
        <Button 
          className="secondary-button w-full" 
          onClick={simulateFullGame}
          variant="outline"
        >
          <Film className="h-4 w-4 mr-2" />
          Watch Full Game Simulation
        </Button>
        <div className="text-xs text-werewolf-secondary text-center">
          This will run an automated game with 4 nights using AI players so you can see how the game works
        </div>
      </div>
    </div>
  );
};

export default GameSetup;
