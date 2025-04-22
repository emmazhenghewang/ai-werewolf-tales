
import React from 'react';
import { useGame } from '@/context/GameContext';
import { Player, PlayerRole } from '@/types/game';
import { Badge } from '@/components/ui/badge';
import { Heart, Skull, User, Shield, Eye, Flask, Crosshair } from 'lucide-react';

const PlayerList = () => {
  const { gameState, currentPlayer } = useGame();
  
  const getRoleIcon = (role: PlayerRole, status: string) => {
    if (status === 'dead') return <Skull className="h-5 w-5 text-werewolf-blood" />;
    
    switch (role) {
      case 'villager':
        return <User className="h-5 w-5 text-werewolf-village" />;
      case 'wolf':
        return <Heart className="h-5 w-5 text-werewolf-blood" />;
      case 'seer':
        return <Eye className="h-5 w-5 text-werewolf-accent" />;
      case 'witch':
        return <Flask className="h-5 w-5 text-werewolf-secondary" />;
      case 'hunter':
        return <Crosshair className="h-5 w-5 text-werewolf-accent" />;
      case 'moderator':
        return <Shield className="h-5 w-5 text-werewolf-primary" />;
      default:
        return <User className="h-5 w-5" />;
    }
  };

  const getDisplayName = (player: Player) => {
    return `${player.name}${player.isAI ? ' (AI)' : ''}`;
  };

  const canSeeRole = (player: Player) => {
    if (!currentPlayer) return false;
    
    // If game is over, show all roles
    if (gameState.phase === 'gameOver') return true;
    
    // Player can see their own role
    if (currentPlayer.id === player.id) return true;
    
    // Moderator can see all roles
    if (currentPlayer.role === 'moderator') return true;
    
    // Wolves know each other
    if (currentPlayer.role === 'wolf' && player.role === 'wolf') return true;
    
    // Seer knows if someone is a wolf or not if they've checked them
    if (currentPlayer.role === 'seer' && gameState.nightActions.seerReveal === player.id) {
      return true;
    }
    
    return false;
  };

  return (
    <div className="border-medieval p-4 rounded-md">
      <h2 className="werewolf-header text-xl mb-4">Players</h2>
      <div className="grid grid-cols-1 gap-2">
        {gameState.players.map((player) => (
          <div 
            key={player.id}
            className={`flex items-center justify-between p-2 rounded-md ${player.status === 'dead' ? 'opacity-60' : ''} ${player.id === currentPlayer?.id ? 'border-medieval' : 'border border-werewolf-primary/30'}`}
          >
            <div className="flex items-center space-x-2">
              {getRoleIcon(player.role, player.status)}
              <span className="font-medieval">{getDisplayName(player)}</span>
              {player.isAI && (
                <Badge variant="outline" className="text-xs">AI</Badge>
              )}
            </div>
            <div>
              {canSeeRole(player) ? (
                <Badge className={`
                  ${player.role === 'wolf' ? 'bg-werewolf-blood' : ''} 
                  ${player.role === 'villager' ? 'bg-werewolf-village text-werewolf-darker' : ''} 
                  ${player.role === 'seer' ? 'bg-werewolf-accent text-werewolf-darker' : ''} 
                  ${player.role === 'witch' ? 'bg-werewolf-secondary' : ''} 
                  ${player.role === 'hunter' ? 'bg-werewolf-accent text-werewolf-darker' : ''} 
                  ${player.role === 'moderator' ? 'bg-werewolf-primary' : ''} 
                `}>
                  {player.role}
                </Badge>
              ) : (
                <Badge variant="outline">Unknown</Badge>
              )}
              {player.status === 'dead' && (
                <Badge variant="destructive" className="ml-1">Dead</Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerList;
