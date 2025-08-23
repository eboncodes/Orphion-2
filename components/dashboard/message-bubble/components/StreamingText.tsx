"use client"

import React, { useState, useEffect, useRef } from 'react';
import { renderFormattedContent } from '../../utils/KaTeXRenderer'
import MonacoEditor from '../../features/MonacoEditor'

const useStreamingChunks = (text: string) => {
  const [chunks, setChunks] = useState<string[]>([]);
  const [animatedChunks, setAnimatedChunks] = useState<string[]>([]);
  const prevTextRef = useRef('');

  useEffect(() => {
    const prevText = prevTextRef.current;
    if (text.startsWith(prevText)) {
      const newChunk = text.substring(prevText.length);
      if (newChunk) {
        setChunks(prev => [...prev, newChunk]);
        // Add new chunk to animated chunks with a slight delay
        setTimeout(() => {
          setAnimatedChunks(prev => [...prev, newChunk]);
        }, 50);
      }
    } else {
      // Text has changed completely, reset
      setChunks([text]);
      setAnimatedChunks([text]);
    }
    prevTextRef.current = text;
  }, [text]);

  return { chunks, animatedChunks };
};

interface StreamingTextProps {
  text: string;
}

export default function StreamingText({ text }: StreamingTextProps) {
  // Clean the text first to remove all special tags
  const cleanedText = text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>/gi, '')
    .replace(/<\/think>/gi, '')
    .replace(/<SEARCHREQUEST>.*?<\/SEARCHREQUEST>/gi, '')
    .replace(/<TEXT[_\s]?FILE\b[^>]*>[\s\S]*?<\/TEXT[_\s]?FILE>/gi, '')
    .replace(/<TASK_CREATE>.*?<\/TASK_CREATE>/gi, '')
    .replace(/<PAGE>[\s\S]*?<\/PAGE>/gi, '')
    .replace(/<IMG>.*?<\/IMG>/gi, '')
    .trim();

  // Parse the content into text and (possibly open) code segments so code can stream inside Monaco
  const segments = React.useMemo(() => {
    type Segment = { type: 'text'; content: string } | { type: 'code'; content: string; language: string; open: boolean };
    const result: Segment[] = [];
    let i = 0;
    const str = cleanedText;
    while (i < str.length) {
      const start = str.indexOf('```', i);
      if (start === -1) {
        const tail = str.slice(i);
        if (tail.trim()) result.push({ type: 'text', content: tail });
        break;
      }
      // Add text before code fence
      if (start > i) {
        const before = str.slice(i, start);
        if (before.trim()) result.push({ type: 'text', content: before });
      }
      // Find language end (newline)
      const langLineEnd = str.indexOf('\n', start + 3);
      if (langLineEnd === -1) {
        // No newline after fence; treat the rest as text
        const tail = str.slice(start);
        if (tail.trim()) result.push({ type: 'text', content: tail });
        break;
      }
      const rawLang = str.slice(start + 3, langLineEnd).trim();
      const language = rawLang || 'text';
      const codeStart = langLineEnd + 1;
      const close = str.indexOf('```', codeStart);
      if (close === -1) {
        // Open code fence; stream code inside editor
        const code = str.slice(codeStart);
        result.push({ type: 'code', content: code, language, open: true });
        break;
      } else {
        const code = str.slice(codeStart, close);
        result.push({ type: 'code', content: code, language, open: false });
        i = close + 3;
      }
    }
    return result;
  }, [cleanedText]);

  return (
    <div className="streaming-text-container">
      {segments.map((seg, index) => {
        const delay = `${index * 0.05}s`;
        if (seg.type === 'text') {
          return (
            <div key={`seg-text-${index}`} className="chunk-wrapper" style={{ animationDelay: delay, animationDuration: '0.4s', animationFillMode: 'both' }}>
              {renderFormattedContent(seg.content, 'ai')}
            </div>
          );
        }
        // Code segment (may still be open)
        const lines = Math.max(8, Math.min(40, seg.content.split('\n').length + 2));
        return (
          <div key={`seg-code-${index}`} className="my-3 chunk-wrapper" style={{ animationDelay: delay, animationDuration: '0.4s', animationFillMode: 'both' }}>
            <MonacoEditor
              code={seg.content}
              language={seg.language}
              height={`${lines * 20}px`}
              readOnly={true}
              showActions={true}
            />
          </div>
        );
      })}
      <style jsx>{`
        .streaming-text-container {
          position: relative;
        }
        .chunk-wrapper {
          display: block;
          animation: chunkFadeIn ease-out;
        }
        @keyframes chunkFadeIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
