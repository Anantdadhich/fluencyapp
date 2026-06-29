"use client";

import { useState, useEffect } from "react";
import { BookOpen, Sparkles, HelpCircle, Check, X, AlertCircle } from "lucide-react";
import { GrammarPracticeResponse, GrammarProblem } from "@/lib/types";

interface GrammarHubProps {
  onComplete: () => void;
  initialTopicId?: string | null;
}

type Step = "select" | "lesson" | "quiz" | "result";

export function GrammarHub({ onComplete, initialTopicId }: GrammarHubProps) {
  const [step, setStep] = useState<Step>("select");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<GrammarPracticeResponse | null>(null);

  const [completedTopics, setCompletedTopics] = useState<string[]>([]);

  // Load completed topics on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("completed_grammar_topics");
      if (saved) {
        try {
          setCompletedTopics(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  // Auto-launch preset topic when directed from learning path
  useEffect(() => {
    if (initialTopicId && step === "select") {
      fetchPracticeSession(initialTopicId);
    }
  }, [initialTopicId]);
  
  // Quiz states
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [textInput, setTextInput] = useState("");

  const topics = [
    { id: "tenses", label: "Verb Tenses", desc: "Perfect your timing: Present, Past, Future, and Progressive nuances." },
    { id: "articles", label: "Articles (A, An, The)", desc: "Navigate defined vs. undefined nouns and zero-article scenarios." },
    { id: "prepositions", label: "Prepositions (In, On, At)", desc: "Master spatial and temporal relations, phrasal connections, and idiomatic prepositions." },
    { id: "pronouns", label: "Pronouns & Agreement", desc: "Subject, object, relative, and possessive pronouns and gender-neutral agreements." },
    { id: "adjectives", label: "Adjectives", desc: "Sequence, modifiers, comparatives, and precise descriptors." },
    { id: "adverbs", label: "Adverbs & Modifiers", desc: "Correct placement and enhancing verbs, adjectives, or entire clauses." },
    { id: "punctuation", label: "Punctuation & Mechanics", desc: "Commas, semicolons, dash usage, parenthetical offsets, and capitalization." },
    { id: "collocations", label: "Natural Collocations", desc: "Native-like verb-noun pairings and avoiding direct translation traps." },
    { id: "sentence_flow", label: "Sentence Variety & Flow", desc: "Combining clauses, pacing syntax, and creating natural flow." }
  ];

  const fetchPracticeSession = async (topicId: string) => {
    setLoading(true);
    setError("");
    setSelectedTopic(topicId);
    
    try {
      const res = await fetch("/api/practice/grammar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topicId }),
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch practice session");
      
      setData(json);
      setStep("lesson");
    } catch (err: any) {
      const msg = err.message === "Failed to fetch"
        ? "Network connection error: Unable to connect to the server. Please make sure the server is running."
        : err.message;
      setError(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = () => {
    setCurrentIdx(0);
    setUserAnswers({});
    setSubmitted(false);
    setScore(0);
    setTextInput("");
    setStep("quiz");
  };

  const currentProblem: GrammarProblem | undefined = data?.problems[currentIdx];

  const handleAnswerSubmit = (answer: string) => {
    if (submitted) return;
    
    const cleanAnswer = answer.trim().toLowerCase();
    const cleanCorrect = currentProblem?.correctAnswer.trim().toLowerCase() || "";
    
    setUserAnswers(prev => ({ ...prev, [currentIdx]: answer }));
    setSubmitted(true);

    if (cleanAnswer === cleanCorrect) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (!data) return;
    
    if (currentIdx < data.problems.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSubmitted(false);
      setTextInput("");
    } else {
      setStep("result");
      if (selectedTopic && !completedTopics.includes(selectedTopic)) {
        const nextCompleted = [...completedTopics, selectedTopic];
        setCompletedTopics(nextCompleted);
        localStorage.setItem("completed_grammar_topics", JSON.stringify(nextCompleted));
      }
    }
  };

  return (
    <div className="glass-panel p-6 w-full max-w-3xl mx-auto border-rose-400 bg-white shadow-[4px_4px_0px_rgba(30,41,59,1)]">
      
      {/* HEADER SECTION */}
      <div className="flex items-center gap-3 mb-6 border-b border-[var(--panel-border)] pb-4">
        <div className="w-10 h-10 rounded-xl bg-rose-50 border-2 border-rose-500 flex items-center justify-center text-rose-500">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-slate-800">Basic & Intermediate Learning Hub</h2>
          <p className="text-xs text-[var(--text-secondary)] font-medium">Master the foundations of English grammar, syntax, and structures</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-500 text-red-700 p-4 rounded-xl mb-6 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* STEP 1: TOPIC SELECTION */}
      {step === "select" && (
        <div className="space-y-6">
          <p className="text-[var(--text-secondary)] text-sm font-medium">
            Select a core grammar topic to begin. The engine will synthesize a custom micro-lesson followed by an interactive check.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {topics.map((t) => (
              <button
                key={t.id}
                onClick={() => fetchPracticeSession(t.id)}
                disabled={loading}
                className="text-left p-5 rounded-2xl border-2 border-slate-800 bg-[#fffdfa] hover:border-rose-500 hover:shadow-[3px_3px_0px_#f43f5e] transition-all text-slate-800 flex flex-col justify-between h-40 disabled:opacity-50 group hover:-translate-y-0.5"
              >
                <div className="w-full">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="font-bold text-slate-800 group-hover:text-rose-600 transition-colors">{t.label}</span>
                    {completedTopics.includes(t.id) && (
                      <span className="text-[10px] text-emerald-650 font-bold px-2 py-0.5 bg-emerald-50 border border-emerald-300 rounded shadow-[1px_1px_0px_rgba(16,185,129,0.1)] flex items-center gap-1 shrink-0 animate-fade-in">
                        <Check className="w-3 h-3 text-emerald-650" /> Completed
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">{t.desc}</p>
                </div>
                {loading && selectedTopic === t.id ? (
                  <div className="text-xs text-rose-500 font-bold font-mono animate-pulse">Generating Lesson...</div>
                ) : (
                  <div className="text-xs text-rose-600 font-bold group-hover:underline">Start Practice →</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: LESSON VIEW */}
      {step === "lesson" && data && (
        <div className="space-y-6 animate-fade-in text-slate-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-500">Micro-Lesson Overview</span>
            <h3 className="text-2xl font-display font-bold text-slate-800 mt-1 mb-3">{data.lesson.title}</h3>
          </div>

          <div className="bg-rose-50/50 p-5 rounded-xl border-2 border-slate-800 shadow-[2.5px_2.5px_0px_rgba(30,41,59,1)] space-y-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-rose-600 font-bold mb-1">Definition</div>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">{data.lesson.definition}</p>
            </div>
            
            <div className="border-t border-slate-200 pt-3">
              <div className="text-xs uppercase tracking-wider text-rose-600 font-bold mb-1">Summary Overview</div>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">{data.lesson.summary}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl border-2 border-slate-800 shadow-[2.5px_2.5px_0px_rgba(30,41,59,1)]">
              <div className="text-xs uppercase tracking-wider text-amber-600 font-bold mb-2">When to Use</div>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {data.lesson.whenToUse}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border-2 border-slate-800 shadow-[2.5px_2.5px_0px_rgba(30,41,59,1)]">
              <div className="text-xs uppercase tracking-wider text-emerald-600 font-bold mb-2">Core Examples</div>
              <ul className="space-y-2">
                {data.lesson.examples.map((ex, idx) => (
                  <li key={idx} className="text-sm text-slate-700 italic leading-relaxed font-medium">
                    • "{ex}"
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border-2 border-slate-800 shadow-[2.5px_2.5px_0px_rgba(30,41,59,1)]">
            <h4 className="text-xs uppercase tracking-wider text-rose-500 font-bold mb-3">Key Pedagogical Rules</h4>
            <ul className="space-y-3">
              {data.lesson.keyRules.map((rule, idx) => (
                <li key={idx} className="flex gap-3 bg-white p-3 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed font-medium">
                  <span className="w-5 h-5 rounded-full bg-rose-50 border border-rose-500 flex items-center justify-center text-rose-500 text-xs font-bold flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t border-[var(--panel-border)] flex justify-end">
            <button
              onClick={startQuiz}
              className="btn-primary bg-rose-500 hover:bg-rose-600 border-2 border-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              Begin Diagnostic Quiz
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: QUIZ VIEW */}
      {step === "quiz" && currentProblem && data && (
        <div className="space-y-6 animate-fade-in text-slate-800">
          {/* Progress Tracker Header */}
          <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-4">
            <span className="text-xs text-[var(--text-secondary)] font-mono font-bold">
              Question {currentIdx + 1} of {data.problems.length}
            </span>
            <div className="flex gap-2">
              {data.problems.map((prob, idx) => {
                const answer = userAnswers[idx];
                const cleanAns = answer?.trim().toLowerCase();
                const cleanCorr = prob.correctAnswer.trim().toLowerCase();
                let dotClass = "progress-dot";
                
                if (idx === currentIdx) dotClass += " active";
                else if (answer !== undefined) {
                  dotClass += cleanAns === cleanCorr ? " correct" : " wrong";
                }
                
                return <div key={idx} className={dotClass} />;
              })}
            </div>
          </div>

          {/* Question Prompt */}
          <div className="space-y-2">
            <div className="text-sm text-slate-600 font-medium flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-rose-500" />
              {currentProblem.question}
            </div>
            <div className="text-xl font-display font-bold text-slate-800 bg-slate-50 p-5 rounded-2xl border-2 border-slate-800 shadow-[2.5px_2.5px_0px_rgba(30,41,59,1)] leading-relaxed">
              {currentProblem.sentence}
            </div>
          </div>

          {/* Answers Selection */}
          <div className="space-y-3">
            {currentProblem.type === "multiple-choice" ? (
              <div className="grid gap-3">
                {currentProblem.options.map((option, idx) => {
                  const isSelected = userAnswers[currentIdx] === option;
                  const isCorrectAnswer = option.trim().toLowerCase() === currentProblem.correctAnswer.trim().toLowerCase();
                  
                  let btnClass = "option-btn";
                  let icon = null;

                  if (submitted) {
                    if (isCorrectAnswer) {
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
                      onClick={() => handleAnswerSubmit(option)}
                      disabled={submitted}
                      className={`${btnClass} flex items-center justify-between border-2 font-medium`}
                    >
                      <span>{option}</span>
                      {icon}
                    </button>
                  );
                })}
              </div>
            ) : (
              // Fill in the blank
              <div className="space-y-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    disabled={submitted}
                    placeholder="Type your answer here..."
                    className="flex-1 bg-white border-2 border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-rose-500 font-medium"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && textInput.trim()) {
                        handleAnswerSubmit(textInput);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleAnswerSubmit(textInput)}
                    disabled={submitted || !textInput.trim()}
                    className="btn-primary bg-rose-500 hover:bg-rose-600 text-white border-2 border-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] disabled:opacity-50 px-6 font-bold"
                  >
                    Check
                  </button>
                </div>

                {submitted && (
                  <div className={`p-4 rounded-xl border-2 flex items-center gap-3 font-medium ${
                    textInput.trim().toLowerCase() === currentProblem.correctAnswer.trim().toLowerCase()
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                      : "bg-red-50 border-red-500 text-red-800"
                  }`}>
                    {textInput.trim().toLowerCase() === currentProblem.correctAnswer.trim().toLowerCase() ? (
                      <>
                        <Check className="w-5 h-5 flex-shrink-0" />
                        <span>Perfect! Your answer is correct.</span>
                      </>
                    ) : (
                      <>
                        <X className="w-5 h-5 flex-shrink-0" />
                        <span>Incorrect. The correct answer is: <strong>{currentProblem.correctAnswer}</strong></span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Explanation Block */}
          {submitted && (
            <div className="bg-slate-50 border-2 border-slate-800 p-4 rounded-xl space-y-2 animate-fade-in shadow-[2px_2px_0px_rgba(30,41,59,1)]">
              <h5 className="text-xs uppercase tracking-wider text-rose-500 font-bold">Grammatical Explanation</h5>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                {currentProblem.explanation}
              </p>
            </div>
          )}

          {/* Next Button */}
          {submitted && (
            <div className="flex justify-end pt-4 border-t border-[var(--panel-border)]">
              <button
                onClick={handleNext}
                className="btn-primary bg-rose-500 hover:bg-rose-600 text-white border-2 border-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] px-8 font-bold"
              >
                {currentIdx < data.problems.length - 1 ? "Next Question →" : "View Final Results"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 4: RESULT VIEW */}
      {step === "result" && data && (
        <div className="text-center py-8 space-y-6 animate-fade-in text-slate-800">
          <div className="w-20 h-20 rounded-full bg-rose-50 border-2 border-rose-500 flex items-center justify-center text-rose-500 mx-auto animate-bounce">
            <BookOpen className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-display font-bold text-slate-800">Diagnostic Complete!</h3>
            <p className="text-sm text-[var(--text-secondary)] font-medium">
              You scored <strong className="text-slate-800 text-lg font-mono font-bold">{score} / {data.problems.length}</strong> on the <strong className="font-bold">{selectedTopic.toUpperCase()}</strong> module.
            </p>
          </div>

          <div className="max-w-md mx-auto bg-slate-50 border-2 border-slate-800 p-4 rounded-xl shadow-[3px_3px_0px_#1e293b] text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
            {score === data.problems.length ? (
              <span className="text-emerald-600 font-bold block mb-1 text-sm">Perfect Score! 🎉</span>
            ) : score >= 3 ? (
              <span className="text-amber-600 font-bold block mb-1 text-sm">Good Job! 👍</span>
            ) : (
              <span className="text-rose-500 font-bold block mb-1 text-sm">Keep Practicing! 💪</span>
            )}
            Your statistics have been updated. Try another core topic to solidify your grammatical foundation.
          </div>

          <div className="pt-6 flex justify-center gap-4">
            <button
              onClick={() => setStep("select")}
              className="btn-secondary text-slate-800 border-2 border-slate-800 font-semibold"
            >
              Choose Another Topic
            </button>
            <button
              onClick={() => {
                onComplete();
                setStep("select");
              }}
              className="btn-primary bg-rose-500 hover:bg-rose-600 text-white border-2 border-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] font-bold"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
