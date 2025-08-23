import React from 'react';
import { usePageChatState } from '@/hooks/usePageChatState';
import ConversationUI from '../dashboard/chat/ConversationUI';
import { Message } from '../dashboard/message-bubble/types';

interface ChatPanelProps {
  onPageContentGenerated?: (pageContent: string) => void;
  onTitleChange?: (title: string) => void;
  autoSendMessage?: string;
  onImageGenerated?: (imageUrl: string) => void;
}

// Convert PageMessage to Message type for compatibility with ConversationUI
const convertPageMessageToMessage = (pageMessage: any): Message => {
  console.log('Converting PageMessage:', pageMessage);
  console.log('PageMessage content type:', typeof pageMessage.content);
  console.log('PageMessage content:', pageMessage.content);

  // Handle content conversion more robustly
  let content = '';
  if (pageMessage.content === null || pageMessage.content === undefined) {
    content = '';
  } else if (typeof pageMessage.content === 'string') {
    content = pageMessage.content;
  } else if (typeof pageMessage.content === 'object') {
    // If it's an object, try to extract a meaningful string representation
    const objContent = pageMessage.content as any;
    if (objContent.target && objContent.target.value) {
      // Handle React event object
      content = String(objContent.target.value);
    } else if (objContent.text) {
      content = String(objContent.text);
    } else if (objContent.message) {
      content = String(objContent.message);
    } else if (objContent.content) {
      content = String(objContent.content);
    } else if (objContent.value) {
      // Sometimes the content might be in a value property
      content = String(objContent.value);
    } else {
      // Fallback: try JSON.stringify, but avoid [object Object]
      try {
        const jsonString = JSON.stringify(pageMessage.content);
        content = jsonString !== '{}' && jsonString !== '[object Object]' ? jsonString : 'Unable to display content';
      } catch (error) {
        content = 'Unable to display content';
      }
    }
  } else {
    // For numbers, booleans, etc.
    content = String(pageMessage.content);
  }

  // Final safety check - ensure we never return [object Object]
  if (content === '[object Object]') {
    content = 'Unable to display content';
  }

  const convertedMessage = {
    id: pageMessage.id,
    content: content,
    sender: pageMessage.sender,
    timestamp: pageMessage.timestamp,
    attachedFile: pageMessage.attachedFile,
    type: pageMessage.type,
    isLiked: pageMessage.isLiked,
    isDisliked: pageMessage.isDisliked
  };

  console.log('Converted Message:', convertedMessage);
  console.log('Converted content type:', typeof convertedMessage.content);
  console.log('Final content:', convertedMessage.content);
  return convertedMessage;
};

const ChatPanel = ({ onPageContentGenerated, onTitleChange, autoSendMessage, onImageGenerated }: ChatPanelProps) => {
  const {
    messages: pageMessages,
    message,
    isLoading,
    attachedFile,
    isAnalyzingImage,
    isProcessingDocument,
    handleTextareaChange,
    handleKeyDown,
    handleSendMessage,
    handleFileUpload,
    handleRemoveFile,
    getPlaceholderText
  } = usePageChatState(onPageContentGenerated, onTitleChange, autoSendMessage, onImageGenerated);

  // Create a wrapper function that matches the expected signature for ConversationUI
  const handleSendWithoutParams = () => {
    console.log('handleSendWithoutParams called');
    console.log('Current message state:', message);
    console.log('Message state type:', typeof message);
    console.log('Message state length:', message.length);
    console.log('Message trimmed:', message.trim());
    console.log('Has attached file:', !!attachedFile);
    console.log('Attached file details:', attachedFile);

    // Use the current message state directly
    const messageToSend = message || '';
    console.log('Message to send:', messageToSend);
    console.log('Message to send type:', typeof messageToSend);
    console.log('Message to send trimmed:', messageToSend.trim());

    // Check if we have content to send
    if (!messageToSend.trim() && !attachedFile) {
      console.log('No content to send, returning early');
      return;
    }

    console.log('Calling handleSendMessage with message:', messageToSend);
    console.log('File analysis will be triggered automatically if file is attached');
    handleSendMessage(messageToSend);
  };

  // Convert page messages to the format expected by ConversationUI
  const messages = pageMessages.map(convertPageMessageToMessage);

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-2xl overflow-hidden">
      <ConversationUI
        messages={messages}
        message={message}
        isLoading={isLoading}
        attachedFile={null} // Hide attachment functionality
        selectedTool={null}
        sidebarOpen={false}
        isAnalyzingImage={false} // Hide analysis indicators
        isProcessingDocument={false} // Hide processing indicators
        conversationTitle="Page Chat"
        isFavorite={false}
        showHeader={false}
        showScrollButton={false}
        showGeneratingIndicator={false}
        showEmptyChat={true}
        showTools={false}
        showFileAttachment={false}
        onToggleFavorite={() => {}}
        onNewChat={() => {}}
        onTextareaChange={handleTextareaChange}
        onKeyDown={handleKeyDown}
        onSendMessage={handleSendWithoutParams}
        onFileUpload={() => {}} // Disabled - do nothing
        onRemoveFile={() => {}} // Disabled - do nothing
        onToolSelect={() => {}}
        onRemoveTool={() => {}}
        onVoiceInput={() => {}}
        onLikeMessage={() => {}}
        onDislikeMessage={() => {}}
        onRegenerateMessage={() => {}}
        onPromptClick={() => {}}
        getPlaceholderText={getPlaceholderText}
        onImageSuggestion={() => {}}
      />
    </div>
  );
};

export default ChatPanel;
