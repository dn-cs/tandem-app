"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import VideoBubbles from "./video-bubbles";
import { ActivityGuideInline } from "@/app/activity-guide/page";

// ── Starting word pool ────────────────────────────────────────────────────────

const STARTING_WORDS = [
  "Garden",  "Summer",   "Kitchen",    "Music",      "Beach",
  "Family",  "Cooking",  "Holiday",    "Animals",    "Breakfast",
  "Flowers", "Morning",  "River",      "Birthday",   "Memory",
  "Sunshine","Walking",  "Friendship", "Nature",     "Laughter",
  "Home",    "Journey",  "Seasons",    "Afternoon",  "Market",
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface Word {
  id:        string;
  word:      string;
  added_by:  "system" | "creator" | "joiner";
  position:  number;
}

type Role = "creator" | "joiner";

interface GameProps {
  code:      string;
  myRole:    Role;
  dailyUrl:  string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function bubbleBg(word: Word) {
  if (word.added_by === "system")   return "#8B8B8B";
  if (word.added_by === "creator")  return "#48AFF3";
  return "#F76C6C";
}

// ── Info button icon ──────────────────────────────────────────────────────────

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="white" width="22" height="22" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Game({ code, myRole, dailyUrl }: GameProps) {
  const [words,      setWords]      = useState<Word[]>([]);
  const [input,      setInput]      = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showGuide,  setShowGuide]  = useState(false);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const isCaregiver = myRole === "creator";

  // ── Turn logic ─────────────────────────────────────────────────────────────
  const nextPosition      = words.length;
  const whoSpeaks: Role   = nextPosition % 2 === 1 ? "joiner" : "creator";
  const patientSpeaksNext = whoSpeaks === "joiner";
  const currentWord       = words[words.length - 1]?.word ?? "";

  // Panel and turn colours
  const panelBg    = patientSpeaksNext ? "#FCCECE" : "#C8E8FA";
  const turnColor  = patientSpeaksNext ? "#F76C6C" : "#48AFF3";

  // ── Glow logic ─────────────────────────────────────────────────────────────
  // Self-view is always LEFT; remote is RIGHT.
  // Active player's tile glows their colour.
  const localGlowColor = (() => {
    if (myRole === "creator") return patientSpeaksNext ? null : "#48AFF3"; // caregiver self glows blue on their turn
    return patientSpeaksNext ? "#F76C6C" : null;                           // patient self glows red on their turn
  })();
  const remoteGlowColor = (() => {
    if (myRole === "creator") return patientSpeaksNext ? "#F76C6C" : null; // patient remote glows red
    return patientSpeaksNext ? null : "#48AFF3";                           // caregiver remote glows blue
  })();

  // ── Scroll to bottom ────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [words]);

  // ── Auto-focus input (caregiver) ────────────────────────────────────────────
  useEffect(() => {
    if (!isCaregiver || words.length === 0) return;
    const t = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words.length, isCaregiver]);

  // ── Realtime + game init ────────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`game:${code}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "game_words", filter: `room_code=eq.${code}` },
        (payload) => {
          const newWord = payload.new as Word;
          setWords((prev) => {
            if (prev.some((w) => w.id === newWord.id)) return prev;
            return [...prev, newWord].sort((a, b) => a.position - b.position);
          });
        }
      )
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;

        const { data: existing } = await supabase
          .from("game_words")
          .select("*")
          .eq("room_code", code)
          .order("position");

        if (existing && existing.length > 0) {
          setWords(existing as Word[]);
          return;
        }

        if (myRole === "creator") {
          const word = STARTING_WORDS[Math.floor(Math.random() * STARTING_WORDS.length)];
          await supabase.from("game_words").insert({ room_code: code, word, added_by: "system", position: 0 });
        }
      });

    channelRef.current = channel;
    return () => { channel.unsubscribe(); };
  }, [code, myRole]);

  // ── Word submission ─────────────────────────────────────────────────────────
  async function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setInput("");

    const position = words.length;
    const addedBy: Role = position % 2 === 1 ? "joiner" : "creator";

    const { error } = await supabase.from("game_words").insert({
      room_code: code,
      word:      capitalize(trimmed),
      added_by:  addedBy,
      position,
    });

    if (error) setInput(trimmed);
    setSubmitting(false);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">

      {/* ── Video tiles ─────────────────────────────────────────────────────── */}
      <VideoBubbles
        dailyUrl={dailyUrl}
        localGlowColor={localGlowColor}
        remoteGlowColor={remoteGlowColor}
      />

      {/* ── Top-left: Leave button ───────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 z-30 flex flex-col gap-2 pointer-events-auto">
        <Link
          href="/"
          className="flex items-center justify-center px-5 py-2.5 rounded-full text-white text-sm font-semibold active:scale-95 transition-transform"
          style={{ background: "#888" }}
        >
          Leave
        </Link>
      </div>

      {/* ── Word chain (scrollable) ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center px-4 pt-16 pb-4">

          {words.length === 0 && (
            <p className="text-xl text-gray-300 mt-16 select-none">Starting game…</p>
          )}

          <div className="w-full max-w-sm mx-auto flex flex-col items-center">
            {words.map((word, i) => (
              <div key={word.id} className="flex flex-col items-center w-full">
                <div
                  className="w-full flex items-center justify-center px-6 py-4 rounded-full select-none"
                  style={{ background: bubbleBg(word) }}
                >
                  <span className="font-extrabold text-white text-center break-words leading-tight"
                    style={{ fontSize: "2rem" }}>
                    {word.word}
                  </span>
                </div>
                {i < words.length - 1 && (
                  <div style={{ width: 2, height: 18, background: "#E5E7EB" }} />
                )}
              </div>
            ))}
          </div>

          <div ref={bottomRef} className="h-4" />
        </div>
      </div>

      {/* ── Bottom action panel ──────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-6 py-6 transition-colors duration-300"
        style={{ background: words.length === 0 ? "#F5F5F5" : panelBg }}
      >
        {words.length === 0 ? (

          <p className="text-xl text-gray-400 text-center py-3">Getting ready…</p>

        ) : isCaregiver ? (

          // ── Caregiver panel ────────────────────────────────────────────────
          <div className="flex flex-col gap-3 max-w-lg mx-auto">
            <p className="text-xl font-bold text-black text-center">
              {patientSpeaksNext ? "Partner\u2019s word" : "Your word"}
            </p>
            <input
              ref={inputRef}
              type="text"
              inputMode="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              placeholder="Type a word…"
              disabled={submitting}
              className="w-full text-center text-3xl font-bold text-black placeholder-gray-300 bg-white rounded-full px-6 py-4 focus:outline-none"
              style={{ border: "none" }}
              autoCapitalize="words"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || submitting}
              className="w-full py-4 rounded-full text-white text-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
              style={{ background: "#888" }}
            >
              {submitting ? "Adding…" : "Confirm"}
            </button>
          </div>

        ) : patientSpeaksNext ? (

          // ── Patient — their turn ───────────────────────────────────────────
          <div className="flex items-center justify-center py-6">
            <p className="font-black text-black text-center" style={{ fontSize: "3.5rem" }}>
              Your turn
            </p>
          </div>

        ) : (

          // ── Patient — partner's turn ───────────────────────────────────────
          <div className="flex items-center justify-center py-6">
            <p className="font-black text-black text-center" style={{ fontSize: "3.5rem" }}>
              Partner&apos;s turn
            </p>
          </div>

        )}
      </div>

      {/* ── Info button (caregiver only, bottom-right) ───────────────────────── */}
      {isCaregiver && (
        <button
          onClick={() => setShowGuide(true)}
          aria-label="Open activity guide"
          className="fixed bottom-6 right-6 z-30 flex items-center justify-center rounded-full active:scale-90 transition-transform"
          style={{ width: 48, height: 48, background: "#888" }}
        >
          <InfoIcon />
        </button>
      )}

      {/* ── Activity Guide overlay ───────────────────────────────────────────── */}
      {showGuide && (
        <ActivityGuideInline onReturn={() => setShowGuide(false)} />
      )}
    </div>
  );
}
