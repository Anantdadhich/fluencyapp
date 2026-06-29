"use client";

import { useState, useEffect } from "react";
import { OnboardingGate } from "@/components/OnboardingGate";
import { UnifiedTextWorkspace } from "@/components/UnifiedTextWorkspace";
import { LearningDashboard } from "@/components/LearningDashboard";
import { GrammarHub } from "@/components/GrammarHub";
import { VocabClass } from "@/components/VocabClass";
import { FluencyTrainer } from "@/components/FluencyTrainer";
import { RoleplaySimulator } from "@/components/RoleplaySimulator";
import { ConfidenceStudio } from "@/components/ConfidenceStudio";
import { LearningPath } from "@/components/LearningPath";
import { AnalysisResponse } from "@/lib/types";
import { Flame, Award, Shield, ArrowLeft, Trophy, Star, Sparkles, CheckCircle2, Menu, X } from "lucide-react";

type ActiveView = "learning_path" | "workspace" | "basic_learning" | "vocab_practice" | "roleplay" | "fluency_trainer" | "confidence_studio";

export default function Home() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState<ActiveView>("learning_path");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Learning pathway states
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [activePathStep, setActivePathStep] = useState<string | null>(null);
  const [showVictory, setShowVictory] = useState<{ stepTitle: string; xpEarned: number } | null>(null);

  // Daily streak and completions state
  const [stats, setStats] = useState({
    streak: 0,
    completedSessions: 0,
    lastCompletedDate: "",
  });

  // Load stats and path progress from local storage
  useEffect(() => {
    // Check if API key is set
    fetch("/api/auth")
      .then(res => res.json())
      .then(data => setHasKey(data.hasKey))
      .catch(() => setHasKey(false));

    // Load completed path steps
    const storedSteps = localStorage.getItem("completed_path_steps");
    if (storedSteps) {
      try {
        setCompletedSteps(JSON.parse(storedSteps));
      } catch (e) {
        console.error("Error reading path steps", e);
      }
    }

    // Load practice stats from local storage
    const storedStats = localStorage.getItem("fluency_practice_stats");
    if (storedStats) {
      try {
        const parsed = JSON.parse(storedStats);
        let streak = parsed.streak || 0;
        const lastDateStr = parsed.lastCompletedDate;
        
        if (lastDateStr) {
          const today = new Date().toDateString();
          const lastDate = new Date(lastDateStr).toDateString();
          
          if (today !== lastDate) {
            const diffTime = Math.abs(new Date(today).getTime() - new Date(lastDate).getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 1) {
              streak = 0; // Streak broken if more than 1 day since last completion
            }
          }
        }
        
        setStats({
          streak,
          completedSessions: parsed.completedSessions || 0,
          lastCompletedDate: lastDateStr || "",
        });
      } catch (e) {
        console.error("Error reading practice stats", e);
      }
    }
  }, []);

  // Web Audio Synth victory arpeggio sound helper
  const playVictorySound = () => {
    if (typeof window === "undefined") return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const playNote = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      // Rising C Major arpeggio for a positive, gamified feedback sound
      playNote(261.63, now, 0.3); // C4
      playNote(329.63, now + 0.12, 0.3); // E4
      playNote(392.00, now + 0.24, 0.3); // G4
      playNote(523.25, now + 0.36, 0.5); // C5
    } catch (e) {
      console.error("Audio Context playback failed", e);
    }
  };

  const handleLaunchStep = (stepId: string) => {
    setActivePathStep(stepId);
    if (stepId === "diagnostic") {
      setActiveView("workspace");
    } else if (stepId === "grammar") {
      setActiveView("basic_learning");
    } else if (stepId === "vocab") {
      setActiveView("vocab_practice");
    } else if (stepId === "teleprompter") {
      setActiveView("fluency_trainer");
    } else if (stepId.startsWith("roleplay")) {
      setActiveView("roleplay");
    } else if (stepId === "confidence") {
      setActiveView("confidence_studio");
    }
  };

  const handleQuickLaunch = (viewName: ActiveView) => {
    setActivePathStep(null);
    setActiveView(viewName);
  };

  const handleSessionComplete = () => {
    const today = new Date().toDateString();
    let newStreak = stats.streak;
    
    if (stats.lastCompletedDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();
      
      if (stats.lastCompletedDate === yesterdayStr || stats.streak === 0) {
        newStreak += 1;
      } else {
        newStreak = 1; // Restarted streak
      }
    }

    const updatedStats = {
      streak: newStreak,
      completedSessions: stats.completedSessions + 1,
      lastCompletedDate: today,
    };

    setStats(updatedStats);
    localStorage.setItem("fluency_practice_stats", JSON.stringify(updatedStats));

    // Handle path progression and show victory card
    if (activePathStep) {
      let xpAwarded = 25;
      if (activePathStep === "diagnostic") xpAwarded = 15;
      else if (activePathStep.startsWith("roleplay")) xpAwarded = 30;

      // Update XP in local storage
      const currentXp = parseInt(localStorage.getItem("fluency_xp") || "0");
      const nextXp = currentXp + xpAwarded;
      localStorage.setItem("fluency_xp", nextXp.toString());

      // Update completed path steps
      if (!completedSteps.includes(activePathStep)) {
        const nextSteps = [...completedSteps, activePathStep];
        setCompletedSteps(nextSteps);
        localStorage.setItem("completed_path_steps", JSON.stringify(nextSteps));
      }

      // Play victory chime and show overlay
      playVictorySound();
      
      // Determine step human name for the victory modal
      let friendlyName = "Speaking Challenge";
      if (activePathStep === "diagnostic") friendlyName = "Speech Diagnostic Assessment";
      else if (activePathStep === "grammar") friendlyName = "Grammar Foundations";
      else if (activePathStep === "vocab") friendlyName = "Executive Vocabulary Classroom";
      else if (activePathStep === "teleprompter") friendlyName = "The Elevator Pitch Drill";
      else if (activePathStep === "roleplay_salary") friendlyName = "Arthur Vance Salary Debate";
      else if (activePathStep === "roleplay_venture") friendlyName = "Elena Rostova Venture Pitch";
      else if (activePathStep === "roleplay_client") friendlyName = "Sarah Jenkins Outage Apology";
      else if (activePathStep === "confidence") friendlyName = "Confidence Studio Mirror Session";

      setShowVictory({
        stepTitle: friendlyName,
        xpAwarded
      } as any);
    }
  };

  const handleAnalyze = async (text: string, audioBlob?: Blob): Promise<any> => {
    setIsProcessing(true);
    setError("");
    
    try {
      let base64Audio = "";
      let audioMimeType = "";
      if (audioBlob) {
        audioMimeType = audioBlob.type;
        base64Audio = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.onerror = reject;
        });
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, audio: base64Audio, mimeType: audioMimeType }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze text");
      }

      setAnalysis(data);
      // Automatically trigger completion for the diagnostic workspace on successful run
      if (activePathStep === "diagnostic") {
        handleSessionComplete();
      }
      return data;
    } catch (err: any) {
      setError(err.message);
      console.error(err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  if (hasKey === null) {
    return <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center text-[var(--text-primary)]">Loading...</div>;
  }

  if (!hasKey) {
    return <OnboardingGate onSuccess={() => setHasKey(true)} />;
  }

  const handleResetKey = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    setHasKey(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)] flex flex-col relative z-10">
      
      {/* 1. HEADER: Rebranded navigation header with hamburger dropdown for mobile */}
      <header className="main-header w-full bg-white border-b-3 border-slate-800 shadow-[0px_3px_0px_rgba(30,41,59,1)] flex flex-col relative z-50">
        <div className="flex items-center justify-between px-4 md:px-6 h-16 w-full gap-4">
          
          {/* Logo / Brand Name Button */}
          <button 
            onClick={() => {
              setActiveView("learning_path");
              setActivePathStep(null);
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left shrink-0"
            title="Go to Home Path"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white font-bold text-sm border-2 border-slate-900 shadow-[2px_2px_0px_#1e293b]">
              A
            </div>
            <h1 className="text-lg font-display font-bold text-[var(--text-primary)]">FluentScribe</h1>
          </button>

          {/* Desktop Navigation Tabs - centered, hidden on mobile */}
          <nav className="hidden md:flex h-full items-center gap-1">
            <button
              onClick={() => {
                setActiveView("learning_path");
                setActivePathStep(null);
              }}
              className={`nav-tab h-full flex items-center ${activeView === "learning_path" ? "active" : ""}`}
            >
              Pathway Map
            </button>
            <button
              onClick={() => {
                setActiveView("workspace");
                setActivePathStep(null);
              }}
              className={`nav-tab h-full flex items-center ${activeView === "workspace" ? "active" : ""}`}
            >
              Workspace
            </button>
            <button
              onClick={() => {
                setActiveView("basic_learning");
                setActivePathStep(null);
              }}
              className={`nav-tab h-full flex items-center ${activeView === "basic_learning" ? "active" : ""}`}
            >
              Grammar Hub
            </button>
            <button
              onClick={() => {
                setActiveView("vocab_practice");
                setActivePathStep(null);
              }}
              className={`nav-tab h-full flex items-center ${activeView === "vocab_practice" ? "active" : ""}`}
            >
              Vocab Class
            </button>
            <button
              onClick={() => {
                setActiveView("roleplay");
                setActivePathStep(null);
              }}
              className={`nav-tab h-full flex items-center ${activeView === "roleplay" ? "active" : ""}`}
            >
              Simulator
            </button>
            <button
              onClick={() => {
                setActiveView("fluency_trainer");
                setActivePathStep(null);
              }}
              className={`nav-tab h-full flex items-center ${activeView === "fluency_trainer" ? "active" : ""}`}
            >
              Teleprompter
            </button>
            <button
              onClick={() => {
                setActiveView("confidence_studio");
                setActivePathStep(null);
              }}
              className={`nav-tab h-full flex items-center gap-1.5 font-medium ${activeView === "confidence_studio" ? "active text-pink-650 font-semibold" : "text-pink-700 hover:text-pink-800"}`}
            >
              <Shield className="w-4 h-4" /> Confidence
            </button>
          </nav>

          {/* Right side: Streak and controls (desktop inline, mobile icons + hamburger toggle) */}
          <div className="flex items-center gap-2 md:gap-4 text-xs font-mono text-[var(--text-secondary)]">
            
            {/* Streak & Drills indicator */}
            <div className="flex items-center gap-2 md:gap-2.5">
              <div className="flex items-center gap-1" title="Daily Streak">
                <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                <span><strong className="text-[var(--text-primary)]">{stats.streak}d</strong></span>
              </div>
              <div className="hidden sm:flex items-center gap-1" title="Completed Exercises">
                <Award className="w-4 h-4 text-yellow-500" />
                <span><strong className="text-[var(--text-primary)]">{stats.completedSessions}</strong></span>
              </div>
            </div>

            <button 
              onClick={handleResetKey}
              className="hidden md:block text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium border-l border-slate-300 pl-3"
            >
              Reset Key
            </button>

            {/* Exit Button - hidden if on map */}
            {activeView !== "learning_path" && activePathStep && (
              <button
                onClick={() => {
                  setActiveView("learning_path");
                  setActivePathStep(null);
                }}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-[#fdfcf7] border-2 border-slate-800 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 shadow-[2px_2px_0px_#1e293b] active:translate-y-[2px] active:shadow-none"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Exit
              </button>
            )}

            {/* Mobile Hamburger Toggle Button - hidden on desktop */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl border-2 border-slate-800 bg-[#fdfcf7] hover:bg-slate-100 shadow-[2px_2px_0px_rgba(30,41,59,1)] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-slate-800" /> : <Menu className="w-5 h-5 text-slate-800" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer - Slide-down neobrutalist panel */}
        {mobileMenuOpen && (
          <div className="md:hidden w-full border-t-2 border-slate-800 bg-white shadow-[0px_4px_10px_rgba(0,0,0,0.05)] absolute top-[100%] left-0 right-0 z-40 animate-fade-in p-4 space-y-4">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider px-2">Navigation Milestones</span>
              <button
                onClick={() => {
                  setActiveView("learning_path");
                  setActivePathStep(null);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left p-3 rounded-xl border-2 font-bold transition-all ${activeView === "learning_path" ? "bg-sky-50 border-sky-500 text-sky-700 shadow-[2px_2px_0px_rgba(14,165,233,0.3)]" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
              >
                🗺️ Pathway Map
              </button>
              <button
                onClick={() => {
                  setActiveView("workspace");
                  setActivePathStep(null);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left p-3 rounded-xl border-2 font-bold transition-all ${activeView === "workspace" ? "bg-sky-50 border-sky-500 text-sky-700 shadow-[2px_2px_0px_rgba(14,165,233,0.3)]" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
              >
                📝 Workspace Editor
              </button>
              <button
                onClick={() => {
                  setActiveView("basic_learning");
                  setActivePathStep(null);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left p-3 rounded-xl border-2 font-bold transition-all ${activeView === "basic_learning" ? "bg-sky-50 border-sky-500 text-sky-700 shadow-[2px_2px_0px_rgba(14,165,233,0.3)]" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
              >
                📖 Grammar Hub
              </button>
              <button
                onClick={() => {
                  setActiveView("vocab_practice");
                  setActivePathStep(null);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left p-3 rounded-xl border-2 font-bold transition-all ${activeView === "vocab_practice" ? "bg-sky-50 border-sky-500 text-sky-700 shadow-[2px_2px_0px_rgba(14,165,233,0.3)]" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
              >
                ⚡ Vocab Class
              </button>
              <button
                onClick={() => {
                  setActiveView("roleplay");
                  setActivePathStep(null);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left p-3 rounded-xl border-2 font-bold transition-all ${activeView === "roleplay" ? "bg-sky-50 border-sky-500 text-sky-700 shadow-[2px_2px_0px_rgba(14,165,233,0.3)]" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
              >
                💬 Roleplay Simulator
              </button>
              <button
                onClick={() => {
                  setActiveView("fluency_trainer");
                  setActivePathStep(null);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left p-3 rounded-xl border-2 font-bold transition-all ${activeView === "fluency_trainer" ? "bg-sky-50 border-sky-500 text-sky-700 shadow-[2px_2px_0px_rgba(14,165,233,0.3)]" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
              >
                🗣️ Teleprompter Drill
              </button>
              <button
                onClick={() => {
                  setActiveView("confidence_studio");
                  setActivePathStep(null);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left p-3 rounded-xl border-2 font-bold transition-all flex items-center gap-2 ${activeView === "confidence_studio" ? "bg-pink-50 border-pink-500 text-pink-700 shadow-[2px_2px_0px_rgba(236,72,153,0.3)]" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
              >
                🛡️ Confidence Studio
              </button>
            </div>

            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-xs px-2 text-slate-500 font-mono">
              <div className="flex items-center gap-1">
                <Award className="w-4 h-4 text-yellow-500" />
                <span>Drills Completed: <strong>{stats.completedSessions}</strong></span>
              </div>
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleResetKey();
                }}
                className="text-red-500 font-bold hover:underline"
              >
                Reset API Key
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. CORE SCREEN VIEWS */}
      <div className="flex-1 overflow-y-auto">
        {activeView === "learning_path" ? (
          <LearningPath
            completedSteps={completedSteps}
            stats={stats}
            onLaunchStep={handleLaunchStep}
            onQuickLaunch={handleQuickLaunch}
          />
        ) : activeView === "workspace" ? (
          <main className="app-container-workspace p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)]">
            <div className="flex flex-col gap-4 lg:overflow-y-auto">
              <UnifiedTextWorkspace 
                onAnalyze={handleAnalyze}
                isProcessing={isProcessing}
                highlights={analysis?.highlights || []}
                vocabularyUpgrades={analysis?.vocabularyUpgrades || []}
              />
            </div>
            <div className="lg:overflow-y-auto">
              <LearningDashboard analysis={analysis} />
            </div>
          </main>
        ) : activeView === "basic_learning" ? (
          <div className="py-6 px-4 md:px-6 max-w-5xl mx-auto">
            <GrammarHub 
              onComplete={handleSessionComplete} 
              initialTopicId={activePathStep === "grammar" ? "tenses" : null}
            />
          </div>
        ) : activeView === "vocab_practice" ? (
          <div className="py-6 px-4 md:px-6 max-w-5xl mx-auto">
            <VocabClass 
              onComplete={handleSessionComplete} 
              initialThemeId={activePathStep === "vocab" ? "executive" : null}
            />
          </div>
        ) : activeView === "roleplay" ? (
          <div className="py-6 px-4 md:px-6 max-w-5xl mx-auto">
            <RoleplaySimulator 
              onComplete={handleSessionComplete} 
              initialPersonaId={
                activePathStep === "roleplay_salary" ? "salary" :
                activePathStep === "roleplay_venture" ? "venture" :
                activePathStep === "roleplay_client" ? "client" : null
              }
            />
          </div>
        ) : activeView === "fluency_trainer" ? (
          <div className="py-6 px-4 md:px-6 max-w-5xl mx-auto">
            <FluencyTrainer onComplete={handleSessionComplete} />
          </div>
        ) : (
          <div className="py-6 px-4 md:px-6 max-w-5xl mx-auto h-full">
            <ConfidenceStudio />
          </div>
        )}
      </div>

      {/* 3. GAMIFIED VICTORY MODAL OVERLAY */}
      {showVictory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel p-8 max-w-md w-full bg-white relative text-center overflow-hidden animate-scale-up">
            
            {/* Playful Confetti Stickers */}
            <div className="absolute top-4 left-6 text-2xl animate-bounce">✨</div>
            <div className="absolute top-8 right-6 text-2xl animate-bounce delay-150">🎉</div>
            <div className="absolute bottom-6 left-8 text-2xl animate-bounce delay-300">🌟</div>

            <div className="mx-auto w-20 h-20 bg-amber-100 border-3 border-slate-800 rounded-full flex items-center justify-center mb-6 shadow-[3px_3px_0px_#1e293b]">
              <Trophy className="w-10 h-10 text-amber-500 fill-amber-300" />
            </div>

            <h3 className="text-3xl font-display font-bold text-slate-800 mb-2">Milestone Complete!</h3>
            <p className="text-xs text-emerald-600 font-extrabold uppercase tracking-widest mb-4 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4 fill-emerald-100 text-emerald-600" />
              Milestone Completed successfully!
            </p>

            <div className="bg-[#fcf9f2] border-2 border-slate-800 rounded-2xl p-4 mb-6 shadow-[2.5px_2.5px_0px_#1e293b]">
              <div className="text-sm font-bold text-slate-600 mb-1">{showVictory.stepTitle}</div>
              <div className="flex items-center justify-center gap-4 text-sm mt-3">
                <div className="bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-300 font-extrabold text-amber-900 font-mono">
                  +{(showVictory as any).xpAwarded} XP Energy
                </div>
                <div className="bg-orange-100 px-3 py-1.5 rounded-lg border border-orange-300 font-extrabold text-orange-950 font-mono flex items-center gap-1">
                  <Flame className="w-4 h-4 fill-orange-500 text-orange-600" /> {stats.streak}d Streak
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowVictory(null);
                setActiveView("learning_path");
                setActivePathStep(null);
              }}
              className="btn-primary w-full text-base py-3 flex items-center justify-center gap-2"
            >
              Continue Pathway <Sparkles className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
