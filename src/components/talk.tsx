"use client";

import React, { useEffect, useRef, useState } from "react";
import { Socket, io } from "socket.io-client";
import {
  Loader, Video, VideoOff, Mic, MicOff, PhoneOff,
  MessageSquare, Send, X, Terminal, Globe, Code2, Play
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AudioVisualizer } from "./AudioVisualizer";

const getSocketUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:3000";
};

const configuration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

interface ChatMessage {
  message: string;
  senderName: string;
  timestamp: string;
  isOwn: boolean;
}

interface DevTalkProps {
  onComplete: () => void;
}

export function Talk({ onComplete }: DevTalkProps) {
  const [joined, setJoined] = useState(false);
  const [name, setName] = useState("");

  // Audio/Video Tracks
  const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  // Lobby/Connection State
  const [lobby, setLobby] = useState(true);
  const [connectionState, setConnectionState] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [localVideoEnabled, setLocalVideoEnabled] = useState(true);
  const [localAudioEnabled, setLocalAudioEnabled] = useState(true);

  // Chat States
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  // WebRTC Refs
  const socketRef = useRef<Socket | null>(null);
  const roomIdRef = useRef<string>("");
  const sendingPC = useRef<RTCPeerConnection | null>(null);
  const receivingPC = useRef<RTCPeerConnection | null>(null);
  const senderCandidates = useRef<RTCIceCandidate[]>([]);
  const receiverCandidates = useRef<RTCIceCandidate[]>([]);

  const remoteStreamRef = useRef<MediaStream>(new MediaStream());
  const localStreamRef = useRef<MediaStream>(new MediaStream());

  const localPreviewRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Request Camera/Mic access on lobby mount
  const getCameraStream = async () => {
    try {
      const stream = await window.navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];

      setLocalAudioTrack(audioTrack);
      setLocalVideoTrack(videoTrack);

      if (localPreviewRef.current) {
        localPreviewRef.current.srcObject = new MediaStream([videoTrack]);
        localPreviewRef.current.play().catch(() => { });
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setCameraOn(false);
    }
  };

  useEffect(() => {
    if (!joined) {
      getCameraStream();
    }
    return () => {
      // Cleanup tracks on unmount
      if (localAudioTrack) localAudioTrack.stop();
      if (localVideoTrack) localVideoTrack.stop();
    };
  }, [joined]);

  // Bind local preview stream to the active call screen video element
  useEffect(() => {
    if (localVideoRef.current && localVideoTrack) {
      const stream = new MediaStream([localVideoTrack]);
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.play().catch(e => console.error("Local video error:", e));
    }
  }, [localVideoTrack, lobby]);

  // Sync local tracks
  useEffect(() => {
    const localStream = localStreamRef.current;
    if (localVideoTrack) {
      localStream.getVideoTracks().forEach(track => localStream.removeTrack(track));
      localStream.addTrack(localVideoTrack);
    }
    if (localAudioTrack) {
      localStream.getAudioTracks().forEach(track => localStream.removeTrack(track));
      localStream.addTrack(localAudioTrack);
    }
  }, [localVideoTrack, localAudioTrack]);

  // Initialize Socket connection once user joins matching pool
  const handleJoin = () => {
    if (!name.trim()) return;
    setJoined(true);

    const socketUrl = getSocketUrl();
    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to signaling server:", socket.id);
    });

    socket.on("send-answer", async ({ roomId }) => {
      roomIdRef.current = roomId;
      try {
        setLobby(false);
        const pc = new RTCPeerConnection(configuration);

        pc.oniceconnectionstatechange = () => {
          if (pc.iceConnectionState === "connected") setConnectionState("connected");
          else if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") setConnectionState("disconnected");
        };

        localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));

        pc.ontrack = (event) => {
          const remoteStream = remoteStreamRef.current;
          remoteStream.addTrack(event.track);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(() => { });
          }
        };

        pc.onicecandidate = ({ candidate }) => {
          if (candidate) socket.emit("add-ice-candidate", { candidate, type: "receiver", roomId });
        };

        receivingPC.current = pc;
      } catch (error) {
        console.error(error);
      }
    });

    socket.on("send-offer", async ({ roomId }) => {
      roomIdRef.current = roomId;
      try {
        setLobby(false);
        const pc = new RTCPeerConnection(configuration);
        sendingPC.current = pc;

        pc.oniceconnectionstatechange = () => {
          if (pc.iceConnectionState === "connected") setConnectionState("connected");
          else if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") setConnectionState("disconnected");
        };

        localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));

        pc.ontrack = (event) => {
          const remoteStream = remoteStreamRef.current;
          remoteStream.addTrack(event.track);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(() => { });
          }
        };

        pc.onicecandidate = ({ candidate }) => {
          if (candidate) socket.emit("add-ice-candidate", { candidate, type: "sender", roomId });
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", { sdp: offer, roomId });
      } catch (error) {
        console.error(error);
      }
    });

    socket.on("offer", async ({ roomId, sdp }) => {
      try {
        const pc = receivingPC.current;
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        while (receiverCandidates.current.length > 0) {
          const candidate = receiverCandidates.current.shift();
          if (candidate) await pc.addIceCandidate(candidate);
        }
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { sdp: answer, roomId });
      } catch (error) {
        console.error(error);
      }
    });

    socket.on("answer", async ({ sdp }) => {
      try {
        if (sendingPC.current) {
          await sendingPC.current.setRemoteDescription(new RTCSessionDescription(sdp));
          while (senderCandidates.current.length > 0) {
            const candidate = senderCandidates.current.shift();
            if (candidate) await sendingPC.current.addIceCandidate(candidate);
          }
        }
      } catch (error) {
        console.error(error);
      }
    });

    socket.on("add-ice-candidate", async ({ candidate, type }) => {
      try {
        const pc = type === "sender" ? receivingPC.current : sendingPC.current;
        if (pc && pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          if (type === "sender") {
            receiverCandidates.current.push(new RTCIceCandidate(candidate));
          } else {
            senderCandidates.current.push(new RTCIceCandidate(candidate));
          }
        }
      } catch (error) {
        console.error(error);
      }
    });

    socket.on("chat-message", ({ message, senderName, timestamp }) => {
      setMessages((prev) => [...prev, { message, senderName, timestamp, isOwn: false }]);
      setUnreadCount((prev) => prev + 1);
    });

    socket.on("lobby", () => {
      setLobby(true);
      setConnectionState("connecting");
    });
  };

  // Scroll chat feed
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleVideo = () => {
    if (localVideoTrack) {
      localVideoTrack.enabled = !localVideoTrack.enabled;
      setLocalVideoEnabled(localVideoTrack.enabled);
    }
  };

  const toggleAudio = () => {
    if (localAudioTrack) {
      localAudioTrack.enabled = !localAudioTrack.enabled;
      setLocalAudioEnabled(localAudioTrack.enabled);
    }
  };

  const sendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = messageInput.trim();
    if (!trimmed || !socketRef.current || !roomIdRef.current) return;

    const newMessage: ChatMessage = {
      message: trimmed,
      senderName: name,
      timestamp: new Date().toISOString(),
      isOwn: true,
    };

    setMessages((prev) => [...prev, newMessage]);
    socketRef.current.emit("chat-message", {
      roomId: roomIdRef.current,
      message: trimmed,
      senderName: name
    });
    setMessageInput("");
  };

  const endCall = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    // Cleanup tracks
    if (localAudioTrack) localAudioTrack.stop();
    if (localVideoTrack) localVideoTrack.stop();
    setJoined(false);
    setLobby(true);
    setMessages([]);
    onComplete();
  };

  return (
    <div className="glass-panel p-8 w-full max-w-6xl mx-auto border-orange-500/10 shadow-[0_0_30px_rgba(249,115,22,0.02)] min-h-[600px] flex flex-col justify-between">

      {/* 1. LOBBY / PRE-JOIN INTERFACE */}
      {!joined ? (
        <div className="space-y-6 animate-fade-in text-slate-800 flex-1 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Globe className="w-6 h-6 text-orange-500 animate-spin" /> Fluency Match Portal
            </h2>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              Join the live English learners matching pool. Converse in real-time with speaking peers around the globe to improve your active listening, speaking pace, and register suitability.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 items-center flex-1 my-4">
            {/* Local Preview Cam */}
            <div className="relative aspect-video bg-slate-900 rounded-2xl border-3 border-slate-800 shadow-[3px_3px_0px_#1e293b] overflow-hidden">
              <video
                ref={localPreviewRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
              {!cameraOn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 text-slate-400 font-medium">
                  <VideoOff className="w-8 h-8 mb-2" />
                  <span className="text-sm">Camera / Mic Access Needed</span>
                </div>
              )}
            </div>

            {/* Form */}
            <div className="space-y-4 font-medium">
              <div className="bg-slate-50 border-2 border-slate-800 p-4 rounded-2xl shadow-[3px_3px_0px_#1e293b] space-y-2">
                <label className="text-sm font-bold text-slate-700 block">Enter Display Name:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Intermediate / Advanced Learner"
                  className="w-full bg-white border-2 border-slate-800 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-violet-500 text-slate-800 font-bold placeholder-slate-400"
                />
              </div>

              <button
                onClick={handleJoin}
                disabled={!name.trim()}
                className="w-full btn-primary bg-orange-500 hover:bg-orange-600 text-white border-2 border-slate-800 shadow-[3px_3px_0px_rgba(30,41,59,1)] disabled:opacity-50 py-4 text-base font-bold flex items-center justify-center gap-2 rounded-xl active:translate-y-0.5 active:shadow-none transition-all"
              >
                Find Active Peer Match <Play className="w-4 h-4 fill-white" />
              </button>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-950 font-bold leading-relaxed flex items-center gap-2">
            <span>🛡️</span>
            <span>FluentScribe Privacy Shield: WebRTC calls establish direct peer-to-peer tunnels. No audio/video metadata passes through FluentScribe servers.</span>
          </div>
        </div>
      ) : (

        // 2. ACTIVE LIVE CALL SCREEN (Lobby vs Connected)
        <div className="flex-1 flex flex-col justify-between h-[500px] md:h-[680px] text-slate-800 animate-fade-in relative">

          {/* Header Status Bar */}
          <div className="bg-[#f0ede4] px-4 py-2.5 border-2 border-slate-800 rounded-xl flex items-center justify-between mb-4 shadow-[2px_2px_0px_#1e293b]">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-800 animate-pulse" />
              <span className="text-sm font-bold font-mono">Fluency Call Studio</span>
            </div>

            <div className="flex items-center gap-2">
              {lobby ? (
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 px-3 py-1 rounded-full text-amber-700 font-mono text-xs font-bold animate-pulse">
                  <Loader className="w-3.5 h-3.5 animate-spin text-amber-700" />
                  <span>MATCHING LOBBY...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-full text-emerald-700 font-mono text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                  <span>CONNECTED</span>
                </div>
              )}
            </div>
          </div>

          {/* Main Stage Grid */}
          <div className="flex-1 flex flex-col md:grid md:grid-cols-3 gap-4 min-h-0 relative">

            {/* Large Remote Peer View (Left/Center 2 cols) */}
            <div className="md:col-span-2 relative bg-slate-900 rounded-2xl border-2 border-slate-850 shadow-[3px_3px_0px_#1e293b] overflow-hidden flex items-center justify-center h-60 md:h-full shrink-0">

              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Floating Picture-in-Picture Local Video */}
              {!lobby && (
                <div className="absolute top-4 right-4 w-28 md:w-36 aspect-video bg-slate-800 rounded-xl border-2 border-slate-800 overflow-hidden z-20 shadow-lg shrink-0">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transform scale-x-[-1] ${!localVideoEnabled ? "opacity-0" : ""}`}
                  />
                  {!localVideoEnabled && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-850">
                      <VideoOff className="w-5 h-5 text-slate-400" />
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 bg-black/60 px-1 py-0.5 text-[8px] md:text-[9px] font-bold text-white rounded">
                    You
                  </div>
                </div>
              )}

              {/* Lobby spinner overlay */}
              {lobby && (
                <div className="absolute inset-0 bg-[#faf8f2] flex flex-col items-center justify-center text-center p-4 border-2 border-slate-800">
                  <Globe className="w-16 h-16 text-orange-500 animate-spin mb-4" />
                  <h3 className="text-xl font-bold text-slate-800">Searching active queue...</h3>
                  <p className="text-sm text-slate-500 max-w-[200px] mt-1 font-bold">
                    Looking for another speaking partner...
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar / Chat (Right 1 col) */}
            <div className="md:col-span-1 flex-1 flex flex-col min-h-0">

              {/* Collaborative Chat Box */}
              <div className="flex-1 bg-white border-2 border-slate-800 rounded-xl p-4 flex flex-col justify-between min-h-0 shadow-[2px_2px_0px_#1e293b]">
                <div className="text-sm uppercase font-extrabold text-slate-700 border-b border-slate-200 pb-1.5 flex items-center gap-1.5 shrink-0">
                  <MessageSquare className="w-4 h-4 text-violet-500" /> Live Chat
                </div>

                {/* Messages Feed */}
                <div
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto my-2 space-y-2.5 text-sm py-1"
                  style={{ scrollbarWidth: "none" }}
                >
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-400 italic text-sm text-center font-bold">
                      Match active. Chat messages appear here...
                    </div>
                  ) : (
                    messages.map((msg, i) => (
                      <div key={i} className={`flex flex-col ${msg.isOwn ? "items-end" : "items-start"}`}>
                        <div className="text-[11px] text-slate-500 font-bold mb-0.5">
                          {msg.isOwn ? "You" : msg.senderName}
                        </div>
                        <div className={`px-3 py-2 rounded-xl max-w-[85%] leading-relaxed ${msg.isOwn
                            ? "bg-violet-500 text-white rounded-tr-sm"
                            : "bg-slate-100 text-slate-800 rounded-tl-sm border border-slate-200"
                          }`}>
                          {msg.message}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Form */}
                <form
                  onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                  className="flex gap-1.5 shrink-0"
                >
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type message..."
                    disabled={lobby}
                    className="flex-1 bg-slate-50 border-2 border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 text-slate-800 font-bold disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={lobby || !messageInput.trim()}
                    className="bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white px-3.5 py-2 rounded-lg border-2 border-slate-800 text-sm font-bold active:scale-95 transition-all"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Action Toolbar controls */}
          <div className="mt-4 flex justify-between items-center bg-[#f0ede4] p-3.5 border-2 border-slate-800 rounded-xl shadow-[2px_2px_0px_#1e293b]">
            <div className="flex gap-2">
              <button
                onClick={toggleAudio}
                className={`p-3 rounded-lg border-2 border-slate-800 text-sm font-bold active:scale-95 transition-all ${localAudioEnabled
                    ? "bg-white text-slate-800 hover:bg-slate-50"
                    : "bg-rose-500 text-white hover:bg-rose-600"
                  }`}
              >
                {localAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              <button
                onClick={toggleVideo}
                className={`p-3 rounded-lg border-2 border-slate-800 text-sm font-bold active:scale-95 transition-all ${localVideoEnabled
                    ? "bg-white text-slate-800 hover:bg-slate-50"
                    : "bg-rose-500 text-white hover:bg-rose-600"
                  }`}
              >
                {localVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>
            </div>

            <button
              onClick={endCall}
              className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-lg border-2 border-slate-800 text-sm font-bold flex items-center gap-2 active:translate-y-0.5 active:shadow-none transition-all"
            >
              <PhoneOff className="w-4 h-4" /> Stop Matching
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
