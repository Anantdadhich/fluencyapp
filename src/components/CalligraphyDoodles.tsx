"use client";

import React from "react";

export function CalligraphyDoodles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 hidden xl:block">
      {/* ================= LEFT SIDE DOODLES ================= */}

      {/* Elegant Left Calligraphy Quote Mark (Top Left) */}
      <div 
        className="absolute left-[3%] top-[80px] transition-transform duration-500 hover:scale-110"
        style={{ transform: "rotate(-10deg)" }}
      >
        <svg width="60" height="60" viewBox="0 0 60 60">
          <text x="5" y="55" fontFamily="Georgia, serif" fontSize="90" fontWeight="bold" fill="#c084fc" transform="translate(2, 2)">“</text>
          <text x="5" y="55" fontFamily="Georgia, serif" fontSize="90" fontWeight="bold" fill="#d8b4fe" stroke="#1e293b" strokeWidth="2.5">“</text>
        </svg>
      </div>

      {/* Cursive "Fluency..." Text (Below Quote) */}
      <div 
        className="absolute left-[2.5%] top-[160px] opacity-70 transition-transform duration-500 hover:-rotate-3"
        style={{ transform: "rotate(6deg)" }}
      >
        <svg width="120" height="40" viewBox="0 0 120 40">
          <text x="5" y="30" fontFamily="var(--font-display)" fontSize="28" fill="#4f46e5" fontWeight="bold">Fluency...</text>
        </svg>
      </div>

      {/* Plump Alphabet 'A' Sticker (Upper Mid Left) */}
      <div 
        className="absolute left-[2%] top-[240px] transition-transform duration-500 hover:scale-115"
        style={{ transform: "rotate(-15deg)" }}
      >
        <svg width="55" height="55" viewBox="0 0 55 55">
          <text x="5" y="47" fontFamily="var(--font-display)" fontSize="52" fontWeight="bold" fill="#0284c7" transform="translate(3, 3)">A</text>
          <text x="5" y="47" fontFamily="var(--font-display)" fontSize="52" fontWeight="bold" fill="#38bdf8" stroke="#1e293b" strokeWidth="2.5">A</text>
        </svg>
      </div>

      {/* Speech Bubble "Hi!" (Mid Left) */}
      <div 
        className="absolute left-[2.5%] top-[330px] transition-transform duration-500 hover:scale-105"
        style={{ transform: "rotate(12deg)" }}
      >
        <svg width="85" height="75" viewBox="0 0 85 75">
          {/* shadow */}
          <path d="M 10 10 L 70 10 C 75 10, 75 15, 75 15 L 75 45 C 75 50, 70 50, 70 50 L 30 50 L 15 62 L 20 50 L 10 50 C 5 50, 5 45, 5 45 L 5 15 C 5 10, 10 10, 10 10 Z" fill="#b45309" transform="translate(3, 3)"/>
          {/* front */}
          <path d="M 10 10 L 70 10 C 75 10, 75 15, 75 15 L 75 45 C 75 50, 70 50, 70 50 L 30 50 L 15 62 L 20 50 L 10 50 C 5 50, 5 45, 5 45 L 5 15 C 5 10, 10 10, 10 10 Z" fill="#fb923c" stroke="#1e293b" strokeWidth="2.5" strokeLinejoin="round"/>
          <text x="23" y="36" fontFamily="var(--font-display)" fontSize="22" fontWeight="bold" fill="#1e293b">Hi!</text>
        </svg>
      </div>

      {/* Phonetic Transcription Sticker: /ə/ (Lower Mid Left) */}
      <div 
        className="absolute left-[3%] top-[440px] opacity-65"
        style={{ transform: "rotate(-8deg)" }}
      >
        <div className="font-handwritten text-lg px-2.5 py-1 bg-white border-2 border-slate-700 rounded-lg shadow-[2px_2px_0px_rgba(30,41,59,1)] text-slate-800">
          /ə/
        </div>
      </div>

      {/* Plump Alphabet 'Z' Sticker (Lower Left) */}
      <div 
        className="absolute left-[2%] top-[520px] transition-transform duration-500 hover:scale-115"
        style={{ transform: "rotate(20deg)" }}
      >
        <svg width="55" height="55" viewBox="0 0 55 55">
          <text x="5" y="47" fontFamily="var(--font-display)" fontSize="52" fontWeight="bold" fill="#047857" transform="translate(3, 3)">Z</text>
          <text x="5" y="47" fontFamily="var(--font-display)" fontSize="52" fontWeight="bold" fill="#10b981" stroke="#1e293b" strokeWidth="2.5">Z</text>
        </svg>
      </div>

      {/* Stack of Books (Bottom Left) */}
      <div 
        className="absolute left-[2.5%] top-[610px] opacity-70 transition-transform duration-500 hover:scale-105"
        style={{ transform: "rotate(-5deg)" }}
      >
        <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
          {/* Bottom Book shadow */}
          <rect x="15" y="28" width="55" height="15" rx="2" fill="#9f1239" transform="translate(2, 2)" />
          {/* Bottom Book */}
          <rect x="15" y="28" width="55" height="15" rx="2" fill="#f43f5e" stroke="#1e293b" strokeWidth="2" />
          <rect x="15" y="32" width="50" height="4" fill="#fff" stroke="#1e293b" strokeWidth="1.5" />
          {/* Top Book */}
          <rect x="8" y="14" width="55" height="14" rx="2" fill="#fbbf24" stroke="#1e293b" strokeWidth="2" transform="rotate(-6 35 20)" />
          <rect x="8" y="18" width="50" height="4" fill="#fff" stroke="#1e293b" strokeWidth="1.5" transform="rotate(-6 35 20)" />
        </svg>
      </div>

      {/* Calligraphy underline / flourish (Bottom Left border) */}
      <div className="absolute left-[1.5%] top-[700px] opacity-50">
        <svg width="100" height="30" viewBox="0 0 100 30" fill="none">
          <path d="M5 15 C 30 25, 70 5, 95 15 M 15 20 C 45 28, 75 18, 90 20" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>


      {/* ================= RIGHT SIDE DOODLES ================= */}

      {/* Elegant Right Calligraphy Quote Mark (Top Right) */}
      <div 
        className="absolute right-[3%] top-[80px] transition-transform duration-500 hover:scale-110"
        style={{ transform: "rotate(8deg)" }}
      >
        <svg width="60" height="60" viewBox="0 0 60 60">
          <text x="5" y="55" fontFamily="Georgia, serif" fontSize="90" fontWeight="bold" fill="#c084fc" transform="translate(2, 2)">”</text>
          <text x="5" y="55" fontFamily="Georgia, serif" fontSize="90" fontWeight="bold" fill="#d8b4fe" stroke="#1e293b" strokeWidth="2.5">”</text>
        </svg>
      </div>

      {/* Literature Open Book Sticker (Below Quote) */}
      <div 
        className="absolute right-[2.5%] top-[170px] opacity-75 transition-transform duration-500 hover:scale-105"
        style={{ transform: "rotate(-10deg)" }}
      >
        <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
          {/* Book backing */}
          <path d="M 40 48 C 25 42, 12 45, 8 48 L 8 16 C 12 13, 25 10, 40 18 C 55 10, 68 13, 72 16 L 72 48 C 68 45, 55 42, 40 48 Z" fill="#b45309" transform="translate(2, 2)" />
          {/* Left page */}
          <path d="M 40 48 C 25 42, 12 45, 8 48 L 8 16 C 12 13, 25 10, 40 18 Z" fill="#ffffff" stroke="#1e293b" strokeWidth="2" />
          {/* Right page */}
          <path d="M 40 48 C 55 42, 68 45, 72 48 L 72 16 C 68 13, 55 10, 40 18 Z" fill="#ffffff" stroke="#1e293b" strokeWidth="2" />
          {/* Page text lines */}
          <path d="M 14 22 L 32 22 M 14 28 L 32 28 M 14 34 L 32 34 M 14 40 L 32 40" stroke="#cbd5e1" strokeWidth="1.5" />
          <path d="M 48 22 L 66 22 M 48 28 L 66 28 M 48 34 L 66 34 M 48 40 L 66 40" stroke="#cbd5e1" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Plump Alphabet 'B' Sticker (Upper Mid Right) */}
      <div 
        className="absolute right-[2%] top-[260px] transition-transform duration-500 hover:scale-115"
        style={{ transform: "rotate(12deg)" }}
      >
        <svg width="55" height="55" viewBox="0 0 55 55">
          <text x="5" y="47" fontFamily="var(--font-display)" fontSize="52" fontWeight="bold" fill="#db2777" transform="translate(3, 3)">B</text>
          <text x="5" y="47" fontFamily="var(--font-display)" fontSize="52" fontWeight="bold" fill="#fbcfe8" stroke="#1e293b" strokeWidth="2.5">B</text>
        </svg>
      </div>

      {/* Calligraphy word: "Speak!" (Mid Right) */}
      <div 
        className="absolute right-[2.5%] top-[340px] opacity-70 transition-transform duration-500 hover:rotate-2"
        style={{ transform: "rotate(-6deg)" }}
      >
        <svg width="110" height="40" viewBox="0 0 110 40">
          <text x="5" y="30" fontFamily="var(--font-display)" fontSize="28" fill="#10b981" fontWeight="bold">Speak!</text>
        </svg>
      </div>

      {/* Plump Alphabet 'C' Sticker (Lower Mid Right) */}
      <div 
        className="absolute right-[3%] top-[420px] transition-transform duration-500 hover:scale-115"
        style={{ transform: "rotate(-18deg)" }}
      >
        <svg width="55" height="55" viewBox="0 0 55 55">
          <text x="5" y="47" fontFamily="var(--font-display)" fontSize="52" fontWeight="bold" fill="#d97706" transform="translate(3, 3)">C</text>
          <text x="5" y="47" fontFamily="var(--font-display)" fontSize="52" fontWeight="bold" fill="#fde047" stroke="#1e293b" strokeWidth="2.5">C</text>
        </svg>
      </div>

      {/* Coffee Mug (Lower Right) */}
      <div 
        className="absolute right-[2%] top-[510px] transition-transform duration-500 hover:scale-110"
        style={{ transform: "rotate(6deg)" }}
      >
        <svg width="60" height="60" viewBox="0 0 60 60">
          {/* Handle */}
          <rect x="38" y="20" width="12" height="20" rx="6" stroke="#1e293b" strokeWidth="2.5" fill="none" />
          {/* Mug body shadow */}
          <rect x="12" y="14" width="28" height="34" rx="5" fill="#7c3aed" transform="translate(2, 2)"/>
          {/* Mug body front */}
          <rect x="12" y="14" width="28" height="34" rx="5" fill="#a78bfa" stroke="#1e293b" strokeWidth="2.5" />
          {/* Steam lines */}
          <path d="M 18 5 Q 20 9 18 11 M 26 5 Q 28 9 26 11" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Phonetic Transcription Sticker: /aɪ/ (Bottom Right) */}
      <div 
        className="absolute right-[3.5%] top-[610px] opacity-65"
        style={{ transform: "rotate(10deg)" }}
      >
        <div className="font-handwritten text-lg px-2.5 py-1 bg-white border-2 border-slate-700 rounded-lg shadow-[2px_2px_0px_rgba(30,41,59,1)] text-slate-800">
          /aɪ/
        </div>
      </div>

      {/* Calligraphy underline / flourish (Bottom Right) */}
      <div className="absolute right-[2%] top-[690px] opacity-50">
        <svg width="90" height="30" viewBox="0 0 90 30" fill="none">
          <path d="M5 10 C 25 2, 65 20, 85 10 M 15 15 C 45 7, 75 17, 80 12" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>


      {/* ================= BOTTOM CENTER DOODLES ================= */}

      {/* Cursive: "Express yourself!" (Bottom Left-Center) */}
      <div 
        className="absolute left-[20%] bottom-[30px] opacity-50 text-sm font-bold text-slate-800"
        style={{ transform: "rotate(-3deg)" }}
      >
        <span className="font-display text-base text-indigo-600">Express yourself!</span>
      </div>

      {/* Pencil Sketch (Bottom Center) */}
      <div 
        className="absolute left-[40%] bottom-[25px] opacity-45 transition-transform duration-500 hover:rotate-12"
        style={{ transform: "rotate(25deg)" }}
      >
        <svg width="60" height="30" viewBox="0 0 60 30" fill="none">
          {/* Pencil body */}
          <rect x="10" y="8" width="35" height="8" fill="#fbbf24" stroke="#1e293b" strokeWidth="1.5" />
          {/* Eraser */}
          <rect x="5" y="8" width="5" height="8" fill="#f43f5e" stroke="#1e293b" strokeWidth="1.5" />
          {/* Tip */}
          <path d="M 45 8 L 55 12 L 45 16 Z" fill="#fed7aa" stroke="#1e293b" strokeWidth="1.5" />
          <path d="M 52 11.5 L 55 12 L 52 12.5 Z" fill="#1e293b" />
        </svg>
      </div>

      {/* Phonetic: /spik/ (Bottom Right-Center) */}
      <div 
        className="absolute right-[30%] bottom-[30px] opacity-50 text-sm font-bold text-slate-800"
        style={{ transform: "rotate(4deg)" }}
      >
        <span className="font-handwritten text-base text-pink-600">/spiːk/</span>
      </div>
    </div>
  );
}
