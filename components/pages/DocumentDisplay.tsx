import React, { useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { renderFormattedContent } from '../dashboard/utils/KaTeXRenderer';
import { getFontClass } from '@/lib/bengali-utils';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface DocumentDisplayRef {
  updateContent: (content: string) => void;
}

interface DocumentDisplayProps {
  onContentUpdate?: (content: string) => void;
  generatedImageUrl?: string | null;
}

const DocumentDisplay = forwardRef<DocumentDisplayRef, DocumentDisplayProps>(({ onContentUpdate, generatedImageUrl }, ref) => {
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [rawContent, setRawContent] = useState('');

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setRawContent(newContent);
    setContent(newContent);
    if (onContentUpdate) {
      onContentUpdate(newContent);
    }
  };

  const handleStartWriting = () => {
    setIsEditing(true);
    setRawContent(content);
  };

  const handleSave = () => {
    setIsEditing(false);
    setContent(rawContent);
    if (onContentUpdate) {
      onContentUpdate(rawContent);
    }
  };

  const updateContent = (newContent: string) => {
    setContent(newContent);
    setRawContent(newContent);
    // Don't automatically go into edit mode - stay in preview
    if (onContentUpdate) {
      onContentUpdate(newContent);
    }
  };

  useImperativeHandle(ref, () => ({
    updateContent
  }));

  if (!isEditing && content === '') {
    return (
      <div className="flex items-center justify-center h-full">
        <button
          onClick={handleStartWriting}
          className="text-2xl font-bold text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          Start writing
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {generatedImageUrl && (
        <div className="w-full h-48 bg-gray-200 mb-4 shrink-0 rounded-lg overflow-hidden">
          <img src={generatedImageUrl} alt="Generated page header" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex-grow relative">
        {/* Save button - only show when editing */}
        {isEditing && (
          <div className="absolute top-2 right-2 z-50">
            <Button
              onClick={handleSave}
              variant="ghost"
              size="icon"
              className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              title="Save changes"
            >
              <Save className="w-4 h-4" />
            </Button>
          </div>
        )}

        {isEditing ? (
          <div className="w-full h-full">
            <textarea
              value={rawContent}
              onChange={handleContentChange}
              className="w-full h-full p-2 border-none resize-none focus:outline-none text-base"
              placeholder="Start writing..."
            />
          </div>
        ) : (
          <div 
            className={`w-full h-full p-6 overflow-y-auto text-base leading-relaxed transition-opacity duration-150 opacity-100 ${getFontClass(content)} cursor-text`}
            onClick={handleStartWriting}
          >
            <div className="content">
              {content ? renderFormattedContent(content, 'ai') : <p className="text-gray-500">Click to start writing...</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

DocumentDisplay.displayName = 'DocumentDisplay';

export default DocumentDisplay;
