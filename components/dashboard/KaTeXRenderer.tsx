import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import React from 'react';
import { renderContentWithCodeBlocks } from './CodeBlockDetector';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Function to format inline text (bold, italic, etc.)
export const formatInlineText = (text: string) => {
  // Handle images [IMAGE:base64data]
  text = text.replace(/\[IMAGE:(.*?)\]/g, (match, base64Data) => {
    console.log('Image match found:', match);
    console.log('Base64 data length:', base64Data.length);
    return `<img src="data:image/jpeg;base64,${base64Data}" alt="Generated Image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0; display: block;" />`;
  });

  // Handle bold text (**text**)
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Handle italic text (*text* or _text_)
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  text = text.replace(/_(.*?)_/g, '<em>$1</em>');

  // Handle code inline (`code`)
  text = text.replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>');

  // Handle strikethrough (~~text~~)
  text = text.replace(/~~(.*?)~~/g, '<del class="line-through">$1</del>');

  return <span dangerouslySetInnerHTML={{ __html: text }} />;
};

// Function to parse and render markdown tables
const parseTable = (tableText: string) => {
  const lines = tableText.trim().split('\n').filter(line => line.trim());
  if (lines.length < 3) return null; // Need header, separator, and at least one data row

  // Parse header row - preserve empty cells
  const headerRow = lines[0].split('|').map(cell => cell.trim());
  
  // Check if second line is a separator (contains dashes and pipes)
  const separatorLine = lines[1];
  if (!separatorLine.includes('|') || !separatorLine.includes('-')) {
    return null; // Not a valid table
  }
  
  // Parse data rows (skip header and separator) - preserve empty cells
  const dataRows = lines.slice(2).map(line => 
    line.split('|').map(cell => cell.trim())
  ).filter(row => row.some(cell => cell.length > 0)); // Only filter out completely empty rows

  if (headerRow.length === 0 || dataRows.length === 0) {
    return null;
  }

  return { headerRow, dataRows };
};

// Function to format text without table detection (to avoid recursion)
const formatTextWithoutTables = (text: string) => {
  // Split by double line breaks for paragraphs
  const paragraphs = text.split(/\n\n+/);

  return paragraphs.map((paragraph, pIndex) => {
    if (paragraph.trim() === '') return null;

    // Split by single line breaks for line breaks
    const lines = paragraph.split(/\n/);

    return (
      <div key={pIndex} className={pIndex > 0 ? 'mt-4' : ''}>
        {lines.map((line, lIndex) => {
          if (line.trim() === '') return null;

          // Check for headers (lines starting with #)
          if (line.match(/^#{1,6}\s/)) {
            const level = line.match(/^(#{1,6})\s/)?.[1].length || 1;
            const headerText = line.replace(/^#{1,6}\s/, '');
            const headerClass = level === 1 ? 'text-xl font-bold' :
              level === 2 ? 'text-lg font-semibold' :
                level === 3 ? 'text-base font-medium' : 'text-sm font-medium';
            return (
              <div key={lIndex} className={`${headerClass} mb-2 mt-4 ${lIndex > 0 ? 'mt-2' : ''}`}>
                {formatInlineText(headerText)}
              </div>
            );
          }

          // Check for bullet points
          if (line.match(/^[-*+]\s/)) {
            const bulletText = line.replace(/^[-*+]\s/, '');
            return (
              <div key={lIndex} className="flex items-start mb-1">
                <span className="mr-2 mt-1 text-gray-500">•</span>
                <span>{formatInlineText(bulletText)}</span>
              </div>
            );
          }

          // Check for numbered lists
          if (line.match(/^\d+\.\s/)) {
            const match = line.match(/^(\d+)\.\s/);
            const number = match ? parseInt(match[1]) : 1;
            const numberedText = line.replace(/^\d+\.\s/, '');
            return (
              <div key={lIndex} className="flex items-start mb-1">
                <span className="mr-2 mt-1 text-gray-500 text-sm">{number}.</span>
                <span>{formatInlineText(numberedText)}</span>
              </div>
            );
          }

          // Check for code blocks (lines starting with 4 spaces or tab)
          if (line.match(/^(\s{4}|\t)/)) {
            const codeText = line.replace(/^(\s{4}|\t)/, '');
            return (
              <div key={lIndex} className="bg-gray-100 rounded px-2 py-1 font-mono text-sm my-1">
                {codeText}
              </div>
            );
          }

          // Regular text with inline formatting
          return (
            <div key={lIndex} className={`${lIndex > 0 ? 'mt-1' : ''}`}>
              {formatInlineText(line)}
            </div>
          );
        })}
      </div>
    );
  });
};

// Function to detect and render tables
const renderTables = (text: string) => {
  // Simple table detection - look for lines that start and end with |
  const lines = text.split('\n');
  const tableLines: string[] = [];
  const nonTableLines: string[] = [];
  const result: React.ReactNode[] = [];
  
  let inTable = false;
  let tableStartIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Check if this line looks like a table row
    if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableStartIndex = i;
      }
      tableLines.push(line);
    } else {
      if (inTable) {
        // We were in a table, now we're not
        inTable = false;
        
        // Try to parse the table we just found
        const tableText = tableLines.join('\n');
        const tableData = parseTable(tableText);
        
        if (tableData) {
          // Add any non-table text before the table
          if (nonTableLines.length > 0) {
            result.push(<span key={`text-before-${tableStartIndex}`}>{formatTextWithoutTables(nonTableLines.join('\n'))}</span>);
            nonTableLines.length = 0;
          }
          
          // Add the table
          result.push(
            <div key={`table-${tableStartIndex}`} className="my-4 overflow-x-auto border rounded-lg" data-original-table={tableText}>
              <Table>
                <TableHeader>
                  <TableRow>
                    {tableData.headerRow.map((header, hIndex) => (
                      <TableHead key={hIndex} className="bg-gray-50">{formatInlineText(header)}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.dataRows.map((row, rIndex) => (
                    <TableRow key={rIndex} className="hover:bg-gray-50">
                      {row.map((cell, cIndex) => (
                        <TableCell key={cIndex}>{formatInlineText(cell)}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          );
        } else {
          // Not a valid table, add as regular text
          nonTableLines.push(...tableLines);
        }
        
        tableLines.length = 0;
      }
      nonTableLines.push(line);
    }
  }
  
  // Handle any remaining table at the end
  if (inTable && tableLines.length > 0) {
    const tableText = tableLines.join('\n');
    const tableData = parseTable(tableText);
    
    if (tableData) {
      if (nonTableLines.length > 0) {
        result.push(<span key="text-before-end">{formatTextWithoutTables(nonTableLines.join('\n'))}</span>);
      }
      
      result.push(
        <div key="table-end" className="my-4 overflow-x-auto border rounded-lg" data-original-table={tableText}>
          <Table>
            <TableHeader>
              <TableRow>
                {tableData.headerRow.map((header, hIndex) => (
                  <TableHead key={hIndex} className="bg-gray-50">{formatInlineText(header)}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.dataRows.map((row, rIndex) => (
                <TableRow key={rIndex} className="hover:bg-gray-50">
                  {row.map((cell, cIndex) => (
                    <TableCell key={cIndex}>{formatInlineText(cell)}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    } else {
      nonTableLines.push(...tableLines);
    }
  }
  
  // Add any remaining non-table text
  if (nonTableLines.length > 0) {
    result.push(<span key="text-end">{formatTextWithoutTables(nonTableLines.join('\n'))}</span>);
  }
  
  return result;
};

// Function to format text with proper spacing and formatting
export const formatText = (text: string) => {
  // Check if text contains table markers
  if (text.includes('|')) {
    return renderTables(text);
  }

  // Split by double line breaks for paragraphs
  const paragraphs = text.split(/\n\n+/);

  return paragraphs.map((paragraph, pIndex) => {
    if (paragraph.trim() === '') return null;

    // Split by single line breaks for line breaks
    const lines = paragraph.split(/\n/);

    return (
      <div key={pIndex} className={pIndex > 0 ? 'mt-4' : ''}>
        {lines.map((line, lIndex) => {
          if (line.trim() === '') return null;

          // Check for headers (lines starting with #)
          if (line.match(/^#{1,6}\s/)) {
            const level = line.match(/^(#{1,6})\s/)?.[1].length || 1;
            const headerText = line.replace(/^#{1,6}\s/, '');
            const headerClass = level === 1 ? 'text-xl font-bold' :
              level === 2 ? 'text-lg font-semibold' :
                level === 3 ? 'text-base font-medium' : 'text-sm font-medium';
            return (
              <div key={lIndex} className={`${headerClass} mb-2 mt-4 ${lIndex > 0 ? 'mt-2' : ''}`}>
                {formatInlineText(headerText)}
              </div>
            );
          }

          // Check for bullet points
          if (line.match(/^[-*+]\s/)) {
            const bulletText = line.replace(/^[-*+]\s/, '');
            return (
              <div key={lIndex} className="flex items-start mb-1">
                <span className="mr-2 mt-1 text-gray-500">•</span>
                <span>{formatInlineText(bulletText)}</span>
              </div>
            );
          }

          // Check for numbered lists
          if (line.match(/^\d+\.\s/)) {
            const match = line.match(/^(\d+)\.\s/);
            const number = match ? parseInt(match[1]) : 1;
            const numberedText = line.replace(/^\d+\.\s/, '');
            return (
              <div key={lIndex} className="flex items-start mb-1">
                <span className="mr-2 mt-1 text-gray-500 text-sm">{number}.</span>
                <span>{formatInlineText(numberedText)}</span>
              </div>
            );
          }

          // Check for code blocks (lines starting with 4 spaces or tab)
          if (line.match(/^(\s{4}|\t)/)) {
            const codeText = line.replace(/^(\s{4}|\t)/, '');
            return (
              <div key={lIndex} className="bg-gray-100 rounded px-2 py-1 font-mono text-sm my-1">
                {codeText}
              </div>
            );
          }

          // Regular text with inline formatting
          return (
            <div key={lIndex} className={`${lIndex > 0 ? 'mt-1' : ''}`}>
              {formatInlineText(line)}
            </div>
          );
        })}
      </div>
    );
  });
};

// Main function to render formatted content with KaTeX support
export function renderFormattedContent(content: string, sender: 'user' | 'ai') {
  // Unescape double backslashes for AI messages so \[...\] and \(...\) work
  if (sender === 'ai') {
    content = content.replace(/\\\\/g, '\\');
  }
  
  // Check if content contains code blocks (```)
  if (content.includes('```')) {
    return renderContentWithCodeBlocks(content, sender);
  }
  
  // Improved regex to split on all common math delimiters with better edge case handling
  const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]*?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/);
  return parts.map((part, index) => {
    // Block math: $$...$$ or \[...\]
    if ((part.startsWith('$$') && part.endsWith('$$')) || (part.startsWith('\\[') && part.endsWith('\\]'))) {
      const math = part.startsWith('$$') ? part.slice(2, -2) : part.slice(2, -2);
      // Clean up the math content and ensure it's valid
      const cleanMath = math.trim().replace(/\s+/g, ' ');
      return sender === 'ai' ? (
        <div key={index} className="my-4 flex justify-center">
          <div data-original-math={cleanMath}>
            <BlockMath math={cleanMath} />
          </div>
        </div>
      ) : (
        <div key={index} className="my-4">
          <div data-original-math={cleanMath}>
            <BlockMath math={cleanMath} />
          </div>
        </div>
      );
    }
    // Inline math: $...$ or \(...\)
    else if ((part.startsWith('$') && part.endsWith('$')) || (part.startsWith('\\(') && part.endsWith('\\)'))) {
      const math = part.startsWith('$') ? part.slice(1, -1) : part.slice(2, -2);
      // Clean up the math content and ensure it's valid
      const cleanMath = math.trim().replace(/\s+/g, ' ');
      return sender === 'ai' ? (
        <span key={index} className="flex justify-center">
          <span data-original-math={cleanMath}>
            <InlineMath math={cleanMath} />
          </span>
        </span>
      ) : (
        <span key={index} data-original-math={cleanMath}>
          <InlineMath math={cleanMath} />
        </span>
      );
    } else {
      // Regular text with formatting
      return <span key={index}>{formatText(part)}</span>;
    }
  });
} 