import { useState, useCallback, useEffect } from "react";
import { generateUniqueId } from "@/lib/utils";
import { pagesAIService } from "@/app/services/PagesAIService";
import { useFileAnalysis } from "./useFileAnalysis";
import { 
  PageConversation, 
  PageMessage, 
  createPageConversation, 
  getPageConversation, 
  updatePageConversation, 
  addMessageToPageConversation,
  updateMessageInPageConversation
} from "@/lib/page-storage";
import { useRouter, useSearchParams } from "next/navigation";
import { getAPIKey } from '@/lib/api-keys';

export function usePageChatState(
  onPageContentGenerated?: (pageContent: string) => void,
  onTitleChange?: (title: string) => void,
  autoSendMessage?: string,
  onImageGenerated?: (imageUrl: string) => void
) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageId = searchParams.get('page');
  
  const [currentPage, setCurrentPage] = useState<PageConversation | null>(null);
  const [messages, setMessages] = useState<PageMessage[]>([]);
  const [message, setMessage] = useState(""); // Current message being typed

  // Custom setter for message to add debugging
  const debugSetMessage = (newMessage: string) => {
    console.log('setMessage called with:', newMessage, 'Previous message was:', message);
    setMessage(newMessage);
  };
  const [isLoading, setIsLoading] = useState(false);

  const [attachedFile, setAttachedFile] = useState<{ file: File; preview: string; type: 'image' | 'document' | 'pdf' | 'excel' | 'csv'; description?: string } | null>(null);

  const [isAutoSending, setIsAutoSending] = useState(false);
  
  // Use the existing file analysis functionality
  const { analyzeFile, isAnalyzingImage, isProcessingDocument } = useFileAnalysis();

  // Load existing page conversation on mount
  useEffect(() => {
    if (pageId) {
      // Load existing page conversation
      const existingPage = getPageConversation(pageId);
      if (existingPage) {
        setCurrentPage(existingPage);
        // Only set messages if we don't have any current messages (to preserve streaming state)
        if (messages.length === 0) {
          setMessages(existingPage.messages);
        }
        if (onTitleChange) {
          onTitleChange(existingPage.title);
        }
      }
      // If page not found, don't create a new one - just stay on the page without a conversation
    }
    // If no pageId, don't create a new page conversation - wait for first message
  }, [pageId, onTitleChange, messages.length]);

  // Auto-send message when provided
  useEffect(() => {
    if (autoSendMessage && !isLoading && messages.length === 0) {
      debugSetMessage(autoSendMessage);
      setIsAutoSending(true);
    }
  }, [autoSendMessage, isLoading, messages.length]);

  // Effect to send message after state update
  useEffect(() => {
    if (isAutoSending && message) {
      handleSendMessage();
      setIsAutoSending(false);
    }
  }, [isAutoSending, message]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log('handleTextareaChange called with value:', e.target.value);
    debugSetMessage(e.target.value);
  };

  const handleSendMessage = async (messageContent?: string) => {
    console.log('handleSendMessage called with messageContent:', messageContent);
    console.log('Current message state:', message);
    console.log('Attached file:', attachedFile);

    // Handle message content more robustly
    let contentToSend = '';
    const rawMessage = messageContent || message || "";

    console.log('Raw message:', rawMessage);
    console.log('Raw message type:', typeof rawMessage);

    if (typeof rawMessage === 'string') {
      contentToSend = rawMessage;
    } else if (typeof rawMessage === 'object' && rawMessage !== null) {
      // If it's an object, try to extract text content
      const objMessage = rawMessage as any;
      if (objMessage.target && objMessage.target.value) {
        // Handle React event object
        contentToSend = String(objMessage.target.value);
      } else if (objMessage.text) {
        contentToSend = String(objMessage.text);
      } else if (objMessage.message) {
        contentToSend = String(objMessage.message);
      } else if (objMessage.content) {
        contentToSend = String(objMessage.content);
      } else {
        contentToSend = String(rawMessage);
      }
    } else {
      contentToSend = String(rawMessage);
    }

    console.log('Content to send after processing:', contentToSend);
    console.log('Content to send trimmed:', contentToSend.trim());

    // Analyze attached file if present
    let fileAnalysis = '';
    if (attachedFile && attachedFile.file) {
      console.log('Analyzing attached file:', attachedFile.file.name, 'Type:', attachedFile.type);
      try {
        fileAnalysis = await analyzeFile(attachedFile.file, contentToSend || 'Please analyze this file and provide relevant information.');
        console.log('File analysis result:', fileAnalysis);
      } catch (error) {
        console.error('Error analyzing file:', error);
        fileAnalysis = `Error analyzing file: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }

    // Combine text content with file analysis
    let finalContent = contentToSend;
    if (fileAnalysis) {
      if (finalContent.trim()) {
        finalContent = `${finalContent}\n\n[File Analysis: ${attachedFile?.file?.name}]\n${fileAnalysis}`;
      } else {
        finalContent = `[File Analysis: ${attachedFile?.file?.name}]\n${fileAnalysis}`;
      }
    }

    console.log('Final content to send:', finalContent);

    if (!finalContent.trim()) {
      console.log('No content to send after file analysis, returning early');
      return;
    }

    let pageToUse = currentPage;
    if (!pageToUse) {
      pageToUse = createPageConversation();
      setCurrentPage(pageToUse);
      router.replace(`/pages?page=${pageToUse.id}`);
    }

    // Final safety check before creating the message
    if (typeof finalContent !== 'string') {
      console.error('ERROR: finalContent is not a string:', finalContent);
      console.error('finalContent type:', typeof finalContent);
      finalContent = String(finalContent || '');
    }

    const userMessage: PageMessage = {
      id: generateUniqueId('user'),
      content: finalContent,
      sender: 'user',
      timestamp: new Date(),
      attachedFile: attachedFile || undefined,
      type: 'regular'
    };

    console.log('Created userMessage:', userMessage);
    console.log('userMessage content type:', typeof userMessage.content);
    console.log('userMessage content:', userMessage.content);
    console.log('userMessage content length:', userMessage.content.length);
    console.log('Original message input type:', typeof rawMessage);
    console.log('Original message input:', rawMessage);
    console.log('Message state value:', message);
    console.log('Message state type:', typeof message);

    // Additional debugging for object content
    if (typeof userMessage.content === 'object') {
      console.error('ERROR: userMessage.content is still an object:', userMessage.content);
      console.error('Object keys:', Object.keys(userMessage.content));
      console.error('Object prototype:', Object.getPrototypeOf(userMessage.content));
    }

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    // Clear the message input if we're sending the current input value
    // Only clear if the content to send matches the current message state
    if (contentToSend === message && contentToSend.trim()) {
      console.log('Clearing message input after sending');
      debugSetMessage("");
    } else {
      console.log('Not clearing message input. Content to send:', contentToSend, 'Current message:', message);
      // If the content is empty but we have an attached file, still clear the input
      if (!contentToSend.trim() && attachedFile) {
        console.log('Clearing message input due to attached file');
        debugSetMessage("");
      }
    }

    // Set loading state and don't clear attachedFile yet (will be cleared after analysis)
    setIsLoading(true);

    // Note: attachedFile will be cleared after successful message processing

    await addMessageToPageConversation(pageToUse.id, userMessage);

    const aiMessageId = generateUniqueId('ai');
    const aiMessage: PageMessage = {
      id: aiMessageId,
      content: '',
      sender: 'ai',
      timestamp: new Date(),
      type: 'regular'
    };
    setMessages(prev => [...prev, aiMessage]);

    try {
      let fullContent = '';
      const conversationHistory = newMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: typeof msg.content === 'string' ? msg.content : String(msg.content || '')
      }));

      console.log('Sending to AI - Final content:', finalContent);
      console.log('Conversation history length:', conversationHistory.length);
      if (conversationHistory.length > 0) {
        console.log('Last message in history:', conversationHistory[conversationHistory.length - 1].content);
      }

      await pagesAIService.streamMessage(
        finalContent,
        conversationHistory,
        (chunk: string) => {
          fullContent += chunk;
          setMessages(prevMessages =>
            prevMessages.map(msg =>
              msg.id === aiMessageId ? { ...msg, content: fullContent } : msg
            )
          );
        },
        (pageContent: string) => {
          if (onPageContentGenerated) {
            onPageContentGenerated(pageContent);
          }
          setMessages(prevMessages => prevMessages.filter(msg => msg.id !== aiMessageId));
          const pageContentMessage: PageMessage = {
            id: generateUniqueId('ai'),
            content: pageContent,
            sender: 'ai',
            timestamp: new Date(),
            type: 'page-content',

          };
          setMessages(prevMessages => [...prevMessages, pageContentMessage]);
          addMessageToPageConversation(pageToUse!.id, pageContentMessage);
          updatePageConversation(pageToUse!.id, { pageContent });
          if (onTitleChange && pageContent) {
            const titleMatch = pageContent.match(/^#\s+(.+)$/m);
            if (titleMatch) {
              const generatedTitle = titleMatch[1].trim();
              onTitleChange(generatedTitle);
              updatePageConversation(pageToUse!.id, { title: generatedTitle });
            } else {
              const firstWords = pageContent.replace(/[#*`]/g, '').trim().split(/\s+/).slice(0, 4).join(' ');
              if (firstWords.length > 3) {
                onTitleChange(firstWords);
                updatePageConversation(pageToUse!.id, { title: firstWords });
              }
            }
          }
        },
        (fullResponse: string) => {
          if (!fullResponse.includes('<PAGE>')) {
            const finalAiMessage: PageMessage = {
              id: aiMessageId,
              content: fullResponse,
              sender: 'ai',
              timestamp: new Date(),
              type: 'regular'
            };
            addMessageToPageConversation(pageToUse!.id, finalAiMessage);
          }
        }
      );

      // Clear attached file after successful processing
      console.log('Clearing attached file after successful message processing');
      setAttachedFile(null);

    } catch (error) {
      console.error("Error streaming message:", error);
      const errorMessage: PageMessage = {
        id: aiMessageId,
        content: "Sorry, I couldn't get a response. Please try again.",
        sender: 'ai',
        timestamp: new Date(),
        type: 'regular'
      };
      setMessages(prevMessages => prevMessages.map(msg => msg.id === aiMessageId ? errorMessage : msg));
      await addMessageToPageConversation(pageToUse!.id, errorMessage);
      // Don't clear attachedFile on error so user can retry
      setAttachedFile(attachedFile);
    } finally {
      setIsLoading(false);
    }
  };



  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      console.log('Enter key pressed, calling handleSendMessage with current message:', message);
      handleSendMessage(message);
    }
  };

  const handleFileUpload = (file: { file: File; preview: string; type: 'image' | 'document' | 'pdf' | 'excel' | 'csv' }) => {
    setAttachedFile(file);
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
  };



  const getPlaceholderText = () => {
    return "Message...";
  };

  return {
    currentPage,
    messages,
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
  };
}
