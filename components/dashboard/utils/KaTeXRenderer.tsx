import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import React from 'react';
import { renderContentWithCodeBlocks } from './CodeBlockDetector';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import MonacoEditor from '../features/MonacoEditor';

// Function to format inline text (bold, italic, etc.)
// This function will now primarily handle non-standard markdown elements like custom image tags
export const formatInlineText = (text: string) => {
  // Handle images [IMAGE:base64data]
  text = text.replace(/\[IMAGE:(.*?)\]/g, (match, base64Data) => {
    console.log('Image match found:', match);
    console.log('Base64 data length:', base64Data.length);
    return `<img src="data:image/jpeg;base64,${base64Data}" alt="Generated Image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0; display: block;" />`;
  });

  // No need to handle bold, italic, code inline, strikethrough here anymore
  // react-markdown will handle these

  return <span dangerouslySetInnerHTML={{ __html: text }} />;
};

// Pre-process content to replace math expressions with custom components
function preprocessMathExpressions(content: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  // Regex for block math: $$...$$
  const blockMathRegex = /\$\$([\s\S]*?)\$\$/g;
  let blockMathMatch;
  
  while ((blockMathMatch = blockMathRegex.exec(content)) !== null) {
    // Add text before the math
    if (blockMathMatch.index > lastIndex) {
      const textBefore = content.slice(lastIndex, blockMathMatch.index);
      if (textBefore.trim()) {
        parts.push(textBefore);
      }
    }
    
    // Add the math block
    const mathContent = blockMathMatch[1].trim();
    parts.push(
      <div key={`block-${parts.length}`} className="my-4 flex justify-center">
        <BlockMath math={mathContent} />
      </div>
    );
    
    lastIndex = blockMathMatch.index + blockMathMatch[0].length;
  }
  
  // Add remaining text
  if (lastIndex < content.length) {
    const remainingText = content.slice(lastIndex);
    if (remainingText.trim()) {
      parts.push(remainingText);
    }
  }
  
  return parts;
}

// Process inline math expressions within text
function processInlineMath(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  // Regex for inline math: $...$ (but not $$...$$)
  const inlineMathRegex = /(?<!\$)\$([^\$\n]+?)\$(?!\$)/g;
  let inlineMathMatch;
  
  while ((inlineMathMatch = inlineMathRegex.exec(text)) !== null) {
    // Add text before the math
    if (inlineMathMatch.index > lastIndex) {
      const textBefore = text.slice(lastIndex, inlineMathMatch.index);
      if (textBefore) {
        parts.push(textBefore);
      }
    }
    
    // Add the inline math
    const mathContent = inlineMathMatch[1].trim();
    parts.push(
      <InlineMath key={`inline-${parts.length}`} math={mathContent} />
    );
    
    lastIndex = inlineMathMatch.index + inlineMathMatch[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    if (remainingText) {
      parts.push(remainingText);
    }
  }
  
  return parts;
}

// Main function to render formatted content with KaTeX support
export function renderFormattedContent(content: any, sender: 'user' | 'ai') {
  // Ensure content is always a string
  let stringContent = '';
  if (typeof content === 'string') {
    stringContent = content;
  } else if (content === null || content === undefined) {
    stringContent = '';
  } else if (typeof content === 'object') {
    // Try to extract meaningful content from object
    stringContent = content.text || content.message || content.content || content.body || JSON.stringify(content);
    // If JSON.stringify gives us [object Object], try to get a better representation
    if (stringContent === '[object Object]') {
      stringContent = `Object: ${Object.keys(content).join(', ')}`;
    }
  } else {
    // For any other type, convert to string
    stringContent = String(content);
  }

  // Unescape double backslashes for AI messages so \\[...\\] and \\(...\\) work
  if (sender === 'ai') {
    stringContent = stringContent.replace(/\\\\/g, '\\');
  }

  // First, split content by block math expressions
  const blockMathParts = preprocessMathExpressions(stringContent);
  
  // Process each part for inline math
  const processedParts = blockMathParts.map((part, index) => {
    if (typeof part === 'string') {
      const inlineMathParts = processInlineMath(part);
      if (inlineMathParts.length === 1 && typeof inlineMathParts[0] === 'string') {
        // No inline math found, render as markdown
        return (
          <ReactMarkdown
            key={`markdown-${index}`}
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom renderer for paragraphs to apply proper spacing
              p: ({ node, ...props }: any) => <p className="mb-4" {...props} />,

              // Custom renderers for headings
              h1: ({ node, ...props }: any) => <h1 className="text-2xl font-medium mb-2 mt-4" {...props} />,
              h2: ({ node, ...props }: any) => <h2 className="text-xl font-medium mb-2 mt-4" {...props} />,
              h3: ({ node, ...props }: any) => <h3 className="text-lg font-medium mb-2 mt-4" {...props} />,
              h4: ({ node, ...props }: any) => <h4 className="text-base font-medium mb-2 mt-4" {...props} />,
              h5: ({ node, ...props }: any) => <h5 className="text-sm font-medium mb-2 mt-4" {...props} />,
              h6: ({ node, ...props }: any) => <h6 className="text-xs font-medium mb-2 mt-4" {...props} />,

              // Custom renderer for horizontal rules
              hr: ({ node, ...props }: any) => <hr className="my-4 bg-gray-400 h-px border-none" {...props} />,

              // Custom renderer for lists (ul and ol)
              ul: ({ node, ...props }: any) => <ul className="list-disc pl-5 mb-2" {...props} />,
              ol: ({ node, ...props }: any) => <ol className="list-decimal pl-5 mb-2" {...props} />,
              li: ({ node, ...props }: any) => <li className="mb-1" {...props} />,

              // Custom renderer for strong (bold) text
              strong: ({ node, ...props }: any) => <strong className="font-medium" {...props} />,

              // Custom renderer for inline code (`) and code blocks (```)
              code: ({ node, inline, className, children, ...props }: any) => {
                const match = /language-(\w+)/.exec(className || '');
                if (inline) {
                  return <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>;
                } else if (match) {
                  const language = match[1];
                  const code = String(children).replace(/\n$/, '');
                  return (
                    <div className="my-4">
                      <MonacoEditor
                        code={code}
                        language={language}
                        height={`${Math.max(200, Math.min(600, code.split('\n').length * 20))}px`}
                        readOnly={true}
                        showActions={true}
                        onCopy={() => console.log('Code copied')}
                        onDownload={() => console.log('Code downloaded')}
                        onRun={() => console.log('Code run')}
                      />
                    </div>
                  );
                } else {
                  return <code className="bg-gray-100 px-2 py-1 font-mono text-sm my-1" {...props}>{children}</code>;
                }
              },

              // Custom renderer for tables using @/components/ui/table components
              table: ({ node, ...props }: any) => (
                <div className="my-4 overflow-x-auto border rounded-lg">
                  <Table {...props} />
                </div>
              ),
              thead: ({ node, ...props }: any) => <TableHeader {...props} />,
              tbody: ({ node, ...props }: any) => <TableBody {...props} />,
              tr: ({ node, ...props }: any) => <TableRow {...props} />,
              th: ({ node, ...props }: any) => <TableHead className="bg-gray-50" {...props} />,
              td: ({ node, ...props }: any) => <TableCell {...props} />,
            }}
          >
            {part}
          </ReactMarkdown>
        );
      } else {
        // Inline math found, render mixed content
        return (
          <span key={`mixed-${index}`}>
            {inlineMathParts.map((inlinePart, inlineIndex) => {
              if (typeof inlinePart === 'string') {
                return (
                  <ReactMarkdown
                    key={`inline-markdown-${index}-${inlineIndex}`}
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ node, ...props }: any) => <span {...props} />,
                      strong: ({ node, ...props }: any) => <strong className="font-medium" {...props} />,
                      code: ({ node, inline, className, children, ...props }: any) => {
                        if (inline) {
                          return <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>;
                        }
                        return <code className="bg-gray-100 px-2 py-1 font-mono text-sm my-1" {...props}>{children}</code>;
                      },
                    }}
                  >
                    {inlinePart}
                  </ReactMarkdown>
                );
              }
              return inlinePart;
            })}
          </span>
        );
      }
    }
    return part;
  });

  return <>{processedParts}</>;
} 