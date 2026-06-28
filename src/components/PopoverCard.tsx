"use client";

import { VocabularyUpgrade } from "@/lib/types";
import { X, BookOpen, Lightbulb, Target } from "lucide-react";

interface PopoverCardProps {
  upgrade: VocabularyUpgrade;
  onClose: () => void;
  position: { top: number; left: number };
}

export function PopoverCard({ upgrade, onClose, position }: PopoverCardProps) {
  return (
    <div 
      className="absolute z-50 bg-[#fef9c3] p-5 w-80 rounded-xl border-2 border-slate-800 shadow-[4px_4px_0px_#1e293b] animate-fade-in font-sans text-slate-800"
      style={{ top: `${position.top + 30}px`, left: `${position.left}px` }}
    >
      <button 
        onClick={onClose}
        className="absolute top-3 right-3 text-slate-500 hover:text-slate-800 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="mb-4">
        <div className="text-slate-500 text-sm mb-0.5 line-through">
          "{upgrade.originalPhrase}"
        </div>
        <div className="text-xl font-display font-bold text-indigo-700 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-500" />
          {upgrade.recommendedSynonym}
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div className="bg-[#fef08a] p-3 rounded-lg border border-[#eab308]/30">
          <div className="flex items-center gap-2 text-slate-800 font-bold mb-1">
            <Target className="w-4 h-4 text-orange-600" />
            Situation
          </div>
          <div className="text-slate-600">
            {upgrade.targetSituation}
          </div>
        </div>

        <div className="bg-[#fef08a] p-3 rounded-lg border border-[#eab308]/30">
          <div className="flex items-center gap-2 text-slate-800 font-bold mb-1">
            <Lightbulb className="w-4 h-4 text-yellow-600" />
            Example
          </div>
          <div className="text-slate-600 italic">
            "{upgrade.contextualExample}"
          </div>
        </div>
      </div>
    </div>
  );
}
