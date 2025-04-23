import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessageType } from '@/types/game';
import { MessageSquare, Send } from 'lucide-react';

const ChatBox = () => {
  const { gameState, currentPlayer, sendMessage } = useGame();
  const [messageText, setMessageText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const canChat = () => {
    if (!currentPlayer) return false;
    if (currentPlayer.status === 'dead') return false;
    if (gameState.phase === 'gameOver') return true;
    if (currentPlayer.role === 'moderator') return true;
    
    if (gameState.phase === 'day') {
      return gameState.speakingPlayerId === currentPlayer.id;
    }
    
    if (gameState.phase === 'voting') return true;
    
    if (gameState.phase === 'night' && (currentPlayer.role === 'wolf' || currentPlayer.role === 'wolfKing')) return true;
    
    return false;
  };

  const getMessageType = (): ChatMessageType => {
    if (!currentPlayer) return 'village';
    
    if (currentPlayer.role === 'moderator') return 'moderator';
    if (gameState.phase === 'night' && (currentPlayer.role === 'wolf' || currentPlayer.role === 'wolfKing')) return 'wolf';
    
    return 'village';
  };

  const getVisibleMessages = () => {
    const messages = [];
    
    const moderatorMessages = [...gameState.messages.village, ...gameState.messages.wolf]
      .filter(m => m.type === 'moderator');
    messages.push(...moderatorMessages);
    
    const systemMessages = [...gameState.messages.village, ...gameState.messages.wolf]
      .filter(m => m.type === 'system');
    messages.push(...systemMessages);
    
    const villageMessages = gameState.messages.village.filter(m => 
      m.type === 'village' && m.timestamp <= Date.now()
    );
    messages.push(...villageMessages);
    
    const wolfMessages = gameState.messages.wolf.filter(m => 
      m.type === 'wolf' && m.timestamp <= Date.now()
    );
    messages.push(...wolfMessages);
    
    return messages.sort((a, b) => a.timestamp - b.timestamp);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !currentPlayer || !canChat()) return;

    sendMessage(messageText, getMessageType());
    setMessageText('');
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderChatBubble = (message: any, index: number) => {
    const sender = gameState.players.find(p => p.id === message.senderId);
    const roleInfo = sender ? ` (${sender.role})` : "";

    const isCurrentUser = message.senderId === currentPlayer?.id;
    
    let bubbleClassName = 'chat-bubble mb-2 p-3 rounded-lg max-w-[80%] ';
    
    if (message.type === 'wolf') {
      bubbleClassName += 'bg-werewolf-blood/30 text-werewolf-parchment ';
    } else if (message.type === 'moderator') {
      bubbleClassName += 'bg-werewolf-accent/30 text-werewolf-parchment ';
    } else if (message.type === 'system') {
      bubbleClassName += 'bg-werewolf-secondary/30 text-werewolf-parchment italic ';
    } else {
      bubbleClassName += 'bg-werewolf-primary/30 text-werewolf-parchment ';
    }
    
    bubbleClassName += isCurrentUser ? 'ml-auto' : '';

    return (
      <div key={message.id || index} className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} mb-4`}>
        <div className="text-xs text-werewolf-secondary mb-1">
          {message.type !== 'system' && (
            <>
              <span className={message.type === 'wolf' ? 'text-werewolf-blood' : ''}>
                {message.senderName}{roleInfo} - {formatTimestamp(message.timestamp)}
              </span>
              {message.type === 'wolf' && <span className="ml-2 text-werewolf-blood">[Wolf Chat]</span>}
            </>
          )}
        </div>
        <div className={bubbleClassName}>
          {message.content}
        </div>
      </div>
    );
  };

  const visibleMessages = getVisibleMessages();
  
  const getChatTitle = () => {
    return 'Game Master View - All Chats';
  };
  
  const getChatStatus = () => {
    if (gameState.phase === 'night') {
      return 'Night - Wolves, Seer, Witch, and other night roles are active';
    } else if (gameState.phase === 'day' && gameState.speakingPlayerId) {
      const speaker = gameState.players.find(p => p.id === gameState.speakingPlayerId);
      return `Day - ${speaker?.name} is speaking now`;
    } else if (gameState.phase === 'voting') {
      return 'Day - Public voting in progress';
    } else if (gameState.phase === 'gameOver') {
      return 'Game Over - Final Results';
    } else {
      return 'Game Lobby - Setting up players';
    }
  };

  return (
    <div className="border-medieval rounded-md overflow-hidden flex flex-col h-full">
      <div className="p-2 bg-werewolf-darker border-b border-werewolf-primary/30 flex justify-between items-center">
        <div className="flex items-center">
          <MessageSquare className="h-4 w-4 mr-2 text-werewolf-accent" />
          <span className="text-werewolf-accent font-bold">
            {getChatTitle()}
          </span>
        </div>
        
        <div className="text-xs text-werewolf-secondary">
          {getChatStatus()}
        </div>
      </div>

      <ScrollArea className="flex-grow p-4">
        <div className="space-y-1">
          {visibleMessages.length === 0 ? (
            <div className="text-center text-werewolf-secondary py-8">
              No messages yet. Start the game to see activity.
            </div>
          ) : (
            visibleMessages.map((message, index) => renderChatBubble(message, index))
          )}
          <div ref={chatEndRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="p-2 border-t border-werewolf-primary/30 bg-werewolf-darker">
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder={canChat() ? "Type your message..." : "You cannot chat now..."}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            disabled={!canChat()}
            className="bg-werewolf-darker border-werewolf-primary/50 text-werewolf-parchment"
          />
          <Button 
            type="submit" 
            disabled={!canChat() || !messageText.trim()} 
            variant="secondary"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
