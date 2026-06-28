"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, AlertCircle, Play, Pause, RotateCcw, Mic, Square, Volume2, Type, Award, Activity, Check, CheckCircle2, ChevronRight } from "lucide-react";
import { SpeechEvaluationResponse } from "@/lib/types";
import { AudioVisualizer } from "./AudioVisualizer";

interface EnrichedTeleprompterResponse {
  title: string;
  speechText: string;
  stressedWords: string[];
  tips: string[];
}

interface FluencyTrainerProps {
  onComplete: () => void;
}

type Step = "select" | "teleprompter" | "evaluation" | "result";
type FontSize = "sm" | "md" | "lg" | "xl";

const SpeechRecognition = typeof window !== "undefined" ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null;

export function FluencyTrainer({ onComplete }: FluencyTrainerProps) {
  const [step, setStep] = useState<Step>("select");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [customTopic, setCustomTopic] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<EnrichedTeleprompterResponse | null>(null);

  // Teleprompter scrolling states
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(3); // 1 to 10
  const [fontSize, setFontSize] = useState<FontSize>("lg");
  const [showPacingGuides, setShowPacingGuides] = useState(true);

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [visualizerStream, setVisualizerStream] = useState<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Time & pacing tracking
  const [startTime, setStartTime] = useState<number | null>(null);
  const [durationInSeconds, setDurationInSeconds] = useState(0);

  // Real-time Speech-to-Text states
  const recognitionRef = useRef<any>(null);
  const [capturedTranscript, setCapturedTranscript] = useState("");

  // Post-practice Evaluation states
  const [evaluation, setEvaluation] = useState<SpeechEvaluationResponse | null>(null);

  const categories = [
    { id: "speaking", label: "Public Speaking", desc: "Toastmasters style, motivational speeches, and keynote phrasing." },
    { id: "corporate", label: "Corporate Pitch", desc: "Executive briefings, venture funding pitches, and product releases." },
    { id: "storytelling", label: "Storytelling & Dialogue", desc: "Casual networking anecdotes, emotional storytelling, and pacing." },
    { id: "philosophical", label: "Philosophical Lecture", desc: "Reflective essays, logical debates, and deep meditative pacing." }
  ];

  const fetchSpeech = async (categoryId: string) => {
    setLoading(true);
    setError("");
    setSelectedCategory(categoryId);
    setAudioUrl(null);
    setCapturedTranscript("");
    setEvaluation(null);

    try {
      const res = await fetch("/api/practice/teleprompter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: categoryId }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to generate speech");

      setData(json);
      setStep("teleprompter");
      setIsPlaying(false);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopic.trim()) return;
    await fetchSpeech(customTopic.trim());
  };

  // Teleprompter scrolling engine
  useEffect(() => {
    let animationFrameId: number;

    const scroll = () => {
      if (containerRef.current && isPlaying) {
        containerRef.current.scrollTop += scrollSpeed * 0.35;

        // Auto stop if we reach the end
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 3) {
          setIsPlaying(false);
          if (isRecording) {
            handleStopPractice();
          }
        }
      }

      if (isPlaying) {
        animationFrameId = requestAnimationFrame(scroll);
      }
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(scroll);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, scrollSpeed, isRecording]);

  // Audio self-recording helpers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setVisualizerStream(stream);
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setAudioUrl(null);
    } catch (err: any) {
      console.error("Microphone permission denied or error:", err);
      setError("Unable to access microphone. You can still practice reading, but recording/real-time feedback will be limited.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setVisualizerStream(null);
    }
  };

  // Real-time Web Speech Transcription
  const startSpeechRecognition = () => {
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    let accumTranscript = "";

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        }
      }
      accumTranscript += finalTranscript;
      setCapturedTranscript(accumTranscript.trim());
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
    };

    recognition.start();
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  const handleStartPractice = async () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    setStartTime(Date.now());
    setDurationInSeconds(0);
    setCapturedTranscript("");
    setEvaluation(null);

    await startRecording();
    startSpeechRecognition();
    setIsPlaying(true);
  };

  const handleStopPractice = () => {
    setIsPlaying(false);
    stopRecording();
    stopSpeechRecognition();

    if (startTime) {
      const dur = Math.max(1, Math.round((Date.now() - startTime) / 1000));
      setDurationInSeconds(dur);
    }
  };

  const finishSession = () => {
    onComplete();
    setStep("result");
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      handleStopPractice();
    } else {
      setIsPlaying(true);
      if (!isRecording) {
        startRecording();
        startSpeechRecognition();
        setStartTime(Date.now());
      }
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    stopRecording();
    stopSpeechRecognition();
    setAudioUrl(null);
    setCapturedTranscript("");
    setEvaluation(null);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  };

  // Submit transcript to Gemini Speech Evaluation Route
  const handleEvaluatePractice = async () => {
    if (!data || !capturedTranscript.trim()) return;
    setEvaluating(true);
    setError("");

    try {
      const res = await fetch("/api/practice/teleprompter/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalText: data.speechText,
          transcript: capturedTranscript
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to evaluate speech");

      setEvaluation(json);
      setStep("evaluation");
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  // Radial progress SVG helper
  const RadialProgress = ({ score, label, colorClass }: { score: number, label: string, colorClass: string }) => {
    const percentage = score * 10;
    const radius = 24;
    const strokeDasharray = 2 * Math.PI * radius;
    const strokeDashoffset = strokeDasharray - (percentage / 100) * strokeDasharray;

    return (
      <div className="flex flex-col items-center gap-2 bg-black/30 p-4 rounded-xl border border-white/5 w-28">
        <div className="relative w-14 h-14">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="28" cy="28" r={radius} className="stroke-white/5 fill-transparent" strokeWidth="5" />
            <circle 
              cx="28" 
              cy="28" 
              r={radius} 
              className={`fill-transparent stroke-current ${colorClass}`} 
              strokeWidth="5" 
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-xs text-white">
            {score}/10
          </div>
        </div>
        <span className="text-[10px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider text-center">{label}</span>
      </div>
    );
  };

  // Word Accuracy Diff algorithm
  const computeWordDiff = (originalText: string, transcriptText: string) => {
    const cleanOriginal = originalText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, "").toLowerCase().split(/\s+/).filter(Boolean);
    const cleanTranscript = transcriptText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, "").toLowerCase().split(/\s+/).filter(Boolean);
    
    const result: { word: string; originalWord: string; isMatched: boolean }[] = [];
    let transcriptIdx = 0;
    const originalWords = originalText.split(/\s+/).filter(Boolean);

    for (let i = 0; i < originalWords.length; i++) {
      const origWordClean = originalWords[i].replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, "").toLowerCase();
      let found = false;

      // Look ahead 4 words in transcript to match word in order
      for (let look = transcriptIdx; look < Math.min(transcriptIdx + 4, cleanTranscript.length); look++) {
        if (cleanTranscript[look] === origWordClean) {
          found = true;
          transcriptIdx = look + 1;
          break;
        }
      }

      result.push({
        word: origWordClean,
        originalWord: originalWords[i],
        isMatched: found
      });
    }

    return result;
  };

  // Pacing (WPM) grader
  const getPacingGrade = (wpm: number, category: string) => {
    let min = 110;
    let max = 140;

    if (category.includes("corporate")) { min = 130; max = 150; }
    else if (category.includes("speaking")) { min = 120; max = 145; }
    else if (category.includes("storytelling")) { min = 115; max = 135; }
    else if (category.includes("philosophical")) { min = 95; max = 115; }

    if (wpm < min) return { status: "Too Slow", color: "text-amber-400 border-amber-500/20 bg-amber-500/5", desc: `Typically target ${min}-${max} WPM.` };
    if (wpm > max) return { status: "Too Fast", color: "text-rose-400 border-rose-500/20 bg-rose-500/5", desc: `Typically target ${min}-${max} WPM.` };
    return { status: "Optimal Pacing", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5", desc: `Perfect speed for oral delivery (${min}-${max} WPM).` };
  };

  // Teleprompter breathing & stress markup rendering
  const renderPacingText = () => {
    if (!data) return null;
    const words = data.speechText.split(/\s+/).filter(Boolean);
    const stressedSet = new Set(data.stressedWords.map(w => w.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, "")));

    return (
      <div className={`text-center font-display leading-relaxed transition-all duration-300 ${fontClasses[fontSize]}`}>
        {words.map((w, idx) => {
          const cleanWord = w.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, "");
          const isStressed = stressedSet.has(cleanWord);
          
          // Check trailing punctuation for breath markers
          let breathMark = null;
          if (showPacingGuides) {
            if (/[.,;:\-_]$/.test(w)) {
              if (/[.,]$/.test(w)) {
                breathMark = <span className="text-[10px] font-mono text-orange-400/70 ml-1 select-none font-bold" title="Brief breath capture">/</span > ;
              } else {
                breathMark = <span className="text-[10px] font-mono text-orange-500 ml-1 select-none font-extrabold" title="Complete pause">//</span > ;
              }
            }
          }

          return (
            <span 
              key={idx} 
              className={`inline-block mx-1 my-1 transition-all ${
                isStressed && showPacingGuides 
                  ? "text-orange-400 font-bold border-b border-orange-500/30" 
                  : "text-gray-300"
              }`}
            >
              {w}
              {breathMark}
            </span>
          );
        })}
      </div>
    );
  };

  const fontClasses = {
    sm: "text-base md:text-lg",
    md: "text-lg md:text-xl",
    lg: "text-xl md:text-2xl",
    xl: "text-2xl md:text-3xl"
  };

  // Word diff calculations
  const originalWordCount = data ? data.speechText.split(/\s+/).filter(Boolean).length : 0;
  const pacingWpm = durationInSeconds > 0 ? Math.round(originalWordCount / (durationInSeconds / 60)) : 0;
  const accuracyMatches = (data && capturedTranscript) ? computeWordDiff(data.speechText, capturedTranscript).filter(w => w.isMatched).length : 0;
  const accuracyPercentage = originalWordCount > 0 ? Math.round((accuracyMatches / originalWordCount) * 100) : 0;

  return (
    <div className="glass-panel p-6 w-full max-w-3xl mx-auto border-orange-400 bg-white shadow-[4px_4px_0px_rgba(30,41,59,1)]">
      
      {/* HEADER SECTION */}
      <div className="flex items-center gap-3 mb-6 border-b border-[var(--panel-border)] pb-4">
        <div className="w-10 h-10 rounded-xl bg-orange-50 border-2 border-orange-500 flex items-center justify-center text-orange-500">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-slate-800">Fluency Speech Coach</h2>
          <p className="text-xs text-[var(--text-secondary)] font-medium">Train dynamic tonality, oral pacing, and breath control using real-time speech analytics</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-500 text-red-700 p-4 rounded-xl mb-6 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* STEP 1: CATEGORY SELECTION & CUSTOM TOPICS */}
      {step === "select" && (
        <div className="space-y-6 animate-fade-in text-slate-800">
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed font-medium">
            Select a speech style below or generate a custom speech based on any topic or scenario you input. Read the text aloud as it scrolls to build clear speech cadence, and receive real-time evaluations on your delivery.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => fetchSpeech(cat.id)}
                disabled={loading}
                className="text-left p-5 rounded-2xl border-2 border-slate-800 bg-[#fffdfa] hover:border-orange-500 hover:shadow-[3px_3px_0px_#f97316] transition-all text-slate-800 flex flex-col justify-between h-40 disabled:opacity-50 group hover:-translate-y-0.5"
              >
                <div>
                  <div className="font-bold text-slate-800 mb-1 group-hover:text-orange-600 transition-colors">{cat.label}</div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">{cat.desc}</p>
                </div>
                {loading && selectedCategory === cat.id ? (
                  <div className="text-xs text-orange-500 font-bold font-mono animate-pulse">Generating Speech...</div>
                ) : (
                  <div className="text-xs text-orange-600 font-bold group-hover:underline">Choose Style →</div>
                )}
              </button>
            ))}
          </div>

          {/* Bring Your Own Topic input */}
          <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-800 shadow-[2.5px_2.5px_0px_rgba(30,41,59,1)] space-y-4">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500" /> Or, practice a Custom Topic:
            </h4>
            <form onSubmit={handleCustomTopicSubmit} className="flex gap-3">
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="e.g., Toast for my best friend's wedding, or Pitching an app to investors..."
                className="flex-1 bg-white border-2 border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-slate-800 placeholder-slate-400 font-medium"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !customTopic.trim()}
                className="btn-primary bg-orange-500 hover:bg-orange-600 text-white border-2 border-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] disabled:opacity-50 flex-shrink-0 text-xs px-6 py-3 font-bold rounded-xl"
              >
                {loading ? "Generating..." : "Generate Speech"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* STEP 2: TELEPROMPTER VIEW */}
      {step === "teleprompter" && data && (
        <div className="space-y-6 animate-fade-in text-slate-800">
          {/* Metadata */}
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Oral Reading Drill</span>
              <h3 className="text-2xl font-display font-bold text-slate-800 mt-1">{data.title}</h3>
            </div>
            
            {/* Guide markers toggle */}
            <button
              onClick={() => setShowPacingGuides(!showPacingGuides)}
              className={`text-xs px-3 py-1.5 rounded-full border-2 border-slate-800 transition-all font-bold ${
                showPacingGuides 
                  ? "bg-orange-50 text-orange-700 shadow-[1.5px_1.5px_0px_rgba(30,41,59,1)]" 
                  : "bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {showPacingGuides ? "✓ Pacing Marks Active" : "Show Pacing Marks"}
            </button>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border-2 border-slate-800 text-sm shadow-[2px_2px_0px_rgba(30,41,59,1)]">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayPause}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white border-2 border-slate-900 shadow-[1.5px_1.5px_0px_rgba(30,41,59,1)] active:translate-y-0.5 active:shadow-none transition-colors ${
                  isPlaying ? "bg-orange-500 hover:bg-orange-600" : "bg-emerald-500 hover:bg-emerald-600"
                }`}
                title={isPlaying ? "Pause Scroll" : "Start Scroll"}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
              <button
                onClick={handleReset}
                className="w-10 h-10 rounded-full bg-white border-2 border-slate-800 flex items-center justify-center text-slate-600 hover:text-slate-800 hover:bg-slate-50 shadow-[1.5px_1.5px_0px_rgba(30,41,59,1)] active:translate-y-0.5 active:shadow-none transition-colors"
                title="Reset Position"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Scroll Speed Slider */}
            <div className="flex items-center gap-3 flex-1 min-w-[180px]">
              <span className="text-xs text-slate-600 font-bold whitespace-nowrap">Scroll Speed:</span>
              <input
                type="range"
                min="1"
                max="10"
                value={scrollSpeed}
                onChange={(e) => setScrollSpeed(Number(e.target.value))}
                className="flex-1 accent-orange-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer border border-slate-300"
              />
              <span className="text-xs font-bold text-orange-600 font-mono w-4">{scrollSpeed}</span>
            </div>

            {/* Font Adjuster */}
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-slate-500" />
              <div className="flex bg-white rounded-lg p-0.5 border-2 border-slate-800 shadow-[1px_1px_0px_rgba(30,41,59,1)]">
                {(["sm", "md", "lg", "xl"] as FontSize[]).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setFontSize(sz)}
                    className={`px-2.5 py-1 text-xs rounded font-bold uppercase transition-all ${
                      fontSize === sz ? "bg-orange-500 text-white" : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Microphone & Real-time Recorder Panel */}
          <div className="flex items-center justify-between p-4 rounded-xl border-2 border-dashed border-orange-500/40 bg-orange-50/50 shadow-[1px_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-3">
              <div className={`w-3.5 h-3.5 rounded-full border border-slate-800 ${isRecording ? "bg-red-500 animate-ping" : "bg-red-400"}`} />
              <div>
                <div className="text-sm font-bold text-slate-800">Speech Voice Recorder</div>
                <div className="text-xs text-[var(--text-secondary)] font-medium">Record yourself to evaluate accuracy and pace</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isRecording ? (
                <button
                  onClick={handleStartPractice}
                  className="btn-primary py-2 px-4 bg-red-500 hover:bg-red-600 text-white border-2 border-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)] flex items-center gap-1.5 text-xs font-bold"
                >
                  <Mic className="w-3.5 h-3.5" /> Start Recording & Scroll
                </button>
              ) : (
                <button
                  onClick={handleStopPractice}
                  className="btn-primary py-2 px-4 bg-white border-2 border-slate-800 text-slate-800 hover:bg-slate-50 shadow-[2px_2px_0px_rgba(30,41,59,1)] flex items-center gap-1.5 text-xs font-bold"
                >
                  <Square className="w-3.5 h-3.5 fill-current text-red-600" /> Stop
                </button>
              )}
            </div>
          </div>

          {/* Audio Visualizer Wave */}
          {isRecording && (
            <div className="animate-fade-in">
              <AudioVisualizer isRecording={isRecording} theme="orange" stream={visualizerStream} />
            </div>
          )}

          {/* Scrolling Viewport Container */}
          <div 
            ref={containerRef}
            className="h-80 overflow-y-scroll relative border-2 border-slate-800 rounded-2xl bg-white px-6 py-40 select-none scroll-smooth shadow-[inset_1px_1px_5px_rgba(0,0,0,0.06)]"
            style={{ scrollbarWidth: "none" }}
          >
            {renderPacingText()}
          </div>

          {/* Recording Playback Box */}
          {audioUrl && (
            <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-emerald-600 font-bold">
                  <Volume2 className="w-4 h-4" /> Listen to Your Recording
                </div>
                
                {/* Real-time statistics summaries */}
                <div className="text-xs text-[var(--text-secondary)] font-mono font-semibold">
                  Duration: <strong className="text-slate-800">{durationInSeconds}s</strong> | WPM: <strong className="text-slate-800">{pacingWpm}</strong>
                </div>
              </div>
              
              <audio src={audioUrl} controls className="w-full accent-orange-500" />

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleEvaluatePractice}
                  disabled={evaluating || !capturedTranscript}
                  className="btn-primary bg-orange-500 hover:bg-orange-600 text-white border-2 border-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] text-xs flex items-center gap-1.5 font-bold px-5"
                >
                  {evaluating ? "Analyzing Speech..." : "Evaluate Speech Performance"}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              {!capturedTranscript && (
                <p className="text-[10px] text-orange-600 font-bold text-right italic">
                  Ensure you read aloud into the microphone to enable accuracy matches.
                </p>
              )}
            </div>
          )}

          {/* Coach Speech Pacing Tips */}
          <div className="bg-white p-5 rounded-xl border-2 border-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)]">
            <h4 className="text-xs uppercase tracking-wider text-orange-600 font-bold mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 animate-pulse" /> Pacing & Tonality Tips
            </h4>
            <ul className="space-y-3">
              {data.tips.map((tip, idx) => (
                <li key={idx} className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed font-medium">
                  <span className="w-5 h-5 rounded-full bg-orange-55 flex items-center justify-center text-orange-600 border border-orange-500 text-xs font-bold flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation Footer */}
          <div className="pt-4 border-t border-[var(--panel-border)] flex justify-between items-center">
            <button
              onClick={() => {
                handleReset();
                setStep("select");
              }}
              className="btn-secondary text-xs text-slate-800 border-2 border-slate-800 font-semibold"
            >
              ← Choose Another Topic
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: DETAILED SPEECH EVALUATION REPORT DASHBOARD */}
      {step === "evaluation" && evaluation && data && (
        <div className="space-y-6 animate-fade-in text-slate-800">
          {/* Header Summary */}
          <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Coaching Evaluation</span>
              <h3 className="text-2xl font-display font-bold text-slate-800 mt-1">Practice Scorecard</h3>
            </div>
            <button
              onClick={() => setStep("teleprompter")}
              className="btn-secondary text-xs py-1.5 px-3 border-2 border-slate-800 text-slate-800 font-semibold"
            >
              ← Reopen Teleprompter
            </button>
          </div>

          {/* Rating score panels */}
          <div className="grid grid-cols-4 gap-4 items-center justify-center">
            <RadialProgress score={evaluation.clarityScore} label="Clarity" colorClass="text-sky-500" />
            <RadialProgress score={evaluation.rhythmScore} label="Rhythm" colorClass="text-emerald-500" />
            <RadialProgress score={evaluation.expressionScore} label="Tonality" colorClass="text-purple-500" />
            
            {/* Accuracy card */}
            <div className="flex flex-col items-center gap-2 bg-slate-50 p-4 rounded-xl border-2 border-slate-800 w-28 h-28 justify-center shadow-[2px_2px_0px_rgba(30,41,59,1)]">
              <div className="text-2xl font-bold font-mono text-emerald-600">{accuracyPercentage}%</div>
              <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider text-center">Word Match</span>
            </div>
          </div>

          {/* Pacing Analytics WPM status */}
          <div className={`p-4 rounded-xl border-2 flex items-center justify-between gap-4 shadow-[2px_2px_0px_rgba(30,41,59,1)] ${getPacingGrade(pacingWpm, selectedCategory).color.includes("bg-") ? getPacingGrade(pacingWpm, selectedCategory).color : "bg-orange-50 border-orange-500 text-orange-850"}`}>
            <div>
              <div className="text-xs uppercase tracking-wider font-bold">Pacing Speed: {pacingWpm} WPM</div>
              <p className="text-[11px] font-semibold opacity-90 mt-0.5">{getPacingGrade(pacingWpm, selectedCategory).desc}</p>
            </div>
            <div className="text-sm font-bold font-mono px-3 py-1 bg-white border-2 border-slate-800 rounded-lg whitespace-nowrap text-slate-800 shadow-[1px_1px_0px_rgba(0,0,0,1)]">
              {getPacingGrade(pacingWpm, selectedCategory).status}
            </div>
          </div>

          {/* Word-by-Word Diff highlights */}
          <div className="bg-white border-2 border-slate-800 p-5 rounded-2xl space-y-3 shadow-[3px_3px_0px_rgba(30,41,59,1)]">
            <h5 className="text-xs uppercase tracking-wider text-orange-500 font-bold flex items-center gap-1.5">
              <Volume2 className="w-4 h-4" /> Word Accuracy Diff Analysis
            </h5>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
              Below is the original speech text. Spoken words are highlighted in <span className="text-emerald-600 font-bold">green</span>. Skipped or mispronounced words are highlighted in <span className="text-rose-600 line-through">red</span>.
            </p>
            
            <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-800 text-sm md:text-base leading-relaxed text-left max-h-48 overflow-y-auto shadow-[inset_1px_1px_3px_rgba(0,0,0,0.05)]">
              {computeWordDiff(data.speechText, capturedTranscript).map((w, idx) => (
                <span 
                  key={idx} 
                  className={`inline-block mx-1 my-0.5 font-bold ${
                    w.isMatched ? "text-emerald-700 bg-emerald-100/50 px-1 rounded" : "text-rose-700 line-through bg-rose-100/50 px-1 rounded"
                  }`}
                >
                  {w.originalWord}
                </span>
              ))}
            </div>
          </div>

          {/* AI Detailed Feedback Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)] space-y-2">
              <div className="text-xs uppercase tracking-wider text-orange-500 font-bold">Coaching Feedback</div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {evaluation.feedback}
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)] space-y-2">
              <div className="text-xs uppercase tracking-wider text-purple-650 font-bold">Tonality Breakdown</div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {evaluation.tonalityAnalysis}
              </p>
            </div>
          </div>

          {/* Mispronounced Words */}
          {evaluation.mispronunciations.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-500 text-amber-800 p-4 rounded-xl text-sm space-y-2 font-medium">
              <div className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" /> Hard to Articulate Words
              </div>
              <div className="flex flex-wrap gap-2">
                {evaluation.mispronunciations.map((w, idx) => (
                  <span key={idx} className="text-xs font-mono font-bold bg-amber-100 border border-amber-300 px-2 py-1 rounded">
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Audio listen back */}
          {audioUrl && (
            <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)] space-y-2">
              <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] font-bold">
                Listen back to compare
              </div>
              <audio src={audioUrl} controls className="w-full mt-1 accent-orange-500" />
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-[var(--panel-border)] flex justify-between">
            <button
              onClick={() => {
                handleReset();
                setStep("select");
              }}
              className="btn-secondary text-slate-800 border-2 border-slate-800 font-semibold"
            >
              Practice Another Topic
            </button>
            
            <button
              onClick={finishSession}
              className="btn-primary bg-orange-500 hover:bg-orange-600 text-white border-2 border-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] px-8 font-bold"
            >
              Save Progress & Finish
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: RESULTS REPORT SCREEN */}
      {step === "result" && (
        <div className="text-center py-8 space-y-6 animate-fade-in text-slate-800">
          <div className="w-20 h-20 rounded-full bg-orange-50 border-2 border-orange-500 flex items-center justify-center text-orange-500 mx-auto animate-bounce">
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-display font-bold text-slate-800">Fluency Exercise Complete!</h3>
            <p className="text-sm text-[var(--text-secondary)] font-medium">
              Your pacing, accuracy, and rhythm drill stats have been recorded.
            </p>
          </div>

          <div className="max-w-md mx-auto bg-slate-50 border-2 border-slate-800 p-4 rounded-xl shadow-[3px_3px_0px_#1e293b] text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
            <span className="text-emerald-600 font-bold block mb-1 text-sm">Fluency Habit Unlocked! 🗣️</span>
            Excellent job practicing oral speech flow. Consistent training on scrolling texts builds high-speed word grouping and proper breathing intervals.
          </div>

          <div className="pt-6 flex justify-center gap-4">
            <button
              onClick={() => setStep("select")}
              className="btn-secondary text-slate-800 border-2 border-slate-800 font-semibold"
            >
              Choose Another Speech
            </button>
            <button
              onClick={onComplete}
              className="btn-primary bg-orange-500 hover:bg-orange-600 text-white border-2 border-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] font-bold"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
