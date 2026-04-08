"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Choice = "join" | "create" | null;

function TandemLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative" style={{ width: 36, height: 28 }}>
        <div
          style={{
            position: "absolute", width: 22, height: 22, borderRadius: "50%",
            background: "#F76C6C", opacity: 0.85, left: 0, top: 3,
          }}
        />
        <div
          style={{
            position: "absolute", width: 18, height: 18, borderRadius: "50%",
            background: "#48AFF3", opacity: 0.85, left: 15, top: 0,
          }}
        />
      </div>
      <span style={{ fontSize: "1.2rem", fontWeight: 500, color: "#444", letterSpacing: "-0.01em" }}>
        Tandem
      </span>
    </div>
  );
}

export default function Home() {
  const [choice, setChoice] = useState<Choice>(null);
  const router = useRouter();

  function handleContinue() {
    if (choice === "join")   router.push("/join-room");
    if (choice === "create") router.push("/create-room");
  }

  return (
    <main className="flex flex-col items-center justify-between min-h-screen px-8 py-12 bg-white">

      {/* ── Logo ─────────────────────────────────────────────────────────────── */}
      <TandemLogo />

      {/* ── Cards ────────────────────────────────────────────────────────────── */}
      <div className="flex gap-5 w-full max-w-2xl">

        {/* Join a room */}
        <button
          onClick={() => setChoice("join")}
          className="flex-1 flex flex-col justify-between rounded-3xl bg-white active:scale-[0.98] transition-all duration-150"
          style={{
            border: choice === "join" ? "2.5px solid #F76C6C" : "1.5px solid #E0E0E0",
            minHeight: 340,
            padding: "28px 24px",
          }}
          aria-pressed={choice === "join"}
        >
          <div className="flex justify-start pt-4">
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#F76C6C" }} />
          </div>
          <div className="text-left">
            <p className="font-black text-black leading-none" style={{ fontSize: "3rem" }}>Join</p>
            <p className="font-bold text-black" style={{ fontSize: "1.15rem" }}>a room</p>
          </div>
        </button>

        {/* Create a room */}
        <button
          onClick={() => setChoice("create")}
          className="flex-1 flex flex-col justify-between rounded-3xl bg-white active:scale-[0.98] transition-all duration-150"
          style={{
            border: choice === "create" ? "2.5px solid #48AFF3" : "1.5px solid #E0E0E0",
            minHeight: 340,
            padding: "28px 24px",
          }}
          aria-pressed={choice === "create"}
        >
          <div className="flex justify-start pt-4">
            <div style={{ width: 70, height: 70, borderRadius: 18, background: "#48AFF3" }} />
          </div>
          <div className="text-left">
            <p className="font-black text-black leading-none" style={{ fontSize: "3rem" }}>Create</p>
            <p className="font-bold text-black" style={{ fontSize: "1.15rem" }}>a room</p>
          </div>
        </button>
      </div>

      {/* ── Continue ─────────────────────────────────────────────────────────── */}
      <button
        onClick={handleContinue}
        disabled={!choice}
        className="w-full max-w-2xl py-5 rounded-full text-white text-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
        style={{ background: "#888" }}
      >
        Continue
      </button>
    </main>
  );
}
