"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Waveform } from "@/components/Waveform";
import { Spinner } from "@/components/Spinner";
import { NVIDIA_MODELS, type NvidiaModelId } from "@/lib/nvidia-client";
import type { SearchResponse, AppState, SpeechRecognitionEvent, SpeechRecognitionErrorEvent, SpeechRecognitionInstance } from "@/types";

interface QAEntry {
  id: number;
  question: string;
  answer: string;
  model: string;
  timestamp: Date;
}

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [supported, setSupported] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Toggles
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [autoMic, setAutoMic] = useState(false);
  const [selectedModel, setSelectedModel] = useState<NvidiaModelId>(NVIDIA_MODELS[0].id);

  // Conversation history
  const [history, setHistory] = useState<QAEntry[]>([]);
  const historyEndRef = useRef<HTMLDivElement>(null);
  const entryIdRef = useRef(0);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalTranscriptRef = useRef("");
  const autoMicRef = useRef(autoMic);
  const voiceEnabledRef = useRef(voiceEnabled);

  // Keep refs in sync
  useEffect(() => { autoMicRef.current = autoMic; }, [autoMic]);
  useEffect(() => { voiceEnabledRef.current = voiceEnabled; }, [voiceEnabled]);

  // TTS
  const speakAnswer = useCallback((text: string) => {
    if (!voiceEnabledRef.current || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.onstart = () => setIsSpeaking(true);
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    const voices = window.speechSynthesis.getVoices();
    const pv = voices.find(v => v.name.includes("Google") || v.name.includes("Natural"));
    if (pv) u.voice = pv;
    u.rate = 1.0;
    u.pitch = 1.0;
    window.speechSynthesis.speak(u);
  }, []);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) setSupported(false);
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  // Scroll to bottom on new entry
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setState("processing");
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, model: selectedModel, history }),
      });
      const data: SearchResponse = await res.json();
      if (!res.ok || data.error) {
        setErrorMsg(data.error ?? "Something went wrong.");
        setState("error");
        return;
      }
      const entry: QAEntry = {
        id: ++entryIdRef.current,
        question: query,
        answer: data.answer,
        model: data.model,
        timestamp: new Date(),
      };
      setHistory(prev => [...prev, entry]);
      setState("result");
      speakAnswer(data.answer);

      // Auto-mic: restart listening after answer
      if (autoMicRef.current) {
        setTimeout(() => {
          startListeningInternal();
        }, 1500);
      }
    } catch {
      setErrorMsg("Network error. Check your connection and API key.");
      setState("error");
    }
  }, [speakAnswer, selectedModel]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
  }, []);

  const startListeningInternal = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    setState("listening");
    setTranscript("");
    setInterimText("");
    setErrorMsg("");
    finalTranscriptRef.current = "";

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      let finalChunk = "";
      for (let i = e.results.length - 1; i >= 0; i--) {
        if (e.results[i].isFinal) {
          finalChunk = e.results[i][0].transcript;
          break;
        } else {
          interim = e.results[i][0].transcript;
        }
      }
      if (finalChunk) {
        finalTranscriptRef.current += " " + finalChunk;
        setTranscript(finalTranscriptRef.current.trim());
        setInterimText("");
      } else {
        setInterimText(interim);
      }
      if (finalChunk) {
        if (silenceTimer.current) clearTimeout(silenceTimer.current);
        silenceTimer.current = setTimeout(() => {
          recognitionRef.current?.stop();
          doSearch(finalTranscriptRef.current.trim());
        }, 1500);
      }
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error !== "no-speech") {
        let msg = `Microphone error: ${e.error}`;
        if (e.error === "aborted") {
          msg += ". (If on mobile, ensure you are using HTTPS and have granted microphone permissions)";
        }
        setErrorMsg(msg);
        setState("error");
      }
    };
    recognition.onend = () => {};
    recognition.start();
  }, [doSearch]);

  const handleMicClick = () => {
    if (state === "listening") {
      stopListening();
      if (finalTranscriptRef.current.trim()) {
        doSearch(finalTranscriptRef.current.trim());
      } else {
        setState(history.length > 0 ? "result" : "idle");
      }
    } else if (state === "idle" || state === "result" || state === "error") {
      startListeningInternal();
    }
  };

  const handleAutoMicToggle = () => {
    const next = !autoMic;
    setAutoMic(next);
    if (next && (state === "idle" || state === "result")) {
      startListeningInternal();
    }
    if (!next && state === "listening") {
      stopListening();
      setState(history.length > 0 ? "result" : "idle");
    }
  };

  const clearHistory = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setHistory([]);
    setState("idle");
    setTranscript("");
    setInterimText("");
    setErrorMsg("");
  };

  const isListening = state === "listening";
  const isProcessing = state === "processing";

  // ── Toggle button helper ──
  const Toggle = ({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) => (
    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", minHeight: 36, padding: "4px 0" }}>
      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{label}</span>
      <div onClick={onToggle} style={{
        width: 36, height: 20, borderRadius: 999, position: "relative", cursor: "pointer", transition: "all 0.2s ease",
        background: on ? "rgba(56,189,248,0.3)" : "rgba(255,255,255,0.06)",
        border: `1px solid ${on ? "var(--accent)" : "var(--border)"}`,
      }}>
        <div style={{
          position: "absolute", top: 2, left: on ? "calc(100% - 18px)" : 2,
          width: 14, height: 14, borderRadius: "50%", transition: "all 0.2s ease",
          background: on ? "var(--accent)" : "var(--text-muted)",
        }} />
      </div>
    </label>
  );

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", overflow: "hidden" }}>
      {/* BG effects */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(56,189,248,0.06) 0%, transparent 70%)" }} />

      {/* Header with toggles */}
      <header style={{
        width: "100%", maxWidth: 720, padding: "1.5rem 1rem 0.75rem",
        paddingTop: "max(1.5rem, env(safe-area-inset-top))",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "relative", zIndex: 1, gap: "0.5rem", flexWrap: "wrap",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 8px var(--accent)" }} />
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(14px, 5vw, 20px)", letterSpacing: "-0.02em" }}>VoiceSearch</span>
            <span style={{ fontSize: "0.625rem", fontFamily: "var(--font-mono)", color: "var(--accent)", background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", padding: "2px 8px", borderRadius: 999, letterSpacing: "0.1em" }}>AI</span>
          </div>
          <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>ask and get answers instantly</p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {/* New Chat Button */}
          <button 
            onClick={clearHistory}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "6px 10px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              color: "var(--text)",
              fontSize: "0.65rem",
              fontFamily: "var(--font-mono)",
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>NEW CHAT</span>
          </button>

          {/* Model Selector */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 2, border: "1px solid var(--border)", marginRight: 8 }}>
            {NVIDIA_MODELS.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedModel(m.id)}
                style={{
                  fontSize: "0.6rem",
                  fontFamily: "var(--font-mono)",
                  padding: "4px 8px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  background: selectedModel === m.id ? "rgba(56,189,248,0.15)" : "transparent",
                  color: selectedModel === m.id ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                {m.label.split(" ")[0]}
              </button>
            ))}
          </div>
          
          <Toggle on={voiceEnabled} onToggle={() => {
            if (voiceEnabled) { window.speechSynthesis?.cancel(); setIsSpeaking(false); }
            setVoiceEnabled(!voiceEnabled);
          }} label="🔊 Voice" />
          <Toggle on={autoMic} onToggle={handleAutoMicToggle} label="🎙 Auto" />
        </div>
      </header>

      {/* History & Mic Section */}
      <section style={{ 
        width: "100%", 
        maxWidth: 720, 
        padding: "0.5rem 1rem 4rem", 
        position: "relative", 
        zIndex: 1, 
        flex: 1, 
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 24
      }}>
        {/* Empty state greeting */}
        {history.length === 0 && (
          <div style={{ textAlign: "center", marginTop: "2rem", animation: "fade-up 0.5s ease" }}>
            <h1 style={{ fontSize: "clamp(24px, 8vw, 40px)", fontWeight: 800, marginBottom: "0.5rem", background: "linear-gradient(to bottom, #fff, #888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>How can I help you?</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontFamily: "var(--font-mono)" }}>Ask anything by voice — get instant answers.</p>
          </div>
        )}

        {/* Conversation List */}
        {history.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.1em" }}>
                CONVERSATION ({history.length})
              </span>
              <button onClick={clearHistory} style={{
                background: "transparent", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 10px",
                color: "var(--text-muted)", fontSize: "0.65rem", fontFamily: "var(--font-mono)", cursor: "pointer",
              }}>CLEAR</button>
            </div>
            
            {history.map((entry) => (
              <div key={entry.id} style={{ animation: "fade-up 0.4s ease" }}>
                {/* Question */}
                <div style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                    background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
                  </div>
                  <p style={{ fontSize: "clamp(13px, 2.5vw, 15px)", fontWeight: 600, color: "var(--text)", lineHeight: 1.4 }}>
                    {entry.question}
                  </p>
                </div>
                {/* Answer */}
                <div style={{
                  marginLeft: 34,
                  background: "linear-gradient(145deg, var(--surface) 0%, rgba(14,17,23,0.8) 100%)",
                  border: "1px solid var(--border)", borderRadius: 16, padding: "1rem 1.25rem",
                  position: "relative", overflow: "hidden",
                }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(52,211,153,0.3), transparent)" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", boxShadow: "0 0 6px var(--success)" }} />
                    <span style={{ fontSize: "0.625rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.1em" }}>
                      AI • {entry.model.includes("llama") ? "LLAMA" : entry.model.includes("gemma") ? "GEMMA" : "AI"}
                    </span>
                    <span style={{ fontSize: "0.55rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginLeft: "auto" }}>
                      {entry.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div style={{ fontSize: "clamp(14px, 2.5vw, 16px)", lineHeight: 1.6, color: "var(--text)", fontFamily: "var(--font-display)", fontWeight: 400, whiteSpace: "pre-wrap" }}>
                    {entry.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dynamic Mic Section - "After every conversation" */}
        <div style={{ 
          marginTop: history.length > 0 ? 16 : 0,
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          gap: 16,
          padding: "2rem 0",
          borderTop: history.length > 0 ? "1px solid var(--border)" : "none"
        }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {isListening && [0, 1].map(i => (
              <div key={i} style={{ position: "absolute", inset: -20, borderRadius: "50%", border: "1px solid rgba(56,189,248,0.4)", animation: "pulse-ring 2s ease-out infinite", animationDelay: `${i * 0.7}s`, pointerEvents: "none" }} />
            ))}
            <button onClick={handleMicClick} disabled={isProcessing || !supported} style={{
              width: "clamp(64px, 18vw, 80px)", height: "clamp(64px, 18vw, 80px)", borderRadius: "50%",
              background: isListening ? "radial-gradient(circle, rgba(56,189,248,0.2) 0%, rgba(56,189,248,0.05) 100%)" : "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 100%)",
              border: `1.5px solid ${isListening ? "var(--accent)" : "rgba(255,255,255,0.1)"}`,
              cursor: isProcessing ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
              boxShadow: isListening ? "0 0 40px rgba(56,189,248,0.2), inset 0 0 20px rgba(56,189,248,0.05)" : "none",
              transform: isListening ? "scale(1.05)" : "scale(1)",
            }} aria-label={isListening ? "Stop listening" : "Start voice search"}>
              {isProcessing ? <Spinner /> : isListening ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--accent)"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              )}
            </button>
          </div>

          <div style={{ opacity: isListening ? 1 : 0.4, transition: "opacity 0.4s ease" }}><Waveform active={isListening} /></div>

          <div style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(10px, 2vw, 12px)", letterSpacing: "0.15em", textTransform: "uppercase", color: isListening ? "var(--accent)" : "var(--text-muted)", animation: isListening ? "blink 2s ease-in-out infinite" : "none" }}>
            {!supported ? "⚠ Use Chrome/Edge" : isProcessing ? "Thinking..." : isListening ? (autoMic ? "Auto-listening..." : "Listening...") : "Tap to Speak"}
          </div>

          {(transcript || interimText) && (
            <div style={{ maxWidth: 520, textAlign: "center", animation: "fade-up 0.3s ease", padding: "0 1rem", width: "100%" }}>
              <p style={{ fontSize: "clamp(15px, 3.5vw, 18px)", fontWeight: 700, lineHeight: 1.4, color: "var(--text)" }}>
                {transcript}{interimText && <span style={{ color: "var(--text-muted)", fontWeight: 400 }}> {interimText}</span>}
              </p>
            </div>
          )}
          <div ref={historyEndRef} />
        </div>
      </section>

      {/* Error */}
      {state === "error" && (
        <section style={{ width: "100%", maxWidth: 720, padding: "1rem", position: "relative", zIndex: 1, animation: "fade-up 0.3s ease" }}>
          <div style={{ background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 12, padding: "1rem", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: "rgba(248,113,113,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--danger)", marginBottom: 4 }}>Error</p>
              <p style={{ fontSize: "0.8rem", color: "rgba(248,113,113,0.8)", lineHeight: 1.5 }}>{errorMsg}</p>
              {!errorMsg.includes("Microphone") && (
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 6, fontFamily: "var(--font-mono)" }}>Check your .env — ensure NVIDIA_API_KEY is set.</p>
              )}
            </div>
          </div>
        </section>
      )}


    </main>
  );
}
