import React, { useRef, useState, useEffect } from 'react';
import DocumentDisplay, { DocumentDisplayRef } from './DocumentDisplay';
import ChatPanel from './ChatPanel';
import PageHeader from './PageHeader';
import SidebarOverlay from '../dashboard/layout/SidebarOverlay';
import { useSearchParams } from 'next/navigation';
import { getPageConversation, updatePageConversation } from '@/lib/page-storage';

interface PageViewProps {
  sidebarOpen: boolean;
  sidebarDocked: boolean;
  onToggleSidebar: () => void;
  onToggleDock: () => void;
  onCloseSidebar: () => void;
  onNewTask: () => void;
  onNewPage: () => void;
  onDeletePage: () => void;
  title?: string;
  onTitleChange?: (title: string) => void;
}

const PageView: React.FC<PageViewProps> = ({
  sidebarOpen,
  sidebarDocked,
  onToggleSidebar,
  onToggleDock,
  onCloseSidebar,
  onNewTask,
  onNewPage,
  onDeletePage,
  title,
  onTitleChange,
}) => {
  const documentRef = useRef<DocumentDisplayRef>(null);
  const [pageTitle, setPageTitle] = useState(title || "Untitled page");
  const [pageContent, setPageContent] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [autoSendMessage, setAutoSendMessage] = useState<string | undefined>(undefined);
  const searchParams = useSearchParams();
  const pageId = searchParams.get('page');
  const canvasContent = searchParams.get('canvas');
  const shouldSend = searchParams.get('send') === 'true';

  // Reset auto-send message state when pageId changes
  useEffect(() => {
    setAutoSendMessage(undefined);
  }, [pageId]);

  const handleImageGenerated = (imageUrl: string) => {
    setGeneratedImageUrl(imageUrl);
  };

  const handlePageContentGenerated = (pageContent: string) => {
    if (documentRef.current) {
      documentRef.current.updateContent(pageContent);
    }
    setPageContent(pageContent);
  };

  const handleTitleChange = (newTitle: string) => {
    console.log('PageView received title change:', newTitle);
    setPageTitle(newTitle);
    onTitleChange?.(newTitle);
  };

  // Handle canvas content by sending it to AI instead of loading directly
  useEffect(() => {
    if (canvasContent && shouldSend && !autoSendMessage) {
      // Decode the canvas content from URL
      const decodedContent = decodeURIComponent(canvasContent);
      console.log('Canvas content from URL, sending to AI:', decodedContent);
      
      // Create a message instructing AI to put the content in the page view
      const aiMessage = `Please put this content in the page view: ${decodedContent}`;
      setAutoSendMessage(aiMessage);
    } else if (pageId && !canvasContent) {
      const existingPage = getPageConversation(pageId);
      if (existingPage && existingPage.pageContent && documentRef.current) {
        console.log('Loading existing page content:', existingPage.pageContent);
        documentRef.current.updateContent(existingPage.pageContent);
        if (existingPage.title && onTitleChange) {
          onTitleChange(existingPage.title);
        }
        if (existingPage.generatedImageUrl) {
          setGeneratedImageUrl(existingPage.generatedImageUrl);
        }
      }
    }
  }, [pageId, canvasContent, shouldSend, onTitleChange]);

  return (
    <div className="flex flex-col h-screen bg-white">
      <SidebarOverlay
        sidebarOpen={sidebarOpen}
        sidebarDocked={sidebarDocked}
        closeTimeout={null}
        onCloseSidebar={onCloseSidebar}
        onSetCloseTimeout={() => {}}
      />
      <PageHeader
        onToggleSidebar={onToggleSidebar}
        sidebarOpen={sidebarOpen}
        onNewTask={onNewTask}
        onNewPage={onNewPage}
        onDeletePage={onDeletePage}
        title={pageTitle}
        onTitleChange={handleTitleChange}
        pageContent={pageContent}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-2/3 p-8 overflow-y-auto">
          <DocumentDisplay 
            ref={documentRef} 
            onContentUpdate={setPageContent}
            generatedImageUrl={generatedImageUrl}
          />
        </div>
        <div className="w-1/3 p-4">
          <ChatPanel 
            onPageContentGenerated={handlePageContentGenerated} 
            onTitleChange={handleTitleChange}
            autoSendMessage={autoSendMessage}
            onImageGenerated={handleImageGenerated}
          />
        </div>
      </div>
    </div>
  );
};

export default PageView;
