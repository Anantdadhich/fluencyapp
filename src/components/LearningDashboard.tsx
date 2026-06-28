"use client";

import { useState } from "react";
import { AnalysisResponse } from "@/lib/types";
import { MessageSquare, Briefcase, GraduationCap, BookOpen, Target, Lightbulb, BookA, Sparkles } from "lucide-react";

interface LearningDashboardProps {
  analysis: AnalysisResponse | null;
}

export function LearningDashboard({ analysis }: LearningDashboardProps) {
  const [activeTab, setActiveTab] = useState<"registers" | "vocabulary" | "grammar">("registers");

  if (!analysis) {
    return (
      <div className="glass-panel p-6 h-full flex flex-col items-center justify-center text-center text-[var(--text-secondary)]">
        <Sparkles className="w-12 h-12 mb-4 opacity-50 text-[var(--accent-primary)]" />
        <p className="text-lg font-bold text-[var(--text-primary)] mb-2">Ready to Learn?</p>
        <p>Type or speak a sentence and click \"Analyze & Polish\" to see your grammar breakdown and vocabulary upgrades.</p>
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
    <div className="glass-panel h-full flex flex-col overflow-hidden animate-fade-in">
      {/* Tabs Header */}
      <div className="flex border-b border-[var(--panel-border)] bg-slate-50">
        <button 
          onClick={() => setActiveTab("registers")}
          className={`flex-1 py-4 text-sm font-medium transition-colors border-b-3 ${activeTab === "registers" ? "border-[var(--accent-secondary)] text-[var(--text-primary)] font-bold" : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
        >
          Registers
        </button>
        <button 
          onClick={() => setActiveTab("vocabulary")}
          className={`flex-1 py-4 text-sm font-medium transition-colors border-b-3 ${activeTab === "vocabulary" ? "border-[var(--accent-secondary)] text-[var(--text-primary)] font-bold" : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
        >
          Vocabulary
        </button>
        <button 
          onClick={() => setActiveTab("grammar")}
          className={`flex-1 py-4 text-sm font-medium transition-colors border-b-3 ${activeTab === "grammar" ? "border-[var(--accent-secondary)] text-[var(--text-primary)] font-bold" : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
        >
          Grammar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-white">
        
        {/* TAB 1: REGISTERS */}
        {activeTab === "registers" && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-display mb-4 text-[var(--text-primary)] font-bold">Nuance Scores</h3>
              <div className="space-y-2">
                {renderBar("Formal", analysis.analytics.nuanceScores.formal, "bg-blue-500")}
                {renderBar("Casual", analysis.analytics.nuanceScores.casual, "bg-green-500")}
                {renderBar("Aggressive", analysis.analytics.nuanceScores.aggressive, "bg-red-500")}
                {renderBar("Poetic", analysis.analytics.nuanceScores.poetic, "bg-purple-500")}
                {renderBar("Stiff", analysis.analytics.nuanceScores.stiff, "bg-gray-400")}
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--panel-border)]">
              <h3 className="text-lg font-display mb-4 text-[var(--text-primary)] font-bold">Register Switcher</h3>
              <div className="space-y-4">
                <div className="bg-[#fdfcf7] border-2 border-slate-800 rounded-xl p-4 shadow-[2px_2px_0px_#1e293b]">
                  <div className="flex items-center gap-2 text-green-600 font-bold mb-2 text-sm">
                    <MessageSquare className="w-4 h-4" /> Texting a Friend
                  </div>
                  <p className="text-[var(--text-primary)] text-sm">{analysis.analytics.registers.friend}</p>
                </div>
                <div className="bg-[#fdfcf7] border-2 border-slate-800 rounded-xl p-4 shadow-[2px_2px_0px_#1e293b]">
                  <div className="flex items-center gap-2 text-blue-600 font-bold mb-2 text-sm">
                    <Briefcase className="w-4 h-4" /> Emailing a Boss
                  </div>
                  <p className="text-[var(--text-primary)] text-sm">{analysis.analytics.registers.boss}</p>
                </div>
                <div className="bg-[#fdfcf7] border-2 border-slate-800 rounded-xl p-4 shadow-[2px_2px_0px_#1e293b]">
                  <div className="flex items-center gap-2 text-purple-600 font-bold mb-2 text-sm">
                    <GraduationCap className="w-4 h-4" /> Academic/Report
                  </div>
                  <p className="text-[var(--text-primary)] text-sm">{analysis.analytics.registers.academic}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VOCABULARY */}
        {activeTab === "vocabulary" && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-display text-[var(--text-primary)] font-bold">Advanced Alternatives</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">Learn how to elevate your phrasing instead of using basic words.</p>
            
            {analysis.vocabularyUpgrades.length === 0 ? (
              <div className="text-center text-[var(--text-secondary)] py-8">No vocabulary upgrades suggested for this text.</div>
            ) : (
              <div className="space-y-4">
                {analysis.vocabularyUpgrades.map((upgrade, i) => (
                  <div key={i} className="bg-[#fdfcf7] border-2 border-slate-800 rounded-xl p-4 shadow-[3px_3px_0px_#1e293b]">
                    <div className="text-[var(--text-secondary)] text-sm mb-1 line-through">
                      \"{upgrade.originalPhrase}\"
                    </div>
                    <div className="text-xl font-display font-bold text-[var(--accent-primary)] flex items-center gap-2 mb-4">
                      <BookOpen className="w-5 h-5" />
                      {upgrade.recommendedSynonym}
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2 text-slate-800 font-bold mb-1">
                          <Target className="w-4 h-4 text-orange-500" /> Situation
                        </div>
                        <div className="text-[var(--text-secondary)]">{upgrade.targetSituation}</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2 text-slate-800 font-bold mb-1">
                          <Lightbulb className="w-4 h-4 text-yellow-600" /> Example
                        </div>
                        <div className="text-[var(--text-secondary)] italic">\"{upgrade.contextualExample}\"</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: GRAMMAR */}
        {activeTab === "grammar" && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-display text-[var(--text-primary)] font-bold">Grammar Breakdown</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">Understand the mechanics behind the sentence structure.</p>
            
            {!analysis.grammarAnalysis ? (
              <div className="text-center text-[var(--text-secondary)] py-8">Grammar analysis unavailable for this text.</div>
            ) : (
              <div className="space-y-4">
                <div className="bg-[#fdfcf7] border-2 border-slate-800 rounded-xl p-5 shadow-[3px_3px_0px_#1e293b]">
                  <div className="mb-4">
                    <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] font-bold mb-1">Identified Tense</div>
                    <div className="text-lg text-[var(--text-primary)] font-display font-semibold flex items-center gap-2">
                       <BookA className="w-5 h-5 text-[var(--accent-secondary)]" />
                       {analysis.grammarAnalysis.tense}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] font-bold mb-1">Structure Breakdown</div>
                    <div className="text-sm text-[var(--text-primary)] bg-slate-50 p-3 rounded-lg border border-slate-200">
                      {analysis.grammarAnalysis.sentenceStructure}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-wider text-green-600 font-bold mb-1">Educational Lesson</div>
                    <div className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      {analysis.grammarAnalysis.educationalLesson}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
