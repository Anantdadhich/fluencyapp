"use client";

import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  isRecording: boolean;
  theme: "rose" | "sky" | "orange" | "violet" | "pink";
  stream?: MediaStream | null;
  className?: string;
}

export function AudioVisualizer({ isRecording, theme, stream, className }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Theme configuration mappings
  const themeColors = {
    rose: {
      primary: "#f43f5e",
      secondary: "#fda4af",
      accent: "#e11d48",
      barCount: 24,
    },
    sky: {
      primary: "#0ea5e9",
      secondary: "#7dd3fc",
      accent: "#0284c7",
      barCount: 24,
    },
    orange: {
      primary: "#f97316",
      secondary: "#fdba74",
      accent: "#ea580c",
      barCount: 24,
    },
    violet: {
      primary: "#8b5cf6",
      secondary: "#c4b5fd",
      accent: "#7c3aed",
      barCount: 24,
    },
    pink: {
      primary: "#ec4899",
      secondary: "#fbcfe8",
      accent: "#db2777",
      barCount: 24,
    },
  };

  const colors = themeColors[theme];

  // Set up or tear down Web Audio API Analyser
  useEffect(() => {
    if (!isRecording) {
      cleanupAudio();
      return;
    }

    if (stream) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64; // Small fft for quick visualizer bars
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;
        dataArrayRef.current = dataArray;
        sourceRef.current = source;
      } catch (err) {
        console.warn("Failed to initialize Web Audio Analyser, falling back to simulated wave:", err);
        cleanupAudio();
      }
    }

    return () => {
      cleanupAudio();
    };
  }, [isRecording, stream]);

  const cleanupAudio = () => {
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    dataArrayRef.current = null;
  };

  // Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let phase = 0;

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);

      const width = canvas.width;
      const height = canvas.height;

      // Clear with soft transparency to create motion trail blur
      ctx.fillStyle = "rgba(255, 253, 250, 0.15)";
      ctx.fillRect(0, 0, width, height);

      // Grid background line representing ruled paper
      ctx.strokeStyle = "rgba(30, 41, 59, 0.04)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      if (!isRecording) {
        // Inactive flat baseline
        ctx.strokeStyle = "rgba(30, 41, 59, 0.15)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        return;
      }

      // Check if we have active Web Audio Analyser data
      let voiceVolume = 0;
      let freqData: number[] = [];

      if (analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
        const sum = dataArrayRef.current.reduce((a, b) => a + b, 0);
        voiceVolume = sum / dataArrayRef.current.length / 255; // 0 to 1 scale

        // Populate freqData for bouncing bar graphs
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          freqData.push(dataArrayRef.current[i] / 255);
        }
      } else {
        // Fallback simulation: simulate voice modulation using complex sine cycles
        voiceVolume = 0.2 + 0.3 * Math.sin(phase * 0.05) * Math.cos(phase * 0.08 + 1);
        if (voiceVolume < 0.1) voiceVolume = 0.1; // minimum voice animation bump

        // Generate simulated frequency peaks
        for (let i = 0; i < colors.barCount; i++) {
          const mult = Math.sin(phase * 0.1 + i * 0.3) * Math.cos(phase * 0.05 - i * 0.1);
          freqData.push(Math.abs(mult) * voiceVolume);
        }
      }

      phase += 1;

      // 1. Draw smooth multi-layered Assistant Voice Wave
      const waveCount = 3;
      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        ctx.lineWidth = w === 0 ? 3.5 : 1.5;

        // Fade layers
        ctx.strokeStyle = w === 0
          ? colors.primary
          : w === 1
            ? `${colors.secondary}bb`
            : `${colors.accent}66`;

        const ampFactor = 25 * voiceVolume * (1 - w * 0.25);
        const freqFactor = 0.015 + w * 0.005;

        for (let x = 0; x < width; x++) {
          // Sine curve offset from center axis
          const y = height / 2 + Math.sin(x * freqFactor + phase * 0.12 + w * Math.PI / 3) * ampFactor;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // 2. Draw Bouncing Neobrutalist Frequency Columns
      const spacing = 4;
      const totalSpacing = spacing * (colors.barCount - 1);
      const remainingWidth = width - 40; // 20px padding left and right
      const barWidth = Math.max(2, (remainingWidth - totalSpacing) / colors.barCount);
      const startX = (width - (colors.barCount * barWidth + totalSpacing)) / 2;

      for (let i = 0; i < colors.barCount; i++) {
        const value = freqData[i % freqData.length] || 0.1;
        const rawBarHeight = Math.max(3, value * (height - 20));

        // Draw centered bar
        const x = startX + i * (barWidth + spacing);
        const y = (height - rawBarHeight) / 2;

        ctx.fillStyle = colors.secondary;
        ctx.strokeStyle = "rgba(30, 41, 59, 1)";
        ctx.lineWidth = 1.5;

        // Custom rounded or flat rectangles with shadows
        ctx.beginPath();
        if (typeof (ctx as any).roundRect === "function") {
          (ctx as any).roundRect(x, y, barWidth, rawBarHeight, 2);
        } else {
          ctx.rect(x, y, barWidth, rawBarHeight);
        }
        ctx.fill();
        ctx.stroke();
      }
    };

    // Responsive Canvas Resizing
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Start drawing loops
    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording, colors, theme]);

  return (
    <div className={className || "w-full h-16 border-2 border-slate-800 rounded-xl bg-[#fffdfa] relative overflow-hidden shadow-[inset_1px_1px_4px_rgba(0,0,0,0.05),2px_2px_0px_rgba(30,41,59,1)]"}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ imageRendering: "auto" }}
      />
    </div>
  );
}
