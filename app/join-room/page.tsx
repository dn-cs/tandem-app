"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Allowed characters — same set used when generating codes (no I or O)
const ALLOWED = /^[A-HJ-NP-Z]$/;

function TandemLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative" style={{ width: 36, height: 28 }}>
        <div style={{ position: "absolute", width: 22, height: 22, borderRadius: "50%", background: "#F76C6C", opacity: 0.85, left: 0, top: 3 }} />
        <div style={{ position: "absolute", width: 18, height: 18, borderRadius: "50%", background: "#48AFF3", opacity: 0.85, left: 15, top: 0 }} />
      </div>
      <span style={{ fontSize: "1.2rem", fontWeight: 500, color: "#444" }}>Tandem</span>
    </div>
  );
}

// ── Decorative cluster helpers ────────────────────────────────────────────────

function ClusterTopRight() {
  const r = 85;
  const s = 48;
  return (
    <div aria-hidden="true" className="absolute top-0 right-0 pointer-events-none overflow-visible" style={{ width: 240, height: 220 }}>
      {[[60,-10],[120,-10],[0,45],[60,45],[120,45],[60,100],[120,100]].map(([x, y], i) => (
        <div key={i} style={{ position: "absolute", left: x, top: y, width: r, height: r, borderRadius: "50%", background: "#F76C6C", opacity: 0.28 }} />
      ))}
    </div>
  );
}

function ClusterBottomLeft() {
  const r = 85;
  return (
    <div aria-hidden="true" className="absolute bottom-0 left-0 pointer-events-none overflow-visible" style={{ width: 200, height: 200 }}>
      {[[-20,30],[-20,100],[48,100]].map(([x, y], i) => (
        <div key={i} style={{ position: "absolute", left: x, top: y, width: r, height: r, borderRadius: "50%", background: "#F76C6C", opacity: 0.28 }} />
      ))}
    </div>
  );
}

function ClusterBottomRight() {
  const r = 85;
  return (
    <div aria-hidden="true" className="absolute bottom-0 right-0 pointer-events-none overflow-visible" style={{ width: 160, height: 160 }}>
      {[[30,-10],[80,40]].map(([x, y], i) => (
        <div key={i} style={{ position: "absolute", left: x, top: y, width: r, height: r, borderRadius: "50%", background: "#F76C6C", opacity: 0.28 }} />
      ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function JoinRoom() {
  const router  = useRouter();
  const [chars, setChars] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const ref0 = useRef<HTMLInputElement>(null);
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);
  const ref3 = useRef<HTMLInputElement>(null);
  const inputRefs = [ref0, ref1, ref2, ref3];

  const code = chars.join("");

  function handleChange(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.toUpperCase();
    const char = raw.split("").find((c) => ALLOWED.test(c)) ?? "";
    if (!char) {
      // Clear this box if nothing valid
      const next = [...chars];
      next[i] = "";
      setChars(next);
      return;
    }
    const next = [...chars];
    next[i] = char;
    setChars(next);
    if (error) setError("");
    if (i < 3) inputRefs[i + 1].current?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (chars[i]) {
        // Clear current box
        const next = [...chars];
        next[i] = "";
        setChars(next);
      } else if (i > 0) {
        // Move to previous box and clear it
        const next = [...chars];
        next[i - 1] = "";
        setChars(next);
        inputRefs[i - 1].current?.focus();
      }
    }
  }

  async function handleJoin() {
    if (code.length < 4 || loading) return;
    setLoading(true);
    setError("");

    const { data } = await supabase
      .from("rooms")
      .select("code, status")
      .eq("code", code)
      .single();

    if (!data) {
      setError("We couldn't find that room. Check the code and try again.");
      setLoading(false);
      return;
    }

    sessionStorage.setItem(`icst:${code}:role`, "joiner");
    router.push(`/room/${code}`);
  }

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen px-8 py-16 gap-10 overflow-hidden bg-white">
      <ClusterTopRight />
      <ClusterBottomLeft />
      <ClusterBottomRight />

      {/* ── Logo ───────────────────────────────────────────────────────────── */}
      <TandemLogo />

      {/* ── Heading ────────────────────────────────────────────────────────── */}
      <h1 className="text-4xl font-black text-black text-center">Enter Room Code</h1>

      {/* ── 4 boxes ────────────────────────────────────────────────────────── */}
      <div className="flex gap-4" role="group" aria-label="Room code input">
        {inputRefs.map((ref, i) => (
          <input
            key={i}
            ref={ref}
            type="text"
            inputMode="text"
            maxLength={2}
            value={chars[i]}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={loading}
            aria-label={`Code digit ${i + 1}`}
            autoCapitalize="characters"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            className="text-center text-4xl font-bold text-black bg-white focus:outline-none rounded-2xl"
            style={{
              width: 80, height: 88,
              border: `2px solid #F76C6C`,
              boxShadow: chars[i] ? "0 0 0 3px rgba(247,108,108,0.15)" : "none",
            }}
          />
        ))}
      </div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && (
        <p className="text-base text-center" style={{ color: "#F76C6C", maxWidth: 320 }}>
          {error}
        </p>
      )}

      {/* ── Enter button ───────────────────────────────────────────────────── */}
      <button
        onClick={handleJoin}
        disabled={code.length < 4 || loading}
        className="w-full max-w-sm py-5 rounded-full text-white text-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
        style={{ background: "#F76C6C" }}
      >
        {loading ? "Checking…" : "Enter"}
      </button>
    </main>
  );
}
