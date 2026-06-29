"use client";

import { useState, useEffect, useRef } from "react";
import { Shield, Wind, Volume2, Mic, Square, Sparkles, CheckCircle2, Heart, Award, ArrowRight, RefreshCw, Smile, ThumbsUp, Play, Pause, RotateCcw } from "lucide-react";
import { ConfidenceEvaluationResponse, ShadowPhrase } from "@/lib/types";
import { AudioVisualizer } from "./AudioVisualizer";

type Phase = "warmup" | "shadow" | "mirror";

export function ConfidenceStudio() {
  const [activePhase, setActivePhase] = useState<Phase>("warmup");

  // Phase 1: Breath-work states
  const [isBreathingRunning, setIsBreathingRunning] = useState(false);
  const [breathState, setBreathState] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [breathTimer, setBreathTimer] = useState(4);
  const [warmupIndex, setWarmupIndex] = useState(0);

  // Phase 2: Shadow phrases states
  const [shadowTopic, setShadowTopic] = useState("Everyday Friendly Conversation");
  const [shadowPhrases, setShadowPhrases] = useState<ShadowPhrase[]>([]);
  const [loadingShadow, setLoadingShadow] = useState(false);
  const [practicedIds, setPracticedIds] = useState<string[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Phase 3: Mirror mode states
  const [mirrorPrompt, setMirrorPrompt] = useState("Describe a recent moment that made you smile or feel grateful.");
  const [spokenText, setSpokenText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [loadingMirror, setLoadingMirror] = useState(false);
  const [mirrorEval, setMirrorEval] = useState<ConfidenceEvaluationResponse | null>(null);
  const recognitionRef = useRef<any>(null);
  const [visualizerStream, setVisualizerStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (visualizerStream) {
        visualizerStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [visualizerStream]);

  const warmupAffirmations = [
    "My voice is clear, my thoughts are valid, and I speak with calm confidence.",
    "Fluency is about connection, not perfection. Every word I speak builds muscle memory.",
    "I pause naturally between ideas. Taking my time shows mastery and self-assurance.",
    "Mistakes are simply stepping stones to native-level cadence and rhythm."
  ];

  // Breathing cycle animation effect
  useEffect(() => {
    if (activePhase !== "warmup" || !isBreathingRunning) return;

    const interval = setInterval(() => {
      setBreathTimer((prev) => {
        if (prev <= 1) {
          setBreathState((current) => {
            if (current === "inhale") return "hold";
            if (current === "hold") return "exhale";
            return "inhale";
          });
          return breathState === "inhale" ? 2 : 4; // 4s inhale, 2s hold, 4s exhale
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activePhase, isBreathingRunning, breathState]);

  // Fetch shadow phrases
  const fetchShadowPhrases = async (topic: string) => {
    setLoadingShadow(true);
    setShadowPhrases([]);
    try {
      const res = await fetch("/api/practice/confidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "shadow", topic })
      });
      const data = await res.json();
      if (res.ok && data.phrases) {
        setShadowPhrases(data.phrases);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingShadow(false);
    }
  };

  useEffect(() => {
    if (activePhase === "shadow" && shadowPhrases.length === 0) {
      fetchShadowPhrases(shadowTopic);
    }
  }, [activePhase]);

  // Play audio using SpeechSynthesis
  const handlePlayVoice = (id: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for clear shadowing
    utterance.lang = "en-US";

    // Try to find a natural English voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.includes("en") && (v.name.includes("Natural") || v.name.includes("Samantha") || v.name.includes("Google")));
    if (englishVoice) utterance.voice = englishVoice;

    utterance.onstart = () => setPlayingId(id);
    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);

    window.speechSynthesis.speak(utterance);
  };

  const togglePracticed = (id: string) => {
    setPracticedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (visualizerStream) {
      visualizerStream.getTracks().forEach(track => track.stop());
      setVisualizerStream(null);
    }
    setIsRecording(false);
  };

  // Web Speech API Recording for Mirror Mode
  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    const SpeechRecognition = typeof window !== "undefined" ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please type your answer directly!");
      return;
    }

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setVisualizerStream(stream);
    } catch (err) {
      console.warn("Could not get microphone stream for visualizer", err);
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let currentTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript + " ";
      }
      setSpokenText(currentTranscript);
    };

    recognition.onerror = (e: any) => {
      console.error("Mic error:", e);
      stopRecording();
    };

    recognition.onend = () => {
      stopRecording();
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const handleEvaluateMirror = async () => {
    if (!spokenText.trim()) return;
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    setLoadingMirror(true);
    setMirrorEval(null);
    try {
      const res = await fetch("/api/practice/confidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "mirror", text: spokenText })
      });
      const data = await res.json();
      if (res.ok && data.evaluation) {
        setMirrorEval(data.evaluation);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMirror(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#fcf9f2] text-slate-800 p-6 overflow-y-auto animate-fade-in">
      {/* Studio Header */}
      <div className="bg-white p-6 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-2 border-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] rounded-2xl">
        <div>
          <div className="flex items-center gap-2 text-pink-600 font-bold mb-1">
            <Shield className="w-5 h-5" /> Judgment-Free Sanctuary
          </div>
          <h2 className="text-2xl font-display font-bold text-slate-800">Overcoming Shyness & Speaking Anxiety</h2>
          <p className="text-slate-600 text-sm max-w-2xl mt-1 font-medium">
            Here, we disable harsh red-ink syntax corrections. Build vocal muscle memory, calm nervous breathing, and practice speaking with zero fear of negative evaluation.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row bg-slate-50 p-1 rounded-xl border-2 border-slate-800 shadow-[1.5px_1.5px_0px_rgba(30,41,59,1)] shrink-0 w-full sm:w-auto">
          <button
            onClick={() => setActivePhase("warmup")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 w-full sm:w-auto ${activePhase === "warmup" ? "bg-pink-500 text-white shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] border border-slate-900" : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"}`}
          >
            <Wind className="w-4 h-4" /> 1. Breath Warmup
          </button>
          <button
            onClick={() => setActivePhase("shadow")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 w-full sm:w-auto ${activePhase === "shadow" ? "bg-pink-500 text-white shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] border border-slate-900" : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"}`}
          >
            <Volume2 className="w-4 h-4" /> 2. Shadow Scaffolding
          </button>
          <button
            onClick={() => setActivePhase("mirror")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 w-full sm:w-auto ${activePhase === "mirror" ? "bg-pink-500 text-white shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] border border-slate-900" : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"}`}
          >
            <Heart className="w-4 h-4" /> 3. Mirror Zone
          </button>
        </div>
      </div>

      {/* PHASE 1: BREATH & PACING WARMUP */}
      {activePhase === "warmup" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 text-slate-800">
          <div className="bg-white p-8 border-2 border-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-4 left-4 text-xs font-mono uppercase tracking-wider text-pink-600 bg-pink-50 px-3 py-1 rounded-full border-2 border-slate-800 shadow-[1.5px_1.5px_0px_rgba(30,41,59,1)] font-bold">
              Vocal Cord Relaxation
            </div>
            
            {/* Breathing Animation Circle */}
            <div className="my-8 relative flex items-center justify-center">
              <div
                className={`w-48 h-48 rounded-full border-4 flex items-center justify-center transition-all duration-1000 ${
                  breathState === "inhale"
                    ? "scale-110 border-pink-500 bg-pink-50 shadow-[0_0_20px_rgba(236,72,153,0.2)]"
                    : breathState === "hold"
                    ? "scale-110 border-purple-500 bg-purple-50"
                    : "scale-95 border-blue-500 bg-blue-50"
                }`}
              >
                <div className="text-center">
                  <span className="text-3xl font-bold font-display block uppercase tracking-wider text-slate-850">
                    {breathState}
                  </span>
                  <span className="text-xl font-mono text-slate-600 mt-1 block font-semibold">
                    {breathTimer}s
                  </span>
                </div>
              </div>
            </div>

            {/* Manual Clock Controls */}
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setIsBreathingRunning(!isBreathingRunning)}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all border-2 border-slate-800 shadow-[2.5px_2.5px_0px_rgba(30,41,59,1)] active:translate-y-0.5 active:shadow-none ${
                  isBreathingRunning
                    ? "bg-amber-500 hover:bg-amber-600 text-slate-800"
                    : "bg-pink-500 hover:bg-pink-655 text-white"
                }`}
              >
                {isBreathingRunning ? <Pause className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4" />}
                {isBreathingRunning ? "Pause Pacing Clock" : "Start Pacing Clock"}
              </button>
              <button
                onClick={() => {
                  setIsBreathingRunning(false);
                  setBreathState("inhale");
                  setBreathTimer(4);
                }}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border-2 border-slate-800 text-sm font-bold text-slate-700 hover:text-slate-900 flex items-center gap-2 transition-colors shadow-[2.5px_2.5px_0px_rgba(30,41,59,1)] active:translate-y-0.5 active:shadow-none"
                title="Reset Clock"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            </div>

            <div className="bg-green-50 border-2 border-green-500 px-4 py-2 rounded-xl mb-3 flex items-center gap-2 text-xs text-green-800 font-medium">
              <Shield className="w-3.5 h-3.5 text-green-600 shrink-0" />
              <span><strong>Self-Paced Guarantee:</strong> You are in complete control. Pause or restart whenever you need. There is zero pressure.</span>
            </div>

            <p className="text-slate-500 text-xs max-w-md font-medium leading-relaxed">
              Shallow, rapid breathing triggers vocal constriction. Inhale through your nose for 4 seconds, hold for 2, and speak calmly on the slow exhale.
            </p>
          </div>

          <div className="bg-white p-8 border-2 border-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-display font-bold mb-2 flex items-center gap-2 text-slate-850">
                <Sparkles className="w-5 h-5 text-amber-500" /> Speaking Affirmations
              </h3>
              <p className="text-slate-500 text-sm mb-6 font-medium">
                Read the affirmation aloud during your exhale. Feel the vibration in your chest and speak at a deliberate, unhurried pace.
              </p>

              <div className="bg-[#fffdfa] border-2 border-slate-850 p-6 rounded-2xl mb-6 min-h-[140px] flex items-center justify-center text-center shadow-[inset_1px_1px_4px_rgba(0,0,0,0.05)]">
                <p className="text-xl font-bold leading-relaxed italic text-pink-700">
                  "{warmupAffirmations[warmupIndex]}"
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono font-bold">
                Affirmation {warmupIndex + 1} of {warmupAffirmations.length}
              </span>
              <button
                onClick={() => setWarmupIndex((prev) => (prev + 1) % warmupAffirmations.length)}
                className="btn-secondary px-5 py-2.5 text-slate-800 border-2 border-slate-800 font-bold rounded-xl text-sm flex items-center gap-2 active:translate-y-0.5 shadow-[2px_2px_0px_#1e293b]"
              >
                Next Affirmation <ArrowRight className="w-4 h-4 text-slate-800" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 2: SHADOW-SPEAKING SCAFFOLDING */}
      {activePhase === "shadow" && (
        <div className="space-y-6 flex-1 text-slate-800">
          <div className="bg-white p-6 border-2 border-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-display font-bold">Listen & Repeat (Shadowing)</h3>
              <p className="text-sm text-[var(--text-secondary)] font-medium">
                Eliminate the anxiety of generating sentence structure on the spot. Listen to the AI voice rhythm, then echo it back.
              </p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
              <select
                value={shadowTopic}
                onChange={(e) => setShadowTopic(e.target.value)}
                className="bg-white border-2 border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-pink-500 font-bold shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)]"
              >
                <option value="Everyday Friendly Conversation">Friendly Conversation</option>
                <option value="Expressing Opinions Politely">Expressing Opinions</option>
                <option value="Meeting New Colleagues">Meeting New Colleagues</option>
                <option value="Job Interview Warmup">Job Interview Warmup</option>
              </select>
              <button
                onClick={() => fetchShadowPhrases(shadowTopic)}
                disabled={loadingShadow}
                className="btn-secondary px-4 py-2 text-slate-800 border-2 border-slate-800 font-bold rounded-xl text-sm flex items-center gap-2 whitespace-nowrap active:translate-y-0.5 shadow-[2px_2px_0px_#1e293b]"
              >
                <RefreshCw className={`w-4 h-4 ${loadingShadow ? "animate-spin" : ""}`} /> New Phrases
              </button>
            </div>
          </div>

          {loadingShadow ? (
            <div className="bg-white p-12 text-center text-slate-500 border-2 border-slate-850 rounded-2xl shadow-[3px_3px_0px_#1e293b]">
              <Sparkles className="w-8 h-8 mx-auto mb-3 animate-pulse text-pink-500" />
              Crafting warm, conversational shadow phrases...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shadowPhrases.map((item) => {
                const isPracticed = practicedIds.includes(item.id);
                const isPlaying = playingId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`bg-white p-5 rounded-2xl shadow-[3px_3px_0px_rgba(30,41,59,1)] transition-all border-2 border-slate-800 flex flex-col justify-between ${
                      isPracticed ? "bg-green-50 border-green-600 shadow-[3px_3px_0px_rgba(22,163,74,1)]" : "hover:border-pink-500 hover:shadow-[3px_3px_0px_#ec4899]"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <span className="text-xs font-mono uppercase bg-pink-50 px-2.5 py-1 rounded-md text-pink-700 border border-pink-200 font-bold">
                          {item.context}
                        </span>
                        <button
                          onClick={() => togglePracticed(item.id)}
                          className={`text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all font-bold ${
                            isPracticed 
                              ? "bg-green-100 text-green-700 border-green-300" 
                              : "bg-slate-50 border-slate-300 text-slate-600 hover:text-slate-800"
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> {isPracticed ? "Practiced" : "Mark Done"}
                        </button>
                      </div>

                      <p className="text-lg font-bold mb-4 leading-relaxed text-slate-800">
                        "{item.phrase}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-200 mt-auto">
                      <span className="text-xs text-slate-500 italic font-semibold">
                        💡 Tip: {item.tip}
                      </span>
                      <button
                        onClick={() => handlePlayVoice(item.id, item.phrase)}
                        className={`p-2.5 rounded-xl border-2 border-slate-800 font-bold text-sm transition-all flex items-center gap-2 active:translate-y-0.5 ${
                          isPlaying 
                            ? "bg-pink-500 text-white animate-pulse shadow-[1px_1px_0px_#1e293b]" 
                            : "bg-white text-pink-650 hover:bg-pink-50 shadow-[2px_2px_0px_#1e293b]"
                        }`}
                      >
                        <Volume2 className="w-4 h-4" /> {isPlaying ? "Playing..." : "Listen"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PHASE 3: THE MIRROR ZONE (JUDGMENT-FREE) */}
      {activePhase === "mirror" && (
        <div className="space-y-6 flex-1 flex flex-col text-slate-800">
          <div className="bg-white p-6 border-2 border-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] rounded-2xl">
            <h3 className="text-lg font-display font-bold mb-1 flex items-center gap-2 text-slate-850">
              <Smile className="w-5 h-5 text-pink-500" /> Judgment-Free Free-Speak
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4 font-medium">
              Speak naturally for 30–60 seconds. Our AI will focus 100% on encouraging your flow, confidence wins, and positive reinforcement. Zero red error highlights!
            </p>

            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-4">
              <input
                type="text"
                value={mirrorPrompt}
                onChange={(e) => setMirrorPrompt(e.target.value)}
                placeholder="Topic prompt..."
                className="flex-1 bg-white border-2 border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-pink-500 font-semibold shadow-[1px_1px_0px_rgba(0,0,0,1)]"
              />
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setMirrorPrompt("What is a hobby or topic you could talk about for hours?")}
                  className="px-3 py-2 bg-slate-50 border-2 border-slate-850 rounded-xl text-xs hover:border-pink-500/40 text-slate-600 hover:text-slate-800 font-bold shadow-[1px_1px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
                >
                  Prompt: Hobby
                </button>
                <button
                  onClick={() => setMirrorPrompt("Describe your favorite comfort food and why you love it.")}
                  className="px-3 py-2 bg-slate-50 border-2 border-slate-850 rounded-xl text-xs hover:border-pink-500/40 text-slate-600 hover:text-slate-800 font-bold shadow-[1px_1px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
                >
                  Prompt: Food
                </button>
              </div>
            </div>

            {isRecording && (
              <div className="mb-4 animate-fade-in">
                <AudioVisualizer isRecording={isRecording} theme="pink" stream={visualizerStream} />
              </div>
            )}

            <div className="relative">
              <textarea
                value={spokenText}
                onChange={(e) => setSpokenText(e.target.value)}
                placeholder="Click the microphone button and start speaking freely, or type your response here..."
                className="w-full h-36 bg-white border-2 border-slate-800 rounded-2xl p-4 text-slate-850 placeholder-slate-400 focus:outline-none focus:border-pink-500 resize-none leading-relaxed font-medium shadow-[inset_1px_1px_4px_rgba(0,0,0,0.05)]"
              />
              
              <div className="absolute bottom-4 right-4 flex items-center gap-3">
                <button
                  onClick={toggleRecording}
                  className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border-2 border-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)] transition-all active:translate-y-0.5 active:shadow-none ${
                    isRecording
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-white text-pink-650"
                  }`}
                >
                  {isRecording ? <Square className="w-4 h-4 text-red-655" /> : <Mic className="w-4 h-4" />}
                  {isRecording ? "Stop Recording" : "Mic Input"}
                </button>

                <button
                  onClick={handleEvaluateMirror}
                  disabled={loadingMirror || !spokenText.trim()}
                  className="btn-primary bg-pink-500 hover:bg-pink-650 text-white border-2 border-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)] px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50 active:translate-y-0.5"
                >
                  {loadingMirror ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                  Get Coach Affirmation
                </button>
              </div>
            </div>
          </div>

          {/* Mirror Evaluation Results */}
          {mirrorEval && (
            <div className="bg-white p-6 space-y-6 border-2 border-pink-500 rounded-2xl shadow-[3px_3px_0px_rgba(30,41,59,1)] animate-fade-in text-slate-800">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-pink-700 bg-pink-50 px-3 py-1 rounded-full border-2 border-pink-300 font-bold shadow-[1px_1px_0px_rgba(0,0,0,0.05)]">
                    Vocal Coach Feedback
                  </span>
                  <h4 className="text-xl font-display font-bold mt-3 text-slate-800">
                    "{mirrorEval.overallAffirmation}"
                  </h4>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 px-5 py-3 rounded-2xl border-2 border-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)] shrink-0">
                  <Award className="w-8 h-8 text-amber-500" />
                  <div>
                    <span className="text-xs text-[var(--text-secondary)] block uppercase font-bold">Flow Score</span>
                    <span className="text-2xl font-bold font-mono text-pink-600">{mirrorEval.flowScore}/10</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50/50 p-5 rounded-2xl border-2 border-green-500 shadow-[2px_2px_0px_rgba(0,0,0,0.05)]">
                  <h5 className="text-sm font-bold text-green-700 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" /> Confidence & Clarity Wins
                  </h5>
                  <ul className="space-y-2">
                    {mirrorEval.confidenceWins.map((win, idx) => (
                      <li key={idx} className="text-sm text-green-900 flex items-start gap-2 font-medium">
                        <span className="text-green-600 font-bold">•</span> {win}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-blue-50/50 p-5 rounded-2xl border-2 border-blue-500 shadow-[2px_2px_0px_rgba(0,0,0,0.05)]">
                  <h5 className="text-sm font-bold text-blue-700 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" /> Smooth Transitions Used
                  </h5>
                  <ul className="space-y-2">
                    {mirrorEval.smoothTransitions.map((trans, idx) => (
                      <li key={idx} className="text-sm text-blue-900 flex items-start gap-2 font-medium">
                        <span className="text-blue-600 font-bold">•</span> {trans}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {mirrorEval.gentleUpgrade && (
                <div className="bg-purple-50/50 p-5 rounded-2xl border-2 border-purple-500 shadow-[2.5px_2.5px_0px_rgba(0,0,0,0.02)]">
                  <span className="text-xs font-mono uppercase text-purple-700 block mb-2 font-bold">
                    🚀 Next Level Tip (Supportive Upgrade)
                  </span>
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="flex-1 font-medium">
                      <p className="text-sm text-slate-500 line-through">"{mirrorEval.gentleUpgrade.original}"</p>
                      <p className="text-base font-bold text-slate-800 mt-1">Try saying: <span className="text-purple-700 font-bold">"{mirrorEval.gentleUpgrade.encouragingSuggestion}"</span></p>
                    </div>
                    <p className="text-xs text-slate-600 md:max-w-xs bg-white p-3 rounded-xl border border-slate-200 font-medium">
                      💡 {mirrorEval.gentleUpgrade.whyItSoundsNatural}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
