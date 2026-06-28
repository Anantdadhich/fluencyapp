"use client";

import { useState, useEffect } from "react";
import { BookOpen, Sparkles, AlertCircle, Play, Check, X, ShieldAlert, Award, MessageSquare } from "lucide-react";
import { VocabPracticeResponse, VocabWord, SentenceEvaluationResponse } from "@/lib/types";

interface VocabClassProps {
  onComplete: () => void;
  initialThemeId?: string | null;
}

type Step = "select" | "classroom" | "quiz" | "sandbox" | "result";

export function VocabClass({ onComplete, initialThemeId }: VocabClassProps) {
  const [step, setStep] = useState<Step>("select");
  const [selectedTheme, setSelectedTheme] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<VocabPracticeResponse | null>(null);

  // Auto-launch preset theme when directed from learning path
  useEffect(() => {
    if (initialThemeId && step === "select") {
      fetchVocabClass(initialThemeId);
    }
  }, [initialThemeId]);

  // Classroom index tracker
  const [wordIdx, setWordIdx] = useState(0);

  // Quiz states
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isQuizCorrect, setIsQuizCorrect] = useState(false);

  // Sandbox states
  const [sandboxText, setSandboxText] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<SentenceEvaluationResponse | null>(null);

  const themes = [
    { id: "executive", label: "Executive Communication", desc: "Corporate briefings, management meetings, and boardrooms." },
    { id: "networking", label: "General Networking", desc: "Coffee chats, business social dinners, and career fairs." },
    { id: "negotiation", label: "Negotiation & Debate", desc: "Conflict resolution, wage talks, and strategic compromise." },
    { id: "academic", label: "Academic Writing & Reports", desc: "Formal presentation of research, essays, and analysis." }
  ];

  const fetchVocabClass = async (themeId: string) => {
    setLoading(true);
    setError("");
    setSelectedTheme(themeId);

    try {
      const res = await fetch("/api/practice/vocab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: themeId }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch vocabulary class");

      setData(json);
      setWordIdx(0);
      setStep("classroom");
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const playSpeech = (phrase: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel(); // stop previous
      const utterance = new SpeechSynthesisUtterance(phrase);
      
      // Get all available voices
      const voices = window.speechSynthesis.getVoices();
      
      // Filter for premium/natural sounding US/English voices if available
      const bestVoice = voices.find(v => {
        const name = v.name.toLowerCase();
        const lang = v.lang.toLowerCase();
        return lang.includes("en") && (
          name.includes("natural") || 
          name.includes("google") || 
          name.includes("samantha") || 
          name.includes("microsoft") || 
          name.includes("premium")
        );
      }) || voices.find(v => v.lang.toLowerCase().startsWith("en")) || voices[0];
      
      if (bestVoice) {
        utterance.voice = bestVoice;
      }
      
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const activeWord: VocabWord | undefined = data?.words[wordIdx];

  const handleQuizSubmit = (optIndex: number) => {
    if (quizSubmitted || !activeWord) return;
    setSelectedOption(optIndex);
    setQuizSubmitted(true);
    
    const correct = optIndex === activeWord.quizQuestion.correctIndex;
    setIsQuizCorrect(correct);
  };

  const handleSandboxSubmit = async () => {
    if (!activeWord || !sandboxText.trim()) return;
    setEvaluating(true);
    setError("");
    setEvalResult(null);

    try {
      const res = await fetch("/api/practice/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: activeWord.word,
          sentence: sandboxText,
          environment: activeWord.environment
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to evaluate sentence");

      setEvalResult(json);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleNextWord = () => {
    if (!data) return;
    
    setSelectedOption(null);
    setQuizSubmitted(false);
    setIsQuizCorrect(false);
    setSandboxText("");
    setEvalResult(null);

    if (wordIdx < data.words.length - 1) {
      setWordIdx(prev => prev + 1);
      setStep("classroom");
    } else {
      setStep("result");
    }
  };

  return (
    <div className="glass-panel p-6 w-full max-w-3xl mx-auto border-sky-400 bg-white shadow-[4px_4px_0px_rgba(30,41,59,1)]">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between mb-6 border-b border-[var(--panel-border)] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border-2 border-sky-500 flex items-center justify-center text-sky-500">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-slate-800">Advanced Vocabulary Classroom</h2>
            <p className="text-xs text-[var(--text-secondary)] font-medium">Master situational communication contextually</p>
          </div>
        </div>

        {step === "classroom" && data && (
          <span className="text-xs font-mono text-sky-600 bg-sky-50 px-3 py-1 rounded-full border-2 border-slate-800 font-bold">
            Word {wordIdx + 1} of {data.words.length}
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-500 text-red-700 p-4 rounded-xl mb-6 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* STEP 1: SELECT THEME */}
      {step === "select" && (
        <div className="space-y-6">
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed font-medium">
            Select a communication environment. The engine will customize 3 high-impact words or idioms, mapping out exactly who, when, and how you should speak them.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => fetchVocabClass(t.id)}
                disabled={loading}
                className="text-left p-5 rounded-2xl border-2 border-slate-800 bg-[#fffdfa] hover:border-sky-500 hover:shadow-[3px_3px_0px_#0ea5e9] transition-all text-slate-800 flex flex-col justify-between h-40 disabled:opacity-50 group hover:-translate-y-0.5"
              >
                <div>
                  <div className="font-bold text-slate-800 mb-1 group-hover:text-sky-600 transition-colors">{t.label}</div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">{t.desc}</p>
                </div>
                {loading && selectedTheme === t.id ? (
                  <div className="text-xs text-sky-500 font-bold font-mono animate-pulse">Prepping Class...</div>
                ) : (
                  <div className="text-xs text-sky-600 font-bold group-hover:underline">Start Class →</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: CLASSROOM LEARNING CARD */}
      {step === "classroom" && activeWord && (
        <div className="space-y-6 animate-fade-in text-slate-800">
          {/* Word Header Card */}
          <div className="bg-sky-50/50 border-2 border-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute right-4 top-4">
              <span className="text-xs bg-sky-100 text-sky-800 font-bold font-mono px-3 py-1 rounded-full border-2 border-slate-800 shadow-[1.5px_1.5px_0px_#1e293b]">
                {activeWord.partOfSpeech}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <h3 className="text-3xl font-display font-bold text-slate-800">{activeWord.word}</h3>
              <button
                onClick={() => playSpeech(activeWord.word)}
                className="w-8 h-8 rounded-full bg-white border-2 border-slate-800 flex items-center justify-center text-slate-600 hover:text-slate-800 hover:bg-slate-50 shadow-[1.5px_1.5px_0px_rgba(30,41,59,1)] active:translate-y-0.5 active:shadow-[0px_0px_0px]"
                title="Listen Pronunciation"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
            
            <p className="text-slate-600 text-sm mt-3 font-semibold italic">
              Meaning: {activeWord.meaning}
            </p>
          </div>

          {/* Environmental Suitability */}
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border-2 border-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)]">
                <div className="text-xs uppercase tracking-wider text-sky-600 font-bold mb-1">Target Environment</div>
                <div className="text-sm font-bold text-slate-800">{activeWord.environment}</div>
              </div>
              <div className="bg-white p-4 rounded-xl border-2 border-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)]">
                <div className="text-xs uppercase tracking-wider text-indigo-600 font-bold mb-1">Vibe & Register</div>
                <div className="text-sm font-bold text-slate-800">Advanced Phrasing</div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)] space-y-2">
              <div className="text-xs uppercase tracking-wider text-orange-600 font-bold">Situational Etiquette (Coach Rules)</div>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {activeWord.situationalContext}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)] space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider text-emerald-600 font-bold">Contextual Example Sentence</div>
                <button
                  onClick={() => playSpeech(activeWord.contextualExample)}
                  className="text-xs text-emerald-600 hover:underline flex items-center gap-1 font-bold"
                >
                  <Play className="w-3 h-3 fill-current" /> Listen Example
                </button>
              </div>
              <p className="text-sm text-slate-700 italic leading-relaxed font-medium">
                "{activeWord.contextualExample}"
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-[var(--panel-border)] flex justify-end">
            <button
              onClick={() => setStep("quiz")}
              className="btn-primary bg-sky-500 hover:bg-sky-600 border-2 border-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] flex items-center gap-2"
            >
              Take Situational Quiz <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: SITUATION QUIZ VIEW */}
      {step === "quiz" && activeWord && (
        <div className="space-y-6 animate-fade-in text-slate-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-500">Situation Simulator</span>
            <h4 className="text-lg text-slate-800 font-medium mt-1 leading-relaxed bg-slate-50 p-5 rounded-2xl border-2 border-slate-800 shadow-[3px_3px_0px_#1e293b]">
              {activeWord.quizQuestion.scenario}
            </h4>
          </div>

          <div className="space-y-3">
            {activeWord.quizQuestion.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === activeWord.quizQuestion.correctIndex;
              let btnClass = "option-btn";
              let icon = null;

              if (quizSubmitted) {
                if (isCorrect) {
                  btnClass += " correct";
                  icon = <Check className="w-4 h-4 text-emerald-600" />;
                } else if (isSelected) {
                  btnClass += " wrong";
                  icon = <X className="w-4 h-4 text-rose-600" />;
                } else {
                  btnClass += " opacity-50";
                }
              } else if (isSelected) {
                btnClass += " selected";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleQuizSubmit(idx)}
                  disabled={quizSubmitted}
                  className={`${btnClass} flex items-center justify-between border-2 font-medium`}
                >
                  <span>{option}</span>
                  {icon}
                </button>
              );
            })}
          </div>

          {quizSubmitted && (
            <div className="bg-slate-50 border-2 border-slate-800 p-4 rounded-xl space-y-2 animate-fade-in shadow-[2px_2px_0px_rgba(30,41,59,1)]">
              <h5 className="text-xs uppercase tracking-wider text-sky-500 font-bold">Coach Feedback</h5>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                {activeWord.quizQuestion.explanation}
              </p>
            </div>
          )}

          {quizSubmitted && (
            <div className="pt-4 border-t border-[var(--panel-border)] flex justify-end">
              <button
                onClick={() => setStep("sandbox")}
                className="btn-primary bg-sky-500 hover:bg-sky-600 border-2 border-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] flex items-center gap-2"
              >
                Go to AI Sandbox <Sparkles className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 4: AI SANDBOX EVALUATOR VIEW */}
      {step === "sandbox" && activeWord && (
        <div className="space-y-6 animate-fade-in text-slate-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-500">AI Sentence Evaluator</span>
            <h4 className="text-lg text-slate-800 font-bold mt-1">
              Apply what you've learned! Write a sentence using <span className="text-sky-600">"{activeWord.word}"</span>.
            </h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
              The coach will grade syntax correctness and score suitability for: <strong>{activeWord.environment}</strong>.
            </p>
          </div>

          <div className="space-y-4">
            <textarea
              value={sandboxText}
              onChange={(e) => setSandboxText(e.target.value)}
              disabled={evaluating}
              placeholder={`Write your sentence here incorporating "${activeWord.word}"...`}
              className="sandbox-textarea"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && sandboxText.trim() && !evaluating) {
                  e.preventDefault();
                  handleSandboxSubmit();
                }
              }}
            />

            <div className="flex justify-end">
              <button
                onClick={handleSandboxSubmit}
                disabled={evaluating || !sandboxText.trim()}
                className="btn-primary bg-sky-500 hover:bg-sky-600 border-2 border-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] disabled:opacity-50 font-bold"
              >
                {evaluating ? "Evaluating Sentence..." : "Analyze Sentence"}
              </button>
            </div>
          </div>

          {/* Sandbox Evaluation Results */}
          {evalResult && (
            <div className="space-y-4 border-t border-[var(--panel-border)] pt-4 animate-fade-in">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border-2 border-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)]">
                  <div className="text-xs uppercase tracking-wider text-sky-600 font-bold mb-1">Environment Suitability</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold font-mono text-slate-800">{evalResult.score}/10</span>
                    <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-300">
                      <div 
                        className="h-full bg-sky-500 transition-all duration-500" 
                        style={{ width: `${evalResult.score * 10}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border-2 border-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)]">
                  <div className="text-xs uppercase tracking-wider text-emerald-600 font-bold mb-1">Correctness Status</div>
                  <div className="flex items-center gap-2">
                    {evalResult.isValid ? (
                      <span className="text-emerald-600 text-sm font-bold flex items-center gap-1">
                        <Check className="w-5 h-5" /> Grammatically Correct
                      </span>
                    ) : (
                      <span className="text-rose-600 text-sm font-bold flex items-center gap-1">
                        <ShieldAlert className="w-5 h-5" /> Corrections Recommended
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {evalResult.grammarErrors.length > 0 && (
                <div className="bg-red-50 border-2 border-red-400 text-red-800 p-4 rounded-xl text-sm space-y-1 font-medium">
                  <div className="font-bold flex items-center gap-2 mb-1">
                    <ShieldAlert className="w-4 h-4 text-red-600" /> Detected Structural Issues:
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    {evalResult.grammarErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-800 shadow-[2px_2px_0px_rgba(30,41,59,1)] space-y-1 text-sm">
                <div className="text-xs uppercase tracking-wider text-indigo-600 font-bold">Coach Feedback</div>
                <p className="text-slate-700 font-medium">{evalResult.feedback}</p>
                <div className="text-xs text-sky-600 font-mono mt-2 italic font-semibold">
                  Register analysis: {evalResult.registerAnalysis}
                </div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-xl border-2 border-emerald-500 text-sm">
                <div className="text-xs uppercase tracking-wider text-emerald-700 font-bold flex items-center gap-1 mb-1">
                  <MessageSquare className="w-3.5 h-3.5" /> Polished Native Recommendation
                </div>
                <p className="text-emerald-900 italic font-bold">"{evalResult.alternativeSuggestion}"</p>
              </div>

              <div className="flex justify-end pt-4 border-t border-[var(--panel-border)]">
                <button
                  onClick={handleNextWord}
                  className="btn-primary bg-sky-500 hover:bg-sky-600 border-2 border-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] px-8 font-bold"
                >
                  {wordIdx < (data?.words?.length || 0) - 1 ? "Next Word Card" : "Finish Class"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 5: RESULTS SCREEN */}
      {step === "result" && data && (
        <div className="text-center py-8 space-y-6 animate-fade-in text-slate-800">
          <div className="w-20 h-20 rounded-full bg-sky-50 border-2 border-sky-500 flex items-center justify-center text-sky-500 mx-auto animate-bounce">
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-display font-bold text-slate-800">Class Completed!</h3>
            <p className="text-sm text-[var(--text-secondary)] font-medium">
              You've mastered the <strong>{selectedTheme.toUpperCase()}</strong> vocabulary module.
            </p>
          </div>

          <div className="max-w-md mx-auto bg-slate-50 border-2 border-slate-800 p-4 rounded-xl shadow-[3px_3px_0px_#1e293b] text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
            <span className="text-emerald-600 font-bold block mb-1 text-sm">Advanced Vocab Unlocked! 🚀</span>
            You learned {data.words.length} key communication terms, analyzed native situations, and verified your syntax suitability in real-time.
          </div>

          <div className="pt-6 flex justify-center gap-4">
            <button
              onClick={() => setStep("select")}
              className="btn-secondary text-slate-800 border-2 border-slate-800 font-semibold"
            >
              Choose Another Class
            </button>
            <button
              onClick={() => {
                onComplete();
                setStep("select");
              }}
              className="btn-primary bg-sky-500 hover:bg-sky-600 border-2 border-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] font-bold"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
