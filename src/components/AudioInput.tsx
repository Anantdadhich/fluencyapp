"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { AudioVisualizer } from "./AudioVisualizer";

interface AudioInputProps {
  onTranscript: (text: string) => void;
  onAudioBlob: (blob: Blob) => void;
  isProcessing: boolean;
}

export function AudioInput({ onTranscript, onAudioBlob, isProcessing }: AudioInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [engine, setEngine] = useState<"webkit" | "mediaRecorder" | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [visualizerStream, setVisualizerStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
        setEngine("webkit");
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            onTranscript(finalTranscript);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          stopRecording();
        };
        
        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      } else {
        setEngine("mediaRecorder");
      }
    }

    return () => {
      if (visualizerStream) {
        visualizerStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onTranscript]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setVisualizerStream(stream);

      if (engine === "webkit") {
        recognitionRef.current?.start();
        setIsRecording(true);
      } else if (engine === "mediaRecorder") {
        mediaRecorderRef.current = new MediaRecorder(stream);
        chunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          onAudioBlob(blob);
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
      }
    } catch (err) {
      console.error("Microphone access denied or error:", err);
    }
  };

  const stopRecording = () => {
    if (engine === "webkit") {
      recognitionRef.current?.stop();
    } else if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    
    if (visualizerStream) {
      visualizerStream.getTracks().forEach(track => track.stop());
      setVisualizerStream(null);
    }
    setIsRecording(false);
  };

  return (
    <div className="w-full">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`
          w-full py-4 rounded-xl flex items-center justify-center gap-3 text-lg font-bold transition-all border-2 border-slate-800 relative overflow-hidden
          ${
            isRecording 
              ? "bg-red-50 text-slate-850 shadow-[2px_2px_0px_rgba(30,41,59,1)]" 
              : "bg-white text-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] hover:-translate-y-[1px] hover:shadow-[4.5px_4.5px_0px_rgba(30,41,59,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_rgba(30,41,59,1)]"
          }
        `}
      >
        {isRecording && (
          <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
            <AudioVisualizer 
              isRecording={isRecording} 
              theme="rose" 
              stream={visualizerStream} 
              className="w-full h-full"
            />
          </div>
        )}

        <span className="relative z-10 flex items-center justify-center gap-3 w-full">
          {isProcessing ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin text-slate-800" />
              Processing Audio...
            </>
          ) : isRecording ? (
            <>
              <Square className="w-5 h-5 fill-red-600 text-red-650 animate-pulse" />
              Listening... Tap to Stop
            </>
          ) : (
            <>
              <Mic className="w-6 h-6 text-slate-800" />
              Tap to Speak
            </>
          )}
        </span>
      </button>
    </div>
  );
}
