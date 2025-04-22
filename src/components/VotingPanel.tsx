
import React from 'react';
import { useGame } from '@/context/GameContext';
import { ActionType, Player, PlayerRole } from '@/types/game';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Check, Eye, HeartPulse, Skull, Crosshair } from 'lucide-react';

const VotingPanel = () => {
  const { 
    gameState, 
    currentPlayer, 
    castVote, 
    isActionAllowed,
    getAlivePlayersWithoutRole,
  } = useGame();

  if (!currentPlayer || currentPlayer.status === 'dead') return null;
  
  const renderActionButtons = () => {
    if (gameState.phase === 'gameOver') return null;
    
    if (gameState.phase === 'voting' && currentPlayer.role !== 'moderator') {
      return (
        <VoteAction 
          title="Village Vote" 
          description="Who do you suspect is a werewolf?" 
          actionType="vote"
          icon={<Check className="h-4 w-4 mr-2" />}
          buttonText="Cast Vote"
          buttonVariant="accent-button"
        />
      );
    }
    
    if (gameState.phase === 'night') {
      const actions = [];
      
      if (currentPlayer.role === 'wolf' || currentPlayer.role === 'wolfKing') {
        actions.push(
          <VoteAction 
            key="wolf-kill"
            title="Wolf Kill" 
            description="Choose a victim to attack" 
            actionType="wolfKill"
            icon={<Skull className="h-4 w-4 mr-2" />}
            buttonText="Select Victim"
            buttonVariant="danger-button"
            excludeRoles={['wolf', 'wolfKing']}
          />
        );
      }
      
      if (currentPlayer.role === 'seer') {
        actions.push(
          <VoteAction 
            key="seer-reveal"
            title="Seer Reveal" 
            description="Choose a player to reveal their identity" 
            actionType="seerReveal"
            icon={<Eye className="h-4 w-4 mr-2" />}
            buttonText="Reveal Identity"
            buttonVariant="primary-button"
          />
        );
      }
      
      if (currentPlayer.role === 'witch') {
        actions.push(
          <VoteAction 
            key="witch-save"
            title="Witch Save" 
            description="Choose a player to save from death" 
            actionType="witchSave"
            icon={<HeartPulse className="h-4 w-4 mr-2" />}
            buttonText="Save Player"
            buttonVariant="primary-button"
          />
        );
        
        actions.push(
          <VoteAction 
            key="witch-kill"
            title="Witch Kill" 
            description="Choose a player to poison" 
            actionType="witchKill"
            icon={<Skull className="h-4 w-4 mr-2" />}
            buttonText="Poison Player"
            buttonVariant="danger-button"
          />
        );
      }
      
      if (currentPlayer.role === 'hunter' && 
          ((gameState.nightActions.wolfKill === currentPlayer.id && !gameState.nightActions.witchSave) || 
           gameState.nightActions.witchKill === currentPlayer.id)) {
        actions.push(
          <VoteAction 
            key="hunter-shoot"
            title="Hunter's Shot" 
            description="You're dying! Choose someone to shoot with your last breath" 
            actionType="hunterShoot"
            icon={<Crosshair className="h-4 w-4 mr-2" />}
            buttonText="Shoot Player"
            buttonVariant="danger-button"
          />
        );
      }
      
      if (currentPlayer.role === 'guard') {
        actions.push(
          <VoteAction 
            key="guard-protect"
            title="Guard Protection" 
            description="Choose a player to protect tonight" 
            actionType="guardProtect"
            icon={<HeartPulse className="h-4 w-4 mr-2" />}
            buttonText="Protect Player"
            buttonVariant="primary-button"
          />
        );
      }
      
      if (currentPlayer.role === 'wolfKing' && currentPlayer.status === 'dead') {
        actions.push(
          <VoteAction 
            key="wolfking-kill"
            title="Wolf King's Last Revenge" 
            description="You're dying! Choose someone to drag to death with you" 
            actionType="wolfKingKill"
            icon={<Skull className="h-4 w-4 mr-2" />}
            buttonText="Take Revenge"
            buttonVariant="danger-button"
          />
        );
      }
      
      return actions;
    }
    
    return null;
  };
  
  const getCurrentVote = (actionType: ActionType) => {
    const vote = gameState.votes.find(v => 
      v.voterId === currentPlayer.id && v.actionType === actionType
    );
    
    if (!vote) return null;
    
    const targetPlayer = gameState.players.find(p => p.id === vote.targetId);
    return targetPlayer ? targetPlayer.name : null;
  };
  
  interface VoteActionProps {
    title: string;
    description: string;
    actionType: ActionType;
    icon: React.ReactNode;
    buttonText: string;
    buttonVariant: string;
    excludeRoles?: PlayerRole[];
  }
  
  const VoteAction = ({ 
    title, 
    description, 
    actionType, 
    icon, 
    buttonText, 
    buttonVariant,
    excludeRoles = ['moderator'] 
  }: VoteActionProps) => {
    if (!isActionAllowed(currentPlayer!.id, actionType)) return null;
    
    const currentVote = getCurrentVote(actionType);
    
    const getEligibleTargets = (): Player[] => {
      let targets = getAlivePlayersWithoutRole('moderator')
        .filter(p => p.id !== currentPlayer!.id && !excludeRoles.includes(p.role));
      
      return targets;
    };
    
    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-werewolf-accent">{title}</h3>
          {currentVote && (
            <div className="text-sm">
              Current choice: <span className="font-bold">{currentVote}</span>
            </div>
          )}
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className={buttonVariant}>
              {icon}
              {buttonText}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-werewolf-darker border-werewolf-primary">
            <DialogHeader>
              <DialogTitle className="text-werewolf-accent">{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-2 py-4">
              {getEligibleTargets().map((player) => (
                <Button
                  key={player.id}
                  className={`justify-start ${buttonVariant}`}
                  onClick={() => {
                    castVote(player.id, actionType);
                  }}
                >
                  {player.name}
                </Button>
              ))}
              
              {getEligibleTargets().length === 0 && (
                <div className="text-center text-werewolf-secondary py-2">
                  No eligible targets available
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  return (
    <div className="border-medieval p-4 rounded-md">
      <h2 className="werewolf-header text-xl mb-4">Actions</h2>
      {renderActionButtons()}
    </div>
  );
};

export default VotingPanel;
