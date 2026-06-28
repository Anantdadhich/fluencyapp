export interface Highlight {
  substring: string;
  indexStart: number;
  indexEnd: number;
  type: "collocation" | "vocabulary" | "grammar";
  correction: string;
  explanation: string;
}

export interface VocabularyUpgrade {
  originalPhrase: string;
  recommendedSynonym: string;
  targetSituation: string;
  contextualExample: string;
}

export interface NuanceScores {
  formal: number;
  casual: number;
  aggressive: number;
  poetic: number;
  stiff: number;
}

export interface Registers {
  friend: string;
  boss: string;
  academic: string;
}

export interface GrammarAnalysis {
  tense: string;
  sentenceStructure: string;
  educationalLesson: string;
}

export interface AnalysisResponse {
  analytics: {
    nuanceScores: NuanceScores;
    registers: Registers;
  };
  highlights: Highlight[];
  vocabularyUpgrades: VocabularyUpgrade[];
  grammarAnalysis: GrammarAnalysis;
}

export interface GrammarProblem {
  id: string;
  type: "multiple-choice" | "fill-in-the-blank";
  sentence: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface GrammarLesson {
  title: string;
  summary: string;
  keyRules: string[];
  definition: string;
  whenToUse: string;
  examples: string[];
}

export interface GrammarPracticeResponse {
  lesson: GrammarLesson;
  problems: GrammarProblem[];
}

export interface VocabQuizQuestion {
  scenario: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface VocabWord {
  word: string;
  partOfSpeech: string;
  meaning: string;
  environment: string;
  situationalContext: string;
  contextualExample: string;
  quizQuestion: VocabQuizQuestion;
}

export interface VocabPracticeResponse {
  themeTitle: string;
  themeDescription: string;
  words: VocabWord[];
}

export interface SentenceEvaluationResponse {
  isValid: boolean;
  score: number;
  feedback: string;
  grammarErrors: string[];
  registerAnalysis: string;
  alternativeSuggestion: string;
}

export interface SpeechEvaluationResponse {
  clarityScore: number;
  rhythmScore: number;
  expressionScore: number;
  feedback: string;
  mispronunciations: string[];
  tonalityAnalysis: string;
}

export interface RoleplayTurnEvaluation {
  score: number;
  feedback: string;
  grammarErrors: string[];
  alternativeSuggestion: string;
}

export interface RoleplayMessage {
  sender: "character" | "user";
  text: string;
  evaluation?: RoleplayTurnEvaluation;
}

export interface ConfidenceEvaluationResponse {
  overallAffirmation: string;
  flowScore: number;
  confidenceWins: string[];
  smoothTransitions: string[];
  gentleUpgrade?: {
    original: string;
    encouragingSuggestion: string;
    whyItSoundsNatural: string;
  };
}

export interface ShadowPhrase {
  id: string;
  phrase: string;
  context: string;
  tip: string;
}

