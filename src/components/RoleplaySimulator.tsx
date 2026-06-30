"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, AlertCircle, Play, Pause, RotateCcw, Mic, Square, Volume2, Type, Award, Activity, Check, CheckCircle2, ChevronRight, MessageSquare, User, ShieldAlert, Heart, Star, Send } from "lucide-react";
import { RoleplayMessage, RoleplayTurnEvaluation } from "@/lib/types";
import { AudioVisualizer } from "./AudioVisualizer";

interface RoleplaySimulatorProps {
  onComplete: () => void;
  initialPersonaId?: string | null;
}

type Step = "select" | "chat" | "scorecard";
type PersonaId = "salary" | "venture" | "networking" | "client" | "custom";

interface PersonaConfig {
  id: PersonaId;
  name: string;
  role: string;
  avatarBg: string;
  avatarText: string;
  desc: string;
  openingText: string;
}

const SpeechRecognition = typeof window !== "undefined" ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null;

export function RoleplaySimulator({ onComplete, initialPersonaId }: RoleplaySimulatorProps) {
  const [step, setStep] = useState<Step>("select");
  const [selectedPersona, setSelectedPersona] = useState<PersonaConfig | null>(null);
  const [customRole, setCustomRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [hearts, setHearts] = useState(5);
  const [showHistory, setShowHistory] = useState(false);

  const [messages, setMessages] = useState<RoleplayMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [selectedMessageIdx, setSelectedMessageIdx] = useState<number | null>(null);

  // Microphone speech transcription states
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [visualizerStream, setVisualizerStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (visualizerStream) {
        visualizerStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [visualizerStream]);

  // Auto-scroll chat window ref
  const chatEndRef = useRef<HTMLDivElement>(null);

  const personas: PersonaConfig[] = [
    {
      id: "salary",
      name: "Arthur Vance",
      role: "VP of Operations (Cost-conscious Boss)",
      avatarBg: "bg-rose-500/10 border-rose-500/20 text-rose-400",
      avatarText: "AV",
      desc: "Arthur is tough, strict, and cares heavily about budget limits. Practices asking for a salary raise.",
      openingText: "Alright, let's make this quick. I received your request for a salary review, but as you know, operations are under tight budget constraints this quarter. What makes you think you deserve a raise right now?"
    },
    {
      id: "venture",
      name: "Elena Rostova",
      role: "Managing Director (Venture Capital Investor)",
      avatarBg: "bg-sky-500/10 border-sky-500/20 text-sky-400",
      avatarText: "ER",
      desc: "Elena evaluates tech startups. She looks for clear value props and validation, and dislikes buzzwords.",
      openingText: "Thanks for connecting. We see dozens of SaaS pitches weekly. In plain English, tell me what problem you are solving, who your initial users are, and why they pay you."
    },
    {
      id: "networking",
      name: "Dr. Marcus Brody",
      role: "Senior Researcher (Conference Coffee Chat)",
      avatarBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
      avatarText: "MB",
      desc: "Marcus is friendly but busy. Practices striking up a casual, professional conversation to network.",
      openingText: "Hello there! Quite a turnout for the conference. The keynote speaker had some interesting thoughts on AI interface constraints. What did you think of the presentation?"
    },
    {
      id: "client",
      name: "Sarah Jenkins",
      role: "VP of Technology (Frustrated Premium Client)",
      avatarBg: "bg-purple-500/10 border-purple-500/20 text-purple-400",
      avatarText: "SJ",
      desc: "Sarah's company lost key transactions due to a software outage. Practices apology and recovery negotiations.",
      openingText: "Thanks for jumping on this call. Our dashboard has been down for three hours, and we've lost critical transactions. I need to know exactly what happened, and what you're doing to prevent this."
    }
  ];

  // Auto-launch preset persona from learning path
  useEffect(() => {
    if (initialPersonaId && step === "select") {
      const persona = personas.find(p => p.id === initialPersonaId);
      if (persona) {
        startChat(persona);
      }
    }
  }, [initialPersonaId, step]);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startChat = (persona: PersonaConfig) => {
    setSelectedPersona(persona);
    setMessages([
      { sender: "character", text: persona.openingText }
    ]);
    setSelectedMessageIdx(null);
    setHearts(5);
    setStep("chat");
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRole.trim()) return;
    setLoading(true);
    setError("");

    const customPersona: PersonaConfig = {
      id: "custom",
      name: "AI Counterpart",
      role: customRole.trim(),
      avatarBg: "bg-orange-500/10 border-orange-500/20 text-orange-400",
      avatarText: "AI",
      desc: `Custom scenario: ${customRole}`,
      openingText: ""
    };

    try {
      // Call API with empty history to let the custom persona start the conversation
      const res = await fetch("/api/practice/roleplay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: customRole.trim(),
          history: []
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to start custom simulation");

      customPersona.openingText = json.nextMessage;
      setSelectedPersona(customPersona);
      setMessages([
        { sender: "character", text: json.nextMessage }
      ]);
      setSelectedMessageIdx(null);
      setStep("chat");
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || !selectedPersona || sending) return;

    const userText = userInput.trim();
    setUserInput("");
    setSending(true);
    setError("");

    // Add user message locally
    const updatedMessages = [...messages, { sender: "user" as const, text: userText }];
    setMessages(updatedMessages);

    try {
      // Send conversation history to API
      const res = await fetch("/api/practice/roleplay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: selectedPersona.id === "custom" ? selectedPersona.role : selectedPersona.id,
          history: updatedMessages
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to connect to simulation coach");

      // Update the user's message with evaluation details
      const evaluatedMessages = updatedMessages.map((msg, idx) => {
        if (idx === updatedMessages.length - 1) {
          return { ...msg, evaluation: json.evaluation };
        }
        return msg;
      });

      if (json.evaluation && typeof json.evaluation.score === "number") {
        if (json.evaluation.score < 6) {
          setHearts((prev) => Math.max(0, prev - 1));
        }
      }

      // Add character next response
      setMessages([...evaluatedMessages, { sender: "character" as const, text: json.nextMessage }]);
      
      // Auto-select the newly evaluated message for coaching tips
      setSelectedMessageIdx(evaluatedMessages.length - 1);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (visualizerStream) {
      visualizerStream.getTracks().forEach(track => track.stop());
      setVisualizerStream(null);
    }
    setIsListening(false);
  };

  // Web Speech STT integration
  const toggleListening = async () => {
    if (!SpeechRecognition) {
      setError("Speech recognition not supported in this browser.");
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setVisualizerStream(stream);
      } catch (err) {
        console.warn("Could not get microphone stream for visualizer", err);
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(prev => (prev + " " + transcript).trim());
        stopListening();
      };

      recognition.onerror = (event: any) => {
        console.error("STT error:", event.error);
        stopListening();
      };

      recognition.onend = () => {
        stopListening();
      };

      recognition.start();
    }
  };

  const handleFinishRoleplay = () => {
    setStep("scorecard");
  };

  const completeSimulationSession = () => {
    onComplete();
    setStep("select");
    setSelectedPersona(null);
    setMessages([]);
  };

  // Dashboard score averages
  const userTurns = messages.filter(m => m.sender === "user" && m.evaluation);
  const avgScore = userTurns.length > 0 
    ? Math.round((userTurns.reduce((acc, curr) => acc + (curr.evaluation?.score || 0), 0) / userTurns.length) * 10) / 10 
    : 0;

  const totalGrammarErrors = userTurns.reduce((acc, curr) => acc + (curr.evaluation?.grammarErrors.length || 0), 0);

  // Radial score indicator SVG
  const ScoreBadge = ({ score }: { score: number }) => {
    const percentage = score * 10;
    const radius = 32;
    const strokeDasharray = 2 * Math.PI * radius;
    const strokeDashoffset = strokeDasharray - (percentage / 100) * strokeDasharray;

    return (
      <div className="relative w-20 h-20 mx-auto">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="40" cy="40" r={radius} className="stroke-white/5 fill-transparent" strokeWidth="6" />
          <circle 
            cx="40" 
            cy="40" 
            r={radius} 
            className="fill-transparent stroke-orange-500" 
            strokeWidth="6" 
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold font-mono text-white leading-none">{score}</span>
          <span className="text-[9px] uppercase font-semibold text-[var(--text-secondary)] mt-0.5">Rating</span>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-panel p-6 w-full max-w-4xl mx-auto border-orange-500/10 shadow-[0_0_30px_rgba(249,115,22,0.02)]">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between mb-6 border-b border-[var(--panel-border)] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-display text-white">AI Conversational Simulator</h2>
            <p className="text-xs text-[var(--text-secondary)]">Practice active speaking and negotiation registers with live AI feedback</p>
          </div>
        </div>

        {step === "chat" && selectedPersona && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full text-rose-400 font-mono text-xs font-bold">
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              <span>{hearts} LIVES</span>
            </div>
            <span className="text-xs text-[var(--text-secondary)] bg-white/5 border border-white/10 px-3 py-1 rounded-full">
              Turns: {userTurns.length} / 5
            </span>
            <button
              onClick={handleFinishRoleplay}
              disabled={userTurns.length === 0}
              className="text-xs font-semibold bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-3 py-1 rounded-full transition-colors"
            >
              Finish & Review
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-500 text-red-700 p-4 rounded-xl mb-6 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* STEP 1: SELECT PERSONA / CUSTOM SCENARIO */}
      {step === "select" && (
        <div className="space-y-6 animate-fade-in text-slate-800">
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed font-medium">
            Select a dialogue partner to begin the simulation. You will participate in a realistic turn-based conversation, and the AI coach will evaluate your phrasing, grammar, and register level for each message.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {personas.map((p) => (
              <button
                key={p.id}
                onClick={() => startChat(p)}
                disabled={loading}
                className="text-left p-5 rounded-2xl border-2 border-slate-800 bg-[#fffdfa] hover:border-violet-500 hover:shadow-[3px_3px_0px_#8b5cf6] transition-all text-slate-800 flex flex-col justify-between h-44 disabled:opacity-50 group hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold group-hover:text-violet-600 transition-colors text-slate-800">{p.name}</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-white border border-slate-300 rounded shadow-[1px_1px_0px_rgba(0,0,0,0.1)]">Scenario</span>
                  </div>
                  <div className="text-xs font-bold text-violet-600 mb-2">{p.role}</div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">{p.desc}</p>
                </div>
                <div className="text-xs text-violet-600 font-bold group-hover:underline">Start Simulation →</div>
              </button>
            ))}
          </div>

          {/* Custom Scenario Form */}
          <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-800 shadow-[2.5px_2.5px_0px_rgba(30,41,59,1)] space-y-4">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" /> Create your own custom scenario:
            </h4>
            <form onSubmit={handleCustomSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="e.g., Requesting a deadline extension from a strict client, or practicing a salary negotiation..."
                className="flex-1 bg-white border-2 border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 text-slate-800 placeholder-slate-400 font-medium w-full"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !customRole.trim()}
                className="btn-primary bg-violet-500 hover:bg-violet-600 text-white border-2 border-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] disabled:opacity-50 flex-shrink-0 text-xs px-6 py-3 font-bold rounded-xl w-full sm:w-auto"
              >
                {loading ? "Initializing..." : "Start Custom Sim"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* STEP 2: CHAT INTERFACE & COACH SIDEBAR */}
      {step === "chat" && selectedPersona && (
        <div className="grid md:grid-cols-3 gap-6 animate-fade-in text-slate-800">
          {/* Main Chat box (2/3 cols) */}
          <div className="md:col-span-2 flex flex-col h-[480px] md:h-[530px] border-2 border-slate-800 bg-[#faf8f2] rounded-2xl overflow-hidden relative shadow-[3px_3px_0px_rgba(30,41,59,1)]">
            {/* Persona info bar */}
            <div className="bg-[#f0ede4] px-4 py-3 border-b-2 border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${selectedPersona.avatarBg} border-2 border-slate-800`}>
                  {selectedPersona.avatarText}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">{selectedPersona.name}</div>
                  <div className="text-[10px] text-slate-600 font-bold">{selectedPersona.role}</div>
                </div>
              </div>

              {/* Heart Lives Display */}
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-4 h-4 ${
                      i < hearts 
                        ? "fill-rose-500 text-rose-600 animate-pulse" 
                        : "text-slate-400 fill-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Immersive Duolingo-style Center Card */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col justify-between bg-white" style={{ scrollbarWidth: "thin" }}>
              
              {/* Mascot & Character Bubble */}
              <div className="space-y-4 flex-1 flex flex-col justify-center">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl ${selectedPersona.avatarBg} border-4 border-slate-850 shadow-[2px_2px_0px_#000] animate-bounce`}>
                    {selectedPersona.avatarText}
                  </div>
                  <span className="text-xs font-bold bg-slate-100 border border-slate-350 px-2 py-0.5 rounded text-slate-700">
                    {selectedPersona.name} is speaking...
                  </span>
                </div>

                {/* Big Comic Dialogue Bubble */}
                <div className="relative bg-violet-50 text-slate-800 border-2 border-slate-800 p-4 rounded-2xl shadow-[3.5px_3.5px_0px_rgba(30,41,59,1)] text-sm md:text-base leading-relaxed max-w-lg mx-auto">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-violet-50 border-t-2 border-l-2 border-slate-800 rotate-45" />
                  <p className="font-semibold text-center">
                    "{(() => {
                      const lastCharMsg = [...messages].reverse().find(m => m.sender === "character");
                      return lastCharMsg ? lastCharMsg.text : selectedPersona.openingText;
                    })()}"
                  </p>
                </div>
              </div>

              {/* Last User Message Card & Coach Tag */}
              {(() => {
                const userMsgs = messages.filter(m => m.sender === "user");
                if (userMsgs.length === 0) return null;
                const lastUserMsg = userMsgs[userMsgs.length - 1];
                return (
                  <div className="bg-slate-50 border-2 border-slate-800 rounded-xl p-3 shadow-[2.5px_2.5px_0px_rgba(30,41,59,1)] max-w-md mx-auto w-full animate-fade-in">
                    <div className="text-[10px] uppercase font-bold text-violet-600 mb-0.5">Your Response:</div>
                    <p className="text-xs text-slate-800 italic">"{lastUserMsg.text}"</p>
                    {lastUserMsg.evaluation && (
                      <button
                        type="button"
                        onClick={() => {
                          const idx = messages.indexOf(lastUserMsg);
                          if (idx !== -1) setSelectedMessageIdx(idx);
                        }}
                        className="text-[9.5px] text-violet-600 font-bold flex items-center gap-1 mt-1 hover:underline cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-violet-500 animate-pulse" />
                        Rating: {lastUserMsg.evaluation.score}/10 — Click for Speech Coach analysis
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Toggleable Logs History Drawer */}
              {messages.length > 2 && (
                <div className="border-t border-slate-200 pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-[11px] font-bold text-violet-600 hover:underline inline-flex items-center gap-1"
                  >
                    {showHistory ? "Hide Conversation History ▲" : "Show Full Conversation History ▼"}
                  </button>

                  {showHistory && (
                    <div className="mt-2 text-left max-h-32 overflow-y-auto p-2 border border-slate-200 bg-slate-50 rounded-xl space-y-2 text-xs">
                      {messages.map((msg, i) => (
                        <div key={i} className="flex gap-1">
                          <span className="font-bold text-[var(--text-secondary)] min-w-[70px] inline-block">
                            {msg.sender === "character" ? selectedPersona.name : "You"}:
                          </span>
                          <span className="text-slate-700">{msg.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Audio Visualizer overlay inside Chat window */}
            {isListening && (
              <div className="px-4 py-2 bg-slate-50 border-t-2 border-slate-850 animate-fade-in">
                <AudioVisualizer isRecording={isListening} theme="violet" stream={visualizerStream} />
              </div>
            )}

            {/* Dialog Input Form */}
            <form onSubmit={handleSendMessage} className="bg-[#f0ede4] p-3 border-t-2 border-slate-800 flex gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={sending ? "Waiting for AI reply..." : "Type your dialogue response here..."}
                disabled={sending || userTurns.length >= 5 || hearts === 0}
                className="flex-1 bg-white border-2 border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 text-slate-800 placeholder-slate-400 font-medium disabled:opacity-50"
              />
              
              {/* Voice input key */}
              <button
                type="button"
                onClick={toggleListening}
                disabled={sending || userTurns.length >= 5 || hearts === 0}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors border-2 border-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)] active:translate-y-0.5 active:shadow-none ${
                  isListening 
                    ? "bg-red-500 border-red-600 text-white animate-pulse" 
                    : "bg-white text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                }`}
                title="Tap to speak"
              >
                {isListening ? <Square className="w-4 h-4 fill-current text-red-650" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                type="submit"
                disabled={sending || !userInput.trim() || userTurns.length >= 5 || hearts === 0}
                className="w-11 h-11 rounded-xl bg-violet-500 hover:bg-violet-600 text-white border-2 border-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)] flex items-center justify-center disabled:opacity-50 active:translate-y-0.5 active:shadow-none transition-colors"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Live Coaching Sidebar (1/3 col) */}
          <div className="md:col-span-1 bg-[#faf8f2] border-2 border-slate-800 rounded-2xl p-4 flex flex-col h-[480px] md:h-[530px] overflow-y-auto shadow-[3px_3px_0px_rgba(30,41,59,1)]" style={{ scrollbarWidth: "none" }}>
            <h4 className="text-xs uppercase tracking-wider text-violet-600 font-bold mb-4 flex items-center gap-1.5 border-b-2 border-slate-800 pb-2">
              <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" /> Duo Mascot Speech Coach
            </h4>

            {selectedMessageIdx !== null && messages[selectedMessageIdx]?.evaluation ? (
              <div className="space-y-4 animate-fade-in text-sm font-medium">
                {/* Score Card */}
                <div className="bg-white p-3 rounded-xl border-2 border-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)] flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Dialogue Suitability:</span>
                  <span className="text-sm font-mono font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                    {messages[selectedMessageIdx].evaluation?.score} / 10
                  </span>
                </div>

                {/* Register Bubble */}
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-wider text-violet-600 font-bold">Register Analysis</div>
                  <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border-2 border-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)] leading-relaxed">
                    {messages[selectedMessageIdx].evaluation?.feedback}
                  </p>
                </div>

                {/* Grammar Errors */}
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-wider text-rose-600 font-bold">Grammar & Syntax Correction</div>
                  {messages[selectedMessageIdx].evaluation?.grammarErrors && messages[selectedMessageIdx].evaluation!.grammarErrors.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1 text-xs text-rose-800 bg-rose-50 p-3 rounded-xl border-2 border-rose-300 font-bold">
                      {messages[selectedMessageIdx].evaluation!.grammarErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-emerald-800 italic bg-emerald-50 p-3 rounded-xl border-2 border-emerald-250 font-bold">
                      ✓ Zero grammar errors. Perfectly executed sentence!
                    </p>
                  )}
                </div>

                {/* Alternative Upgrade */}
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Native Upgrade Tip
                  </div>
                  <p className="text-xs text-emerald-950 italic font-bold bg-emerald-50 p-3 rounded-xl border-2 border-emerald-250 leading-relaxed shadow-[2px_2px_0px_rgba(16,185,129,0.15)]">
                    "{messages[selectedMessageIdx].evaluation?.alternativeSuggestion}"
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <div className="w-14 h-14 bg-violet-100 border-2 border-slate-850 rounded-full flex items-center justify-center text-violet-600 font-bold text-2xl mb-2 animate-bounce">
                  🦉
                </div>
                <p className="text-xs font-bold text-slate-800">Duo Mascot Coach</p>
                <p className="text-[11px] text-slate-500 max-w-[170px] mt-1">
                  Submit a reply, then click on it to show your active fluency metrics here!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: WRAP-UP MEETING SCORECARD */}
      {step === "scorecard" && selectedPersona && (
        <div className="space-y-6 animate-fade-in text-slate-800 font-medium">
          {/* Header Summary */}
          <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Dialogue Complete!</span>
              <h3 className="text-2xl font-display font-bold text-slate-800 mt-1">Course Performance Summary</h3>
            </div>
            
            {/* Stars display */}
            <div className="flex gap-1 bg-amber-50 border-2 border-amber-300 px-3 py-1.5 rounded-full shadow-[2px_2px_0px_#d97706]">
              {[...Array(3)].map((_, i) => {
                const starsCount = avgScore >= 8.5 ? 3 : avgScore >= 7.0 ? 2 : 1;
                return (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < starsCount 
                        ? "fill-amber-400 text-amber-600 animate-pulse" 
                        : "text-slate-300 fill-slate-100"
                    }`}
                  />
                );
              })}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Scorecard Widget */}
            <div className="bg-white p-5 rounded-2xl border-2 border-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] flex flex-col items-center justify-center text-center gap-4">
              <ScoreBadge score={avgScore} />
              <div>
                <div className="text-sm font-bold text-slate-800">Average Fluency score</div>
                <p className="text-xs text-slate-500 mt-1">
                  Evaluated pacing, register suitability, and idiomatic vocabulary selection.
                </p>
              </div>
            </div>

            {/* XP and progress metrics */}
            <div className="bg-white p-5 rounded-2xl border-2 border-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] space-y-4 flex flex-col justify-center">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Total Turns Played:</span>
                <span className="font-mono text-sm font-bold text-slate-800">{userTurns.length}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">XP Gained:</span>
                <span className="font-mono text-xs font-bold text-violet-650 bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                  +{Math.round(avgScore * 10 + userTurns.length * 5)} XP
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Health Remaining:</span>
                <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-600" /> {hearts} / 5 Lives
                </span>
              </div>
            </div>

            {/* Coaching conclusion */}
            <div className="bg-white p-5 rounded-2xl border-2 border-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] flex flex-col justify-center gap-2">
              <div className="text-xs uppercase tracking-wider text-violet-600 font-bold flex items-center gap-1">
                <Award className="w-4 h-4 text-violet-500" /> Coach Verdict
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {avgScore >= 8.5 ? (
                  <span>Masterful negotiation! You successfully maintained a native register with proper diplomacy. Reward: Golden Speaker Badge!</span>
                ) : avgScore >= 7.0 ? (
                  <span>Well done. You navigated the scenario successfully, though your register slipped occasionally. Keep practicing!</span>
                ) : (
                  <span>A good training effort. Review the specific feedback options below to expand your vocabulary range next time.</span>
                )}
              </p>
            </div>
          </div>

          {/* Dialogue Recap & Alternatives list */}
          <div className="bg-white border-2 border-slate-800 p-5 rounded-2xl space-y-4 shadow-[3px_3px_0px_rgba(30,41,59,1)]">
            <h5 className="text-xs uppercase tracking-wider text-violet-600 font-bold">
              Dialogue Upgrade Recap
            </h5>
            <p className="text-xs text-slate-500">
              Review how you can polish your statements to speak like a native speaker:
            </p>

            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
              {userTurns.map((turn, i) => (
                <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs font-medium">
                  <div>
                    <strong className="text-slate-500">Your Statement:</strong>
                    <p className="text-slate-800 mt-0.5">"{turn.text}"</p>
                  </div>
                  <div className="border-t border-slate-200 pt-2">
                    <strong className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Polished Native Upgrade:
                    </strong>
                    <p className="text-emerald-950 italic mt-0.5">"{turn.evaluation?.alternativeSuggestion}"</p>
                  </div>
                  {turn.evaluation?.grammarErrors && turn.evaluation!.grammarErrors.length > 0 && (
                    <div className="text-[10px] text-rose-700 mt-1 italic font-semibold">
                      Corrections: {turn.evaluation!.grammarErrors.join(" | ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[var(--panel-border)] flex justify-between">
            <button
              onClick={() => {
                setStep("select");
                setSelectedPersona(null);
                setMessages([]);
              }}
              className="btn-secondary text-slate-800 border-2 border-slate-800 font-semibold"
            >
              Start Another Negotiation
            </button>
            <button
              onClick={completeSimulationSession}
              className="btn-primary bg-violet-500 hover:bg-violet-600 text-white border-2 border-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] px-8 font-bold"
            >
              Save Progress & Return
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
