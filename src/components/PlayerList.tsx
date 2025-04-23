
import React from 'react';
import { useGame } from '@/context/GameContext';
import { Player, PlayerRole } from '@/types/game';
import { Badge } from '@/components/ui/badge';
import { Heart, Skull, User, Shield, Eye, FlaskConical, Crosshair } from 'lucide-react';

const PlayerList = () => {
  const { gameState, currentPlayer } = useGame();

  const getRoleIcon = (role: PlayerRole, status: string) => {
    if (status === 'dead') return <Skull className="h-4 w-4 text-werewolf-blood" />;
    switch (role) {
      case 'villager':
        return <User className="h-4 w-4 text-werewolf-village" />;
      case 'wolf':
        return <Heart className="h-4 w-4 text-werewolf-blood" />;
      case 'seer':
        return <Eye className="h-4 w-4 text-werewolf-accent" />;
      case 'witch':
        return <FlaskConical className="h-4 w-4 text-werewolf-secondary" />;
      case 'hunter':
        return <Crosshair className="h-4 w-4 text-werewolf-accent" />;
      case 'moderator':
        return <Shield className="h-4 w-4 text-werewolf-primary" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getDisplayName = (player: Player) => {
    return `${player.name}${player.isAI ? ' (AI)' : ''}`;
  };

  const canSeeRole = (player: Player) => {
    if (!currentPlayer) return false;
    if (gameState.phase === 'gameOver') return true;
    if (currentPlayer.id === player.id) return true;
    if (currentPlayer.role === 'moderator') return true;
    if (currentPlayer.role === 'wolf' && player.role === 'wolf') return true;
    if (currentPlayer.role === 'seer' && gameState.nightActions.seerReveal === player.id) {
      return true;
    }
    return false;
  };

  return (
    <div className="border-medieval p-3 rounded-md">
      <h2 className="werewolf-header text-base mb-2">Players</h2>
      <div className="grid grid-cols-1 gap-1">
        {gameState.players.map((player) => (
          <div 
            key={player.id}
            className={`
              flex items-center justify-between 
              p-1 rounded 
              ${player.status === 'dead' ? 'opacity-60' : ''} 
              ${player.id === currentPlayer?.id ? 'border-medieval' : 'border border-werewolf-primary/20'}
              bg-mystic-subtle/70
              min-h-[32px] max-h-[38px]
            `}
            style={{ fontSize: 'clamp(10px, 2vw, 13px)', lineHeight: 1.2 }}
          >
            <div className="flex items-center space-x-1 max-w-[90px] xs:max-w-[120px] sm:max-w-[160px] overflow-x-hidden whitespace-nowrap">
              {getRoleIcon(player.role, player.status)}
              <span className="truncate font-game">{getDisplayName(player)}</span>
              {player.isAI && (
                <Badge variant="outline" className="text-[9px] py-0 px-1">AI</Badge>
              )}
            </div>
            <div className="flex items-center">
              {canSeeRole(player) ? (
                <Badge className={`
                  ${player.role === 'wolf' ? 'bg-werewolf-blood' : ''} 
                  ${player.role === 'villager' ? 'bg-werewolf-village text-werewolf-darker' : ''} 
                  ${player.role === 'seer' ? 'bg-werewolf-accent text-werewolf-darker' : ''} 
                  ${player.role === 'witch' ? 'bg-werewolf-secondary' : ''} 
                  ${player.role === 'hunter' ? 'bg-werewolf-accent text-werewolf-darker' : ''} 
                  ${player.role === 'moderator' ? 'bg-werewolf-primary' : ''} 
                  text-[10px] px-2 py-0
                `}>
                  {player.role}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] px-2 py-0">Unknown</Badge>
              )}
              {player.status === 'dead' && (
                <Badge variant="destructive" className="ml-1 text-[9px] px-2 py-0">Dead</Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerList;
