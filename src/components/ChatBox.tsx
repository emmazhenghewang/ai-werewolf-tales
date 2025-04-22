
import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessageType } from '@/types/game';
import { MessageSquare, Users, Send } from 'lucide-react';

const ChatBox = () => {
  const { gameState, currentPlayer, sendMessage, getActiveChannel } = useGame();
  const [messageText, setMessageText] = useState('');
  const [activeTab, setActiveTab] = useState<'village' | 'wolf'>('village');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const canUseWolfChat = 
    currentPlayer?.role === 'wolf' && 
    currentPlayer?.status === 'alive' && 
    (gameState.phase === 'night' || gameState.phase === 'gameOver');

  const canChat = 
    (gameState.phase === 'day' || gameState.phase === 'voting' || gameState.phase === 'gameOver') || 
    (gameState.phase === 'night' && (currentPlayer?.role === 'wolf' || currentPlayer?.role === 'moderator'));

  useEffect(() => {
    // Auto switch to the appropriate channel
    const channel = getActiveChannel();
    setActiveTab(channel);
  }, [getActiveChannel, gameState.phase]);

  useEffect(() => {
    // Scroll to bottom on new messages
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !currentPlayer || !canChat) return;

    const messageType: ChatMessageType = 
      activeTab === 'wolf' ? 'wolf' :
      currentPlayer.role === 'moderator' ? 'moderator' : 'village';

    sendMessage(messageText, messageType);
    setMessageText('');
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderChatBubble = (message: any, index: number) => {
    const isCurrentUser = message.senderId === currentPlayer?.id;
    
    let bubbleClassName = 'chat-bubble mb-2 ';
    
    if (message.type === 'wolf') {
      bubbleClassName += 'wolf-chat ';
    } else if (message.type === 'moderator') {
      bubbleClassName += 'moderator-chat ';
    } else if (message.type === 'system') {
      bubbleClassName += 'system-chat ';
    } else {
      bubbleClassName += 'village-chat ';
    }
    
    bubbleClassName += isCurrentUser ? 'ml-auto' : '';

    return (
      <div key={message.id || index} className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        <div className="text-xs text-werewolf-secondary mb-1">
          {message.type !== 'system' && `${message.senderName} - ${formatTimestamp(message.timestamp)}`}
        </div>
        <div className={bubbleClassName}>
          {message.content}
        </div>
      </div>
    );
  };

  return (
    <div className="border-medieval rounded-md overflow-hidden flex flex-col h-full">
      <Tabs 
        defaultValue="village" 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as 'village' | 'wolf')}
        className="flex flex-col h-full"
      >
        <div className="p-2 bg-werewolf-darker border-b border-werewolf-primary/30">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="village" disabled={!canChat}>
              <Users className="h-4 w-4 mr-2" />
              Village
            </TabsTrigger>
            <TabsTrigger value="wolf" disabled={!canUseWolfChat}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Wolves
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="village" className="flex-grow flex flex-col p-0 m-0">
          <ScrollArea className="flex-grow p-4">
            <div className="space-y-4">
              {gameState.messages.village.map((message, index) => renderChatBubble(message, index))}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="wolf" className="flex-grow flex flex-col p-0 m-0">
          <ScrollArea className="flex-grow p-4">
            <div className="space-y-4">
              {gameState.messages.wolf.map((message, index) => renderChatBubble(message, index))}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>
        </TabsContent>

        <form onSubmit={handleSendMessage} className="p-2 border-t border-werewolf-primary/30 bg-werewolf-darker">
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder={canChat ? "Type your message..." : "You cannot chat now..."}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              disabled={!canChat}
              className="bg-werewolf-darker border-werewolf-primary/50 text-werewolf-parchment"
            />
            <Button 
              type="submit" 
              disabled={!canChat || !messageText.trim()} 
              variant="secondary"
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  );
};

export default ChatBox;
