"use client";

import { useState, useEffect, useRef } from "react";
import { AudioInput } from "./AudioInput";
import { PopoverCard } from "./PopoverCard";
import { Highlight, VocabularyUpgrade } from "@/lib/types";
import { Sparkles } from "lucide-react";

interface WorkspaceProps {
  onAnalyze: (text: string, audioBlob?: Blob) => Promise<void>;
  isProcessing: boolean;
  highlights: Highlight[];
  vocabularyUpgrades: VocabularyUpgrade[];
}

export function UnifiedTextWorkspace({ onAnalyze, isProcessing, highlights, vocabularyUpgrades }: WorkspaceProps) {
  const [text, setText] = useState("");
  const [activePopover, setActivePopover] = useState<{ upgrade: VocabularyUpgrade, pos: { top: number, left: number } } | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("workspace_draft");
    if (saved) setText(saved);
  }, []);

  // Debounced save to localStorage
  useEffect(() => {
    const handler = setTimeout(() => {
      localStorage.setItem("workspace_draft", text);
    }, 1000);
    return () => clearTimeout(handler);
  }, [text]);

  // Sync scroll between textarea and overlay
  const handleScroll = () => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleAudioTranscript = (transcript: string) => {
    setText((prev) => prev + (prev.endsWith(" ") ? "" : " ") + transcript);
  };

  const handleAudioBlob = async (blob: Blob) => {
    await onAnalyze(text, blob);
  };

  const handleHighlightClick = (e: React.MouseEvent, type: string, indexStart: number, indexEnd: number) => {
    if (type === "vocabulary") {
      const phrase = text.substring(indexStart, indexEnd);
      const upgrade = vocabularyUpgrades.find(u => u.originalPhrase.toLowerCase() === phrase.toLowerCase());
      if (upgrade) {
        // Calculate position roughly based on click
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        // Fallback relative to the parent editor
        const parentRect = overlayRef.current?.getBoundingClientRect();
        
        setActivePopover({
          upgrade,
          pos: { 
            top: (rect.bottom - (parentRect?.top || 0)), 
            left: (rect.left - (parentRect?.left || 0)) 
          }
        });
      }
    }
  };

  // Render text with highlights
  const renderHighlightedText = () => {
    if (!highlights || highlights.length === 0) return text;

    // Sort highlights by start index
    const sorted = [...highlights].sort((a, b) => a.indexStart - b.indexStart);
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    sorted.forEach((hl, i) => {
      if (hl.indexStart >= lastIndex) {
        // Add unhighlighted text
        elements.push(<span key={`text-${i}`}>{text.substring(lastIndex, hl.indexStart)}</span>);
        // Add highlighted text
        elements.push(
          <span 
            key={`hl-${i}`} 
            className={`highlight ${hl.type}`}
            onClick={(e) => handleHighlightClick(e, hl.type, hl.indexStart, hl.indexEnd)}
          >
            {text.substring(hl.indexStart, hl.indexEnd)}
          </span>
        );
        lastIndex = hl.indexEnd;
      }
    });

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(<span key="text-end">{text.substring(lastIndex)}</span>);
    }

    return elements;
  };

  return (
    <div className="glass-panel flex flex-col h-full animate-fade-in overflow-hidden relative">
      <div className="p-4 border-b border-[var(--panel-border)] flex items-center justify-between bg-slate-50/80">
        <h2 className="text-xl font-display text-[var(--text-primary)]">Workspace</h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onAnalyze(text)}
            disabled={isProcessing || !text.trim()}
            className="btn-primary flex items-center gap-2"
          >
            {isProcessing ? (
               <Sparkles className="w-4 h-4 animate-spin" />
            ) : (
               <Sparkles className="w-4 h-4" />
            )}
            Analyze & Polish
          </button>
        </div>
      </div>

      <div className="flex-1 relative bg-white" onClick={() => setActivePopover(null)}>
        {/* The overlay renders the colored background blocks */}
        <div 
          ref={overlayRef}
          className="editor-overlay"
          aria-hidden="true"
        >
          {renderHighlightedText()}
        </div>

        {/* The textarea is transparent, sits on top, and takes user input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onScroll={handleScroll}
          placeholder="Start typing or tap the microphone to speak..."
          className="editor-textarea"
          spellCheck="false"
        />

        {activePopover && (
          <PopoverCard 
            upgrade={activePopover.upgrade} 
            position={activePopover.pos} 
            onClose={() => setActivePopover(null)} 
          />
        )}
      </div>

      {/* Prominent Speech-to-Text Button at the bottom */}
      <div className="p-4 bg-slate-50/80 border-t border-[var(--panel-border)]">
        <AudioInput 
          onTranscript={handleAudioTranscript}
          onAudioBlob={handleAudioBlob}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  );
}
