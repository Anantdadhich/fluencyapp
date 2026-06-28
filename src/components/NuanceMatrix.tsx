"use client";

import { NuanceScores, Registers } from "@/lib/types";
import { MessageSquare, Briefcase, GraduationCap } from "lucide-react";

interface NuanceMatrixProps {
  scores: NuanceScores | null;
  registers: Registers | null;
}

export function NuanceMatrix({ scores, registers }: NuanceMatrixProps) {
  if (!scores || !registers) {
    return (
      <div className="glass-panel p-6 h-full flex flex-col items-center justify-center text-center text-[var(--text-secondary)] bg-white">
        <MessageSquare className="w-12 h-12 mb-4 opacity-50 text-[var(--accent-primary)]" />
        <p className="text-slate-800 font-medium">Your analysis will appear here.<br/>Write something and click \"Analyze & Polish\".</p>
      </div>
    );
  }

  const renderBar = (label: string, score: number, colorClass: string) => (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-[var(--text-secondary)] font-medium">{label}</span>
        <span className="font-mono text-[var(--text-primary)] font-semibold">{score}/10</span>
      </div>
      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-300">
        <div 
          className={`h-full ${colorClass} transition-all duration-1000 ease-out`}
          style={{ width: `${score * 10}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="glass-panel h-full flex flex-col overflow-hidden animate-fade-in bg-white">
      <div className="p-6 border-b border-[var(--panel-border)] bg-slate-50">
        <h2 className="text-2xl font-display mb-6 flex items-center gap-2 font-bold text-[var(--text-primary)]">
          Nuance Matrix
        </h2>
        
        <div className="space-y-2">
          {renderBar("Formal", scores.formal, "bg-blue-500")}
          {renderBar("Casual", scores.casual, "bg-green-500")}
          {renderBar("Aggressive", scores.aggressive, "bg-red-500")}
          {renderBar("Poetic", scores.poetic, "bg-purple-500")}
          {renderBar("Stiff", scores.stiff, "bg-gray-400")}
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <h3 className="text-xl font-display mb-4 text-[var(--text-primary)] font-bold">Register Switcher</h3>
        
        <div className="space-y-4">
          <div className="bg-[#fdfcf7] border-2 border-slate-800 rounded-xl p-4 shadow-[2px_2px_0px_#1e293b]">
            <div className="flex items-center gap-2 text-green-600 font-bold mb-2 text-sm">
              <MessageSquare className="w-4 h-4" /> Texting a Friend
            </div>
            <p className="text-[var(--text-primary)] text-sm">{registers.friend}</p>
          </div>

          <div className="bg-[#fdfcf7] border-2 border-slate-800 rounded-xl p-4 shadow-[2px_2px_0px_#1e293b]">
            <div className="flex items-center gap-2 text-blue-600 font-bold mb-2 text-sm">
              <Briefcase className="w-4 h-4" /> Emailing a Boss
            </div>
            <p className="text-[var(--text-primary)] text-sm">{registers.boss}</p>
          </div>

          <div className="bg-[#fdfcf7] border-2 border-slate-800 rounded-xl p-4 shadow-[2px_2px_0px_#1e293b]">
            <div className="flex items-center gap-2 text-purple-600 font-bold mb-2 text-sm">
              <GraduationCap className="w-4 h-4" /> Academic/Report
            </div>
            <p className="text-[var(--text-primary)] text-sm">{registers.academic}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
