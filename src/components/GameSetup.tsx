
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
import { Check, Plus, Trash2, User, Play, Wand2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';

const GameSetup = () => {
  const { gameState, addPlayer, removePlayer, setPlayers, currentPlayer, startGame: contextStartGame } = useGame();
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
    gameState.players.forEach(p => { roleCounts[p.role]++; });
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
    const roles: PlayerRole[] = [];
    if (roleCounts.moderator < 1) roles.push('moderator');
    if (roleCounts.wolf < 3) {
      for (let i = roleCounts.wolf; i < 3; i++) roles.push('wolf');
    }
    if (roleCounts.seer < 1) roles.push('seer');
    if (roleCounts.witch < 1) roles.push('witch');
    if (roleCounts.hunter < 1) roles.push('hunter');
    const remainingSlots = 10 - gameState.players.length - roles.length;
    for (let i = 0; i < remainingSlots && roleCounts.villager < 3; i++) roles.push('villager');
    const shuffledRoles = [...roles].sort(() => Math.random() - 0.5);

    const aiNames = [
      "AI_Olivia", "AI_Noah", "AI_Emma", "AI_Liam", 
      "AI_Ava", "AI_William", "AI_Sophia", "AI_James", 
      "AI_Isabella", "AI_Benjamin", "AI_Mia", "AI_Lucas"
    ];
    let playersAdded = 0;
    shuffledRoles.forEach((role, index) => {
      const name = `${aiNames[index % aiNames.length]}${Math.floor(Math.random() * 100)}`;
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
    // Responsive panel, larger width, content flexed vertically
    <div className="border-medieval rounded-md mx-auto my-6 w-full max-w-[98vw] md:max-w-[520px] xl:max-w-[650px] bg-mystic-card-lg p-0 shadow-game flex flex-col overflow-hidden">
      {/* Game status/header bar */}
      <div className="px-5 pt-4 pb-2 bg-mystic-subtle/80 border-b border-mystic-border">
        <h2 className="font-game text-base font-bold mb-2 leading-tight text-mystic-yellow" style={{letterSpacing:"0.01em"}}>Game Setup</h2>
        {/* Condensed role grid */}
        <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-1 md:mb-0">
          {[
            { label: 'Villagers', count: roleCounts.villager, required: 3 },
            { label: 'Wolves', count: roleCounts.wolf, required: 3 },
            { label: 'Seer', count: roleCounts.seer, required: 1 },
            { label: 'Witch', count: roleCounts.witch, required: 1 },
            { label: 'Hunter', count: roleCounts.hunter, required: 1 },
            { label: 'Moderator', count: roleCounts.moderator, required: 1 },
          ].map(({ label, count, required }) => (
            <div 
              key={label} 
              className="p-1 border border-mystic-purple/20 rounded-sm text-center bg-mystic-card/95 min-w-0"
            >
              <div className="text-[11px] font-game text-mystic-muted font-semibold">{label}</div>
              <div className={`text-xs font-bold ${count < required ? 'text-mystic-danger' : 'text-mystic-yellow'}`}>
                {count}/{required}
              </div>
            </div>
          ))}
        </div>
        {playersNeeded > 0 && (
          <div className="text-[10px] text-mystic-danger/80 pt-1 pb-0 font-game">
            {playersNeeded} players needed (9 players + 1 moderator)
          </div>
        )}
        {!hasRequiredRoles && gameState.players.length >= 10 && (
          <div className="text-[10px] text-mystic-danger mt-1 font-game">
            Required roles not fulfilled. Please adjust roles.
          </div>
        )}
      </div>
      {/* Main setup content area */}
      <div className="flex flex-col flex-1 px-4 pt-1 pb-4">
        {/* Add player row */}
        <div className="flex flex-wrap gap-2 items-center mb-3 w-full">
          <div className="flex-grow min-w-0">
            <input
              placeholder="Player name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="pixel-input h-9 text-xs md:text-sm w-full"
              style={{fontFamily:'inherit'}}
            />
          </div>
          <div className="flex items-center space-x-1 flex-shrink-0">
            <Switch 
              id="ai-player" 
              checked={isAI}
              onCheckedChange={setIsAI}
            />
            <Label htmlFor="ai-player" className="game-setup-label whitespace-nowrap text-[11px]">AI</Label>
          </div>
          <Button 
            className="primary-button text-xs py-2 px-4 flex-shrink-0"
            onClick={handleAddPlayer} 
            disabled={!playerName.trim()}
            tabIndex={0}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
        <Separator className="my-[6px] bg-mystic-purple/30" />

        {/* Scrollable player list with fixed height */}
        <div
          className="flex flex-col space-y-2 overflow-y-auto px-1"
          style={{ maxHeight: "196px", minHeight: "44px" }}
        >
          <h3 className="font-extrabold text-mystic-blue text-xs mb-1 game-setup-label">Players</h3>
          {gameState.players.length === 0 && (
            <div className="text-center text-mystic-muted text-xs py-1">
              No players added yet
            </div>
          )}
          {gameState.players.map((player) => (
            <div 
              key={player.id} 
              className="flex items-center justify-between p-1 border border-mystic-purple/30 rounded-md bg-mystic-subtle setup-role-box max-w-full"
            >
              <div className="flex items-center game-setup-player max-w-[110px] sm:max-w-[140px] truncate text-xs gap-1">
                <User className="mr-1 flex-shrink-0 text-[13px] text-mystic-muted h-4 w-4" />
                <span className="truncate">{player.name}</span>
                {player.isAI && (
                  <span className="ml-1 text-[10px] text-mystic-muted whitespace-nowrap">(AI)</span>
                )}
                {player.id === currentPlayer?.id && (
                  <span className="ml-1 text-[10px] text-mystic-blue whitespace-nowrap">(You)</span>
                )}
              </div>
              <div className="flex items-center space-x-1 flex-shrink-0">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openEditDialog(player)}
                      className="h-7 text-xs"
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
                        <Label htmlFor="player-role" className="mb-1 text-xs">Role</Label>
                        <Select
                          value={selectedRole}
                          onValueChange={(value) => setSelectedRole(value as PlayerRole)}
                        >
                          <SelectTrigger className="bg-werewolf-darker border-werewolf-primary/50 text-xs">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent className="bg-werewolf-darker border-werewolf-primary/50 text-xs">
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
                        <Label htmlFor="edit-ai-player" className="text-xs">AI Player</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button className="danger-button text-xs py-2" onClick={() => removePlayer(player.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                      <Button className="primary-button text-xs py-2" onClick={handleUpdatePlayer}>
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
                  className="h-7 text-xs text-mystic-danger border-mystic-danger/50 hover:bg-mystic-danger/20 py-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Autofill / CTA */}
        <div className="mt-3 flex">
          <Button
            className="mystic-cta justify-center w-full text-xs font-bold flex items-center"
            onClick={autoFillWithAIPlayers}
            disabled={gameState.players.length >= 10}
            type="button"
          >
            <Wand2 className="mr-2 h-4 w-4" />
            Autofill with AI
          </Button>
        </div>
        
        {/* Start */}
        <div className="mt-2 space-y-3">
          {hasRequiredRoles && (
            <Button 
              className="accent-button w-full text-xs font-bold"
              onClick={startGame}
            >
              Start Game
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameSetup;

