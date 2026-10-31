"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, CornerDownLeft, Sparkles, ShieldCheck } from "lucide-react";

export type VoiceTab = "overview" | "analyze" | "tasks" | "memory" | "digest";

type VoiceCommandProps = {
  onNavigate: (tab: VoiceTab) => void;
  onAnalyze: () => void;
  onLoadSample: () => void;
  hasTranscript: boolean;
};

type SpeechTranscriptResult = { isFinal: boolean; [index: number]: { transcript: string } };
type SpeechTranscriptEvent = { resultIndex: number; results: ArrayLike<SpeechTranscriptResult> };
type SpeechErrorEvent = { error: string };
type BrowserRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechTranscriptEvent) => void) | null;
  onerror: ((event: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => BrowserRecognition;
  webkitSpeechRecognition?: new () => BrowserRecognition;
};

export function interpretVoiceCommand(text: string): 
  | { kind: "navigate"; destination: VoiceTab }
  | { kind: "analyze" }
  | { kind: "sample" }
  | { kind: "help" }
  | { kind: "manual-review" }
  | { kind: "unknown" } {
  const command = text.toLowerCase()
    .replace(/[^\p{L}\p{N} ]/gu, " ")
    .replace(/\s+/g, " ").trim()
    .replace(/^(?:hey |okay |ok |please |wispr |flow |wispr flow )+/i, "");
  if (/\b(?:approve|confirm|publish|post|submit|delete|remove)\b/.test(command)) {
    return { kind: "manual-review" };
  }
  if (/\b(?:load|use|insert)\b.*\b(?:sample|example|demo)\b/.test(command)) {
    return { kind: "sample" };
  }
  if (/\b(?:help|commands|what can i say)\b/.test(command)) {
    return { kind: "help" };
  }
  if (/\b(?:analy[sz]e|process|extract)\b/.test(command) && /\b(?:meeting|transcript|conversation|now|this)\b/.test(command)) {
    return { kind: "analyze" };
  }
  if (/\b(?:tasks|task tracker|action items|to do list|to dos)\b/.test(command)) {
    return { kind: "navigate", destination: "tasks" };
  }
  if (/\b(?:memory|decisions|decision history|past meetings|conflicts)\b/.test(command)) {
    return { kind: "navigate", destination: "memory" };
  }
  if (/\b(?:digest|reminders|deadlines|weekly)\b/.test(command)) {
    return { kind: "navigate", destination: "digest" };
  }
  if (/\b(?:analy[sz]e|new meeting|meeting upload|transcript)\b/.test(command)) {
    return { kind: "navigate", destination: "analyze" };
  }
  if (/\b(?:home|overview|dashboard|start page)\b/.test(command)) {
    return { kind: "navigate", destination: "overview" };
  }
  return { kind: "unknown" };
}

/**
 * A keyboard/desktop-dictation compatible command field and an OPTIONAL
 * browser speech-recognition controller. Wispr Flow is a separate desktop
 * app that writes into focused text fields; this is NOT a Wispr API integration.
 */
export default function VoiceCommandPanel({
  onNavigate,
  onAnalyze,
  onLoadSample,
  hasTranscript
}: VoiceCommandProps) {
  const [command, setCommand] = useState("");
  const [message, setMessage] = useState("Ready. Speak or type a command.");
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognition = useRef<BrowserRecognition | null>(null);

  useEffect(() => {
    const w = window as SpeechWindow;
    setSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
    return () => {
      if (recognition.current) {
        recognition.current.onend = null;
        recognition.current.onresult = null;
        recognition.current.onerror = null;
        recognition.current.abort();
        recognition.current = null;
      }
    };
  }, []);

  const execute = useCallback((raw: string) => {
    const value = raw.trim();
    if (!value) {
      setMessage("Dictate a command into the field first.");
      return;
    }
    const result = interpretVoiceCommand(value);
    if (result.kind === "navigate") {
      onNavigate(result.destination);
      setMessage("Opened " + (result.destination === "overview" ? "Home" : result.destination) + ".");
    } else if (result.kind === "analyze") {
      if (!hasTranscript) {
        onNavigate("analyze");
        setMessage("Add or dictate a transcript first, then say “Analyze meeting.”");
      } else {
        onNavigate("analyze");
        onAnalyze();
        setMessage("Analyzing the transcript. Review results before creating tasks.");
      }
    } else if (result.kind === "sample") {
      onNavigate("analyze");
      onLoadSample();
      setMessage("Loaded a demo transcript. Say “Analyze meeting” next.");
    } else if (result.kind === "help") {
      setMessage("Try: Open Analyze, Analyze meeting, Show tasks, Show memory, Weekly digest, Go home, or Load demo.");
    } else if (result.kind === "manual-review") {
      setMessage("For safety, approvals, posting and deletion must be performed manually in the review interface.");
    } else {
      setMessage("Command not recognized. Try “Open tasks”, “Analyze meeting”, “Weekly digest”, or “Show memory”.");
    }
    setCommand("");
  }, [onAnalyze, hasTranscript, onLoadSample, onNavigate]);

  const toggleMicrophone = () => {
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const w = window as SpeechWindow;
    const Constructor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Constructor) {
      setMessage("Browser speech recognition is unavailable here. Dictate into the command field with Wispr Flow instead.");
      return;
    }
    try {
      const engine = new Constructor();
      recognition.current = engine;
      engine.lang = "en-US";
      engine.continuous = false;
      engine.interimResults = false;
      engine.maxAlternatives = 1;
      engine.onresult = event => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const heard = event.results[i][0]?.transcript || "";
            setCommand(heard);
            execute(heard);
            break;
          }
        }
      };
      engine.onerror = event => {
        const reason = event.error === "not-allowed" ? "Microphone permission denied" :
          event.error === "no-speech" ? "No speech detected" : "Speech recognition error: " + event.error;
        setMessage(reason + ". You can still dictate with the Wispr Flow desktop app.");
      };
      engine.onend = () => {
        setListening(false);
        recognition.current = null;
      };
      engine.start();
      setListening(true);
      setMessage("Browser microphone listening for one command…");
    } catch {
      setListening(false);
      setMessage("Could not start the browser microphone. Use Wispr Flow dictation or type a command.");
    }
  };

  const examples = ["Open Analyze", "Analyze meeting", "Show tasks", "Show memory", "Weekly digest"];
  return <section className="wa-voice" aria-labelledby="voice-command-title">
    <div className="wa-voice-heading">
      <div>
        <div className="wa-eyebrow">Voice control</div>
        <h2 id="voice-command-title">Tell wisprflow.ai what to do.</h2>
      </div>
      <span className="wa-tag">Wispr Flow ready</span>
    </div>
    <p className="wa-voice-explain">
      With the <strong>Wispr Flow desktop app</strong>, place the cursor in this command field, dictate a command,
      then press Enter (or Run command). You can also use the optional browser microphone to issue
      one spoken command directly. Browser speech recognition is separate from Wispr Flow.
    </p>
    <div className="wa-voice-inputs">
      <label className="wa-field wa-voice-field">
        Voice command
        <input
          type="text"
          value={command}
          onChange={event => setCommand(event.target.value)}
          onKeyDown={event => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing) {
              event.preventDefault();
              execute(command);
            }
          }}
          placeholder="Say: Open tasks, Analyze meeting, Show memory…"
          autoComplete="off"
          aria-label="Wispr Flow voice command"
        />
      </label>
      <button type="button" className="wa-btn" onClick={() => execute(command)}>
        <CornerDownLeft size={16} aria-hidden="true" /> Run command
      </button>
      <button
        type="button"
        className={"wa-btn wa-btn-outline" + (listening ? " wa-listening" : "")}
        onClick={toggleMicrophone}
        disabled={!supported && !listening}
        aria-pressed={listening}
        title={supported ? "Use browser speech recognition" : "Browser microphone not supported; Wispr Flow dictation still works"}
      >
        {listening ? <MicOff size={16} aria-hidden="true"/> : <Mic size={16} aria-hidden="true"/>}
        {listening ? "Stop mic" : "Browser mic"}
      </button>
    </div>
    <div className="wa-voice-chips" aria-label="Example voice commands">
      {examples.map(example => <button
        key={example}
        type="button"
        className="wa-chip"
        onClick={() => execute(example)}
      >{example}</button>)}
    </div>
    <div className="wa-voice-status" role="status" aria-live="polite">
      <Sparkles size={16} aria-hidden="true" /> {message}
    </div>
    <p className="wa-small wa-voice-disclaimer">
      <ShieldCheck size={14} aria-hidden="true" />
      No automatic task approval. Browser microphone requires permission; browser recognition may use a third-party speech service.
      Wispr Flow works independently by inserting dictation into focused text fields.
    </p>
  </section>;
}
