/**
 * High-Fidelity Text-to-Speech (TTS) Engine for Web Speech Synthesis.
 * Handles voice selection, audio unlocking, markdown stripping, and speech synchronization.
 */

export interface TTSState {
  isSpeaking: boolean;
  isUnlocked: boolean;
  voiceName: string;
}

class TTSEngine {
  private synth: SpeechSynthesis | null = null;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private isUnlocked = false;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private onStateChangeCallbacks: Array<(speaking: boolean) => void> = [];

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
      this.initVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (!voices || voices.length === 0) return;

    // Prefer high-quality, natural English voices
    const preferredVoices = [
      "Google US English",
      "Microsoft Christopher Online (Natural)",
      "Microsoft Guy Online (Natural)",
      "Microsoft Jenny Online (Natural)",
      "Google UK English Male",
      "Alex",
      "Samantha",
      "Daniel",
    ];

    for (const name of preferredVoices) {
      const match = voices.find(
        (v) => v.name.includes(name) || (v.lang.startsWith("en") && v.name.toLowerCase().includes("natural"))
      );
      if (match) {
        this.selectedVoice = match;
        break;
      }
    }

    if (!this.selectedVoice) {
      this.selectedVoice = voices.find((v) => v.lang.startsWith("en")) || voices[0];
    }
  }

  /**
   * Unlocks browser audio policy on user interaction (e.g. clicking start button).
   */
  public unlockAudio(): boolean {
    if (typeof window === "undefined" || !this.synth) return false;
    try {
      this.synth.cancel();
      const silentUtterance = new SpeechSynthesisUtterance(" ");
      silentUtterance.volume = 0.01;
      silentUtterance.rate = 2;
      this.synth.speak(silentUtterance);
      this.isUnlocked = true;
      return true;
    } catch {
      return false;
    }
  }

  public onSpeakingChange(callback: (speaking: boolean) => void): () => void {
    this.onStateChangeCallbacks.push(callback);
    return () => {
      this.onStateChangeCallbacks = this.onStateChangeCallbacks.filter((cb) => cb !== callback);
    };
  }

  private notifyState(speaking: boolean) {
    this.onStateChangeCallbacks.forEach((cb) => {
      try {
        cb(speaking);
      } catch {
        // Safe callback handling
      }
    });
  }

  /**
   * Cleans markdown formatting, citations, code blocks, and math for natural speech.
   */
  public cleanTextForSpeech(text: string): string {
    if (!text) return "";
    return text
      .replace(/[*_#`~]/g, "") // Remove bold, italic, headers, backticks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove markdown links
      .replace(/\{[^}]+\}/g, "") // Remove JSON/braces
      .replace(/```[\s\S]*?```/g, "") // Remove code blocks
      .replace(/\s+/g, " ") // Collapse whitespace
      .trim();
  }

  /**
   * Speaks text using speech synthesis with natural cadence.
   */
  public speak(
    text: string,
    options?: {
      rate?: number;
      pitch?: number;
      volume?: number;
      onEnd?: () => void;
      onError?: () => void;
    }
  ) {
    if (typeof window === "undefined" || !this.synth) return;

    this.stop();

    const cleanText = this.cleanTextForSpeech(text);
    if (!cleanText) return;

    // Split long responses into sentences for lower latency if needed
    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    utterance.rate = options?.rate ?? 1.05;
    utterance.pitch = options?.pitch ?? 1.0;
    utterance.volume = options?.volume ?? 1.0;

    utterance.onstart = () => {
      this.notifyState(true);
    };

    utterance.onend = () => {
      this.notifyState(false);
      this.activeUtterance = null;
      options?.onEnd?.();
    };

    utterance.onerror = () => {
      this.notifyState(false);
      this.activeUtterance = null;
      options?.onError?.();
    };

    this.activeUtterance = utterance;
    this.synth.speak(utterance);
  }

  public stop() {
    if (typeof window === "undefined" || !this.synth) return;
    try {
      this.synth.cancel();
      this.notifyState(false);
      this.activeUtterance = null;
    } catch {
      // Safe stop
    }
  }

  public isSpeaking(): boolean {
    return Boolean(this.synth?.speaking);
  }
}

export const ttsEngine = new TTSEngine();
