import React from 'react'
import { FileText, CheckCircle } from 'lucide-react'
import { renderFormattedContent } from '../dashboard/utils/KaTeXRenderer'

interface PageContentPillProps {
  content: any
  timestamp: Date
}

const PageContentPill: React.FC<PageContentPillProps> = ({
  content,
  timestamp
}) => {
  // Ensure content is always a string
  const ensureStringContent = (content: any): string => {
    if (typeof content === 'string') {
      return content;
    }
    if (content === null || content === undefined) {
      return '';
    }
    if (typeof content === 'object') {
      // Try to extract meaningful content from object
      return content.text || content.message || content.content || content.body || JSON.stringify(content);
    }
    // For any other type, convert to string
    return String(content);
  };

  const stringContent = ensureStringContent(content);
  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  // Extract a title from the content (first line or first 50 characters)
  const getTitle = (text: string) => {
    // Remove markdown formatting for the title
    const cleanText = text
      .replace(/^#+\s*/gm, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links

    const lines = cleanText.split('\n');
    const firstLine = lines[0].trim();
    if (firstLine.length > 50) {
      return firstLine.substring(0, 50) + '...';
    }
    return firstLine || 'Document Content';
  }

  return (
    <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full px-4 py-2.5 text-sm shadow-sm">
      <CheckCircle className="w-5 h-5 text-green-600" />
      <span className="font-medium text-green-800">
        Page content: {getTitle(stringContent)}
        <span className="text-green-600 ml-2">
          @{formatTimestamp(timestamp)}
        </span>
      </span>
    </div>
  )
}

export default PageContentPill
