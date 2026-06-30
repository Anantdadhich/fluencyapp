"use client";

import React from "react";
import {
  Check, Compass, BookOpen, Mic, MessageSquare,
  Briefcase, Zap, Star, Shield,
  Globe
} from "lucide-react";

interface StepNode {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  themeColor: string; // e.g., 'rose', 'sky', 'orange', 'violet', 'pink'
  themeClasses: {
    bg: string;
    border: string;
    text: string;
    activeRing: string;
    accent: string;
  };
  xpAward: number;
}

interface LearningPathProps {
  completedSteps: string[];
  stats: {
    streak: number;
    completedSessions: number;
  };
  onLaunchStep: (stepId: string) => void;
  onQuickLaunch: (view: any) => void;
}

export function LearningPath({ completedSteps, stats, onLaunchStep }: LearningPathProps) {
  const steps: StepNode[] = [
    {
      id: "diagnostic",
      title: "Speech Diagnostic",
      subtitle: "Entry Assessment & Analysis",
      icon: Compass,
      themeColor: "rose",
      themeClasses: {
        bg: "bg-rose-50 border-rose-800 text-rose-800",
        border: "border-rose-800",
        text: "text-rose-800",
        activeRing: "ring-rose-400/50",
        accent: "#f43f5e"
      },
      xpAward: 15
    },
    {
      id: "grammar",
      title: "Grammar Foundations",
      subtitle: "Verb Tenses & Sentence Flow",
      icon: BookOpen,
      themeColor: "sky",
      themeClasses: {
        bg: "bg-sky-50 border-sky-800 text-sky-800",
        border: "border-sky-800",
        text: "text-sky-800",
        activeRing: "ring-sky-400/50",
        accent: "#0ea5e9"
      },
      xpAward: 20
    },
    {
      id: "vocab",
      title: "Executive Vocabulary",
      subtitle: "Formal & Networking Phrasings",
      icon: Zap,
      themeColor: "orange",
      themeClasses: {
        bg: "bg-orange-50 border-orange-800 text-orange-800",
        border: "border-orange-800",
        text: "text-orange-800",
        activeRing: "ring-orange-400/50",
        accent: "#f97316"
      },
      xpAward: 20
    },
    {
      id: "teleprompter",
      title: "The Elevator Pitch",
      subtitle: "Teleprompter Pacing Drill",
      icon: Mic,
      themeColor: "violet",
      themeClasses: {
        bg: "bg-violet-50 border-violet-800 text-violet-800",
        border: "border-violet-800",
        text: "text-violet-800",
        activeRing: "ring-violet-400/50",
        accent: "#8b5cf6"
      },
      xpAward: 25
    },
    {
      id: "roleplay_salary",
      title: "Arthur's Raise Debate",
      subtitle: "Salary Raise Negotiation",
      icon: Briefcase,
      themeColor: "rose",
      themeClasses: {
        bg: "bg-rose-50 border-rose-800 text-rose-800",
        border: "border-rose-800",
        text: "text-rose-800",
        activeRing: "ring-rose-400/50",
        accent: "#f43f5e"
      },
      xpAward: 30
    },
    {
      id: "roleplay_venture",
      title: "Elena's Venture Pitch",
      subtitle: "VC Startup Funding pitch",
      icon: MessageSquare,
      themeColor: "pink",
      themeClasses: {
        bg: "bg-pink-50 border-pink-800 text-pink-800",
        border: "border-pink-800",
        text: "text-pink-800",
        activeRing: "ring-pink-400/50",
        accent: "#ec4899"
      },
      xpAward: 30
    },
    {
      id: "roleplay_client",
      title: "Sarah's Outage Apology",
      subtitle: "Apologizing to Premium Clients",
      icon: Shield,
      themeColor: "sky",
      themeClasses: {
        bg: "bg-sky-50 border-sky-800 text-sky-800",
        border: "border-sky-800",
        text: "text-sky-800",
        activeRing: "ring-sky-400/50",
        accent: "#0ea5e9"
      },
      xpAward: 30
    },
    {
      id: "confidence",
      title: "Speaking Mirror Warmup",
      subtitle: "Confidence & Breath Control",
      icon: Star,
      themeColor: "violet",
      themeClasses: {
        bg: "bg-violet-50 border-violet-800 text-violet-800",
        border: "border-violet-800",
        text: "text-violet-800",
        activeRing: "ring-violet-400/50",
        accent: "#8b5cf6"
      },
      xpAward: 25
    },
    {
      id: "devtalk",
      title: "DevTalk Match",
      subtitle: "1:1 Live Communication Matching",
      icon: Globe,
      themeColor: "orange",
      themeClasses: {
        bg: "bg-orange-50 border-orange-850 text-orange-850",
        border: "border-orange-850",
        text: "text-orange-850",
        activeRing: "ring-orange-400/50",
        accent: "#f97316"
      },
      xpAward: 40
    }
  ];

  // Helper to determine step status
  const getStepStatus = (id: string) => {
    if (completedSteps.includes(id)) return "completed";
    return "active";
  };

  // Find the first uncompleted step to mark as the pulsing active target
  const activeTargetId = steps.find(s => !completedSteps.includes(s.id))?.id || null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-16 relative z-10">

      {/* Centered serpentine path container */}
      <div className="flex flex-col items-center py-6 relative w-full">

        {/* Winding Connection Line SVG Background */}
        <div className="absolute inset-0 top-16 bottom-16 w-full flex justify-center pointer-events-none z-0">
          <svg className="w-32 h-full stroke-slate-300 opacity-60" viewBox="0 0 100 1000" preserveAspectRatio="none">
            <path
              d="M 50 0 C 150 120, -50 250, 50 370 C 150 490, -50 620, 50 740 C 150 860, -50 950, 50 1000"
              fill="none"
              stroke="#1e293b"
              strokeWidth="3"
              strokeDasharray="8,6"
            />
          </svg>
        </div>

        {/* Nodes rendering */}
        <div className="space-y-16 w-full max-w-md relative z-10">
          {steps.map((step, idx) => {
            const status = getStepStatus(step.id);
            const isActiveTarget = step.id === activeTargetId;
            const Icon = step.icon;

            // Serpentine placement: alternate left, center, right classes
            const alignClass =
              idx % 3 === 0 ? "justify-center" :
                idx % 3 === 1 ? "justify-start pl-6 md:pl-10" :
                  "justify-end pr-6 md:pr-10";

            return (
              <div key={step.id} className={`flex ${alignClass} w-full transition-transform`}>
                <div
                  className="flex items-center gap-4 transition-all duration-300 group"
                >
                  {/* Left alignment for text on alternate steps */}
                  {idx % 2 === 1 && (
                    <div className="text-right hidden sm:block max-w-[200px]">
                      <div className="font-display text-lg font-bold text-slate-800 group-hover:text-slate-900 leading-tight">
                        {step.title}
                      </div>
                      <div className="text-xs text-slate-500 leading-snug">{step.subtitle}</div>
                    </div>
                  )}

                  {/* Circular Node Button */}
                  <button
                    onClick={() => onLaunchStep(step.id)}
                    className={`
                      w-20 h-20 rounded-full flex flex-col items-center justify-center relative
                      border-3 shadow-[4px_4px_0px_#1e293b] transition-all duration-150
                      ${status === "completed" ? "bg-emerald-100 border-slate-800 text-slate-800 hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#1e293b] active:translate-y-[2px] active:shadow-[2px_2px_0px_#1e293b]" : ""}
                      ${status === "active" ? `${step.themeClasses.bg} ${step.themeClasses.border} ${step.themeClasses.text} hover:scale-105 hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#1e293b] active:translate-y-[2px] active:shadow-[2px_2px_0px_#1e293b]` : ""}
                      ${isActiveTarget ? `ring-4 ${step.themeClasses.activeRing}` : ""}
                    `}
                  >
                    {/* Bouncing notification for current active target node */}
                    {isActiveTarget && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: step.themeClasses.accent }} />
                        <span className="relative inline-flex rounded-full h-4 w-4" style={{ backgroundColor: step.themeClasses.accent }} />
                      </span>
                    )}

                    {/* Step Icon */}
                    {status === "completed" ? (
                      <div className="flex flex-col items-center justify-center">
                        <Check className="w-7 h-7 text-emerald-700 stroke-[3]" />
                        <span className="text-[10px] font-bold text-emerald-800/80 mt-[-2px]">DONE</span>
                      </div>
                    ) : (
                      <Icon className="w-7 h-7 stroke-[2.5]" />
                    )}

                    {/* Badge number indicators */}
                    <div className="absolute -bottom-1.5 -left-1.5 bg-slate-800 text-white font-mono text-xs w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-100">
                      {idx + 1}
                    </div>
                  </button>

                  {/* Right alignment for text on alternate steps */}
                  {idx % 2 === 0 && (
                    <div className="text-left hidden sm:block max-w-[200px]">
                      <div className="font-display text-lg font-bold text-slate-800 group-hover:text-slate-900 leading-tight">
                        {step.title}
                      </div>
                      <div className="text-xs text-slate-500 leading-snug">{step.subtitle}</div>
                    </div>
                  )}

                  {/* Fallback Text for super small viewports */}
                  <div className="sm:hidden text-left max-w-[140px]">
                    <div className="font-display text-sm font-bold leading-tight text-slate-800">
                      {step.title}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
