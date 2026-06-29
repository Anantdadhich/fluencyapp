"use client";

import { useState } from "react";
import { KeyRound, ArrowRight, Loader2 } from "lucide-react";

interface OnboardingGateProps {
  onSuccess: () => void;
}

export function OnboardingGate({ onSuccess }: OnboardingGateProps) {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });

      if (!res.ok) {
        throw new Error("Failed to save API key");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--bg-color)]">
      <div className="glass-panel p-8 max-w-md w-full animate-fade-in relative overflow-hidden">
        {/* Decorative banner */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]" />
        
        <div className="text-center mb-8">
          <div className="mx-auto bg-slate-100 border-2 border-slate-800 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <KeyRound className="w-8 h-8 text-[var(--accent-primary)]" />
          </div>
          <h1 className="text-3xl font-display mb-2 text-[var(--text-primary)]">Connect FluentScribe</h1>
          <p className="text-[var(--text-secondary)]">
            Enter your Gemini API key to activate your FluentScribe calligraphy speech workspace. 
            Your key is stored securely in your private session cookies.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full focus:ring-2 focus:ring-[var(--accent-primary)]"
              disabled={loading}
              autoComplete="off"
              required
            />
          </div>
          
          {error && (
            <div className="text-red-400 text-sm text-center bg-red-400/10 py-2 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !apiKey}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Activate Engine <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
