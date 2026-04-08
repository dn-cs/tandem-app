"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Game from "./game";

type Role      = "creator" | "joiner";
type RoomState = "loading" | "not-found" | "waiting" | "connected";

export default function Room() {
  const params = useParams<{ code: string }>();
  const code   = params.code.toUpperCase();

  const [myRole] = useState<Role>(() => {
    if (typeof window === "undefined") return "joiner";
    const stored = sessionStorage.getItem(`icst:${code}:role`);
    return stored === "creator" || stored === "joiner" ? stored : "joiner";
  });

  const [roomState, setRoomState] = useState<RoomState>("loading");
  const [dailyUrl,  setDailyUrl]  = useState<string | null>(null);

  const channelRef     = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const initialisedRef = useRef(false);

  useEffect(() => {
    if (initialisedRef.current) return;
    initialisedRef.current = true;

    async function init() {
      const { data } = await supabase
        .from("rooms")
        .select("code, status, daily_url")
        .eq("code", code)
        .single();

      if (!data) {
        setRoomState("not-found");
        return;
      }

      if (data.daily_url) setDailyUrl(data.daily_url);

      const channel = supabase.channel(`room:${code}`);
      channelRef.current = channel;

      channel
        .on("presence", { event: "sync" }, () => {
          const count = Object.keys(channel.presenceState()).length;
          setRoomState(count >= 2 ? "connected" : "waiting");
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await channel.track({ role: myRole, joinedAt: Date.now() });
          }
        });
    }

    init();

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [code, myRole]);

  // ── Room not found ────────────────────────────────────────────────────────
  if (roomState === "not-found") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center min-h-screen px-8 py-16 gap-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-5xl font-bold text-black">Room not found</h1>
          <p className="text-2xl text-gray-500 max-w-sm leading-relaxed">
            We couldn&apos;t find a room with the code{" "}
            <span className="font-bold text-black">{code}</span>. It may have
            expired or the code may be wrong.
          </p>
        </div>
        <Link
          href="/"
          className="flex items-center justify-center w-full max-w-sm py-5 rounded-3xl bg-white border-2 border-gray-200 text-black text-2xl font-semibold shadow-sm active:scale-95 transition-transform"
        >
          Go Home
        </Link>
      </main>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (roomState === "loading") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center min-h-screen px-8">
        <p className="text-3xl text-gray-400">Joining room…</p>
      </main>
    );
  }

  // ── Both players connected → game ─────────────────────────────────────────
  if (roomState === "connected") {
    return <Game code={code} myRole={myRole} dailyUrl={dailyUrl} />;
  }

  // ── Patient waiting screen ────────────────────────────────────────────────
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center min-h-screen overflow-hidden bg-white">
      {/* Decorative pink clusters */}
      <div aria-hidden="true" className="absolute top-0 right-0 pointer-events-none" style={{ width: 240, height: 220, overflow: "visible" }}>
        {[[60,-10],[120,-10],[0,45],[60,45],[120,45],[60,100],[120,100]].map(([x, y], i) => (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: 85, height: 85, borderRadius: "50%", background: "#F76C6C", opacity: 0.28 }} />
        ))}
      </div>
      <div aria-hidden="true" className="absolute bottom-0 left-0 pointer-events-none" style={{ width: 200, height: 200, overflow: "visible" }}>
        {[[-20,30],[-20,100],[48,100]].map(([x, y], i) => (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: 85, height: 85, borderRadius: "50%", background: "#F76C6C", opacity: 0.28 }} />
        ))}
      </div>
      <div aria-hidden="true" className="absolute bottom-0 right-0 pointer-events-none" style={{ width: 160, height: 160, overflow: "visible" }}>
        {[[30,-10],[80,40]].map(([x, y], i) => (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: 85, height: 85, borderRadius: "50%", background: "#F76C6C", opacity: 0.28 }} />
        ))}
      </div>

      {/* Tandem logo */}
      <div className="flex items-center gap-2 mb-6">
        <div className="relative" style={{ width: 36, height: 28 }}>
          <div style={{ position: "absolute", width: 22, height: 22, borderRadius: "50%", background: "#F76C6C", opacity: 0.85, left: 0, top: 3 }} />
          <div style={{ position: "absolute", width: 18, height: 18, borderRadius: "50%", background: "#48AFF3", opacity: 0.85, left: 15, top: 0 }} />
        </div>
        <span style={{ fontSize: "1.2rem", fontWeight: 500, color: "#444" }}>Tandem</span>
      </div>

      <h1 className="text-5xl font-black text-black">Waiting to start...</h1>
    </main>
  );
}
